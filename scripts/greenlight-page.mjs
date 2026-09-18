#!/usr/bin/env node
/**
 * Greenlights a Coming Soon page for production: it stops being dev-only and
 * becomes a normal split page, with a prod tree clients see and a dev tree to
 * keep working in.
 *
 *   node scripts/greenlight-page.mjs itemReport [--dry] [--lib | --lib=a,b | --keep-lib]
 *   npm run greenlight:page -- itemReport
 *
 *   1. promote-page: the dev tree is copied into prod/ with the dev -> prod
 *      swaps, changed dev slices are written back onto their prod slices, new
 *      dev-library components are added to the prod library, and prod/'s
 *      placeholder README goes to trash/. The --lib flags are passed through.
 *   2. Each dev-only switcher (the page renders on the dev API only,
 *      DevOnlyNotice elsewhere) is rewritten as a normal one: dev tree on the
 *      dev API, prod tree on prod.
 *
 * What it can't decide, it lists at the end: which nav category the page
 * moves to and who may see it, and the Coming Soon gates on its entry points
 * (useCanSeeComingSoon) and on the other pages that link to it.
 *
 * Nothing is committed. Afterwards: `npx tsc -b`, then
 * `node scripts/check-split.mjs <page>` — it should check as a normal split.
 */
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { execSync, spawnSync } from "node:child_process";
import path from "node:path";

const P = path.posix;
const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const page = args.find((a) => !a.startsWith("--"));
if (!page) {
  console.error("usage: node scripts/greenlight-page.mjs <page> [--dry] [--lib | --lib=a,b | --keep-lib]");
  process.exit(2);
}
const PAGE = `src/pages/${page}/`;
const PROD = `${PAGE}prod/`;
const DEV = `${PAGE}dev/`;

const files = execSync("git ls-files -co --exclude-standard src", { encoding: "utf8" })
  .trim().split("\n").filter((f) => existsSync(f) && statSync(f).isFile());
const prodFiles = files.filter((f) => f.startsWith(PROD));
if (!existsSync(DEV) || !prodFiles.length || !prodFiles.every((f) => f === `${PROD}README.md`)) {
  console.error(`${page} is not a dev-only page (expected ${DEV} and a ${PROD} holding only README.md)`);
  process.exit(2);
}

// The dev-only switchers: page-root .tsx files rendering DevOnlyNotice.
const switchers = files.filter((f) => P.dirname(f) + "/" === PAGE && /\.tsx$/.test(f) &&
  /DevOnlyNotice/.test(readFileSync(f, "utf8")));
if (!switchers.length) { console.error(`no dev-only switcher in ${PAGE}`); process.exit(2); }

console.log(`\nGreenlighting ${page}${DRY ? "   [dry run]" : ""}`);
console.log(`  switchers to make normal: ${switchers.join(", ")}`);

// ── 1. the prod tree, via promote-page ────────────────────────────────────
const passthrough = args.filter((a) => a === "--dry" || a === "--lib" || a === "--keep-lib" || a.startsWith("--lib="));
const r = spawnSync(process.execPath, ["scripts/promote-page.mjs", page, ...passthrough], { stdio: "inherit" });
if (r.status !== 0) {
  console.error("\npromote-page stopped (see above); nothing else was changed.");
  process.exit(r.status ?? 1);
}
if (DRY) process.exit(0);

// ── 2. normal switchers ───────────────────────────────────────────────────
for (const f of switchers) {
  const src = readFileSync(f, "utf8");
  const nl = src.includes("\r\n") ? "\r\n" : "\n";
  const m = src.match(/import Dev(\w+) from "(\.\/dev\/[^"]+)";/);
  if (!m) { console.error(`${f}: can't find the dev-tree import`); process.exit(1); }
  const [, name, devSpec] = m;
  const prodSpec = devSpec.replace(/^\.\/dev\//, "./prod/");
  const hooks = P.relative(P.dirname(f), "src/hooks");
  const withProps = /ComponentProps/.test(src);
  const props = withProps ? " {...props}" : "";
  writeFileSync(f, [
    ...(withProps ? [`import type { ComponentProps } from "react";`] : []),
    `import { useAppSelector } from "${hooks}";`,
    `import Prod${name} from "${prodSpec}";`,
    `import Dev${name} from "${devSpec}";`,
    ``,
    `/**`,
    ` * Which ${name} to show.`,
    ` *`,
    ` * The API switch picks the UI tree as well as the backend: on the dev API you`,
    ` * get \`pages/${page}/dev\`, on prod you get \`pages/${page}/prod\`. Work happens in`,
    ` * dev; when it is signed off, \`node scripts/promote-page.mjs ${page}\` copies it`,
    ` * over prod and the two trees match again until the next change.`,
    ` */`,
    `const ${name} = (${withProps ? `props: ComponentProps<typeof Prod${name}>` : ""}) => {`,
    `  const apiEnv = useAppSelector((state) => state.app.apiEnv);`,
    `  return apiEnv === "dev" ? <Dev${name}${props} /> : <Prod${name}${props} />;`,
    `};`,
    ``,
    `export default ${name};`,
    ``,
  ].join(nl));
  console.log(`  switcher  ${f}: now picks prod or dev by the API switch`);
}

// ── what's left for a person ──────────────────────────────────────────────
// Code outside the page that writes this page's dev slices — e.g. Item
// Actions' hooks/useCriticalReport. While the page was dev-only that was the
// only side; now the prod side needs a version that writes the prod slice.
const devSlices = new Set();
for (const f of files.filter((f) => f.startsWith(DEV) && /\.tsx?$/.test(f)))
  for (const m of readFileSync(f, "utf8").matchAll(/features\/dev\/(dev\w+Slice)"/g)) devSlices.add(m[1]);
const outsideUsers = files.filter((f) => /\.tsx?$/.test(f) && !f.startsWith(PAGE) && !f.startsWith("src/features/") &&
  !f.startsWith("src/store/") && [...devSlices].some((s) => readFileSync(f, "utf8").includes(`features/dev/${s}"`)));
if (outsideUsers.length) {
  console.log(`\nOutside the page, these write the page's dev slice — give the prod side a version that writes the prod slice:`);
  outsideUsers.forEach((f) => console.log(`  ${f}`));
}
console.log(`
Done. Next:
  npx tsc -b
  node scripts/check-split.mjs ${page}      (should now check as a normal split)

Still to do by hand:
  - src/components/navigation/utils.tsx: move the page's entry out of the
    Coming Soon category into the category it belongs to, and set its
    userLevels (["*"] for everyone) — and in the flat \`navigation\` list too
  - entry points gated by useCanSeeComingSoon() that lead to this page (e.g.
    "See item actions" in Sales / Sub Dept / Vendors): drop the gate in the dev
    trees, then promote those pages so the prod trees get the entry point`);
