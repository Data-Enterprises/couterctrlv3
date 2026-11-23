#!/usr/bin/env node
/**
 * Promotes a page's signed-off dev UI to prod: the dev tree replaces the prod
 * tree, and the two match again until the next change.
 *
 *   node scripts/promote-page.mjs categories [--dry] [--lib]
 *   npm run promote:page -- categories
 *
 * Every dev file is written over its prod twin with the dev → prod swaps:
 *
 *   src/components-dev/X          -> src/components/X
 *   features/dev/devXSlice        -> features/xSlice
 *   <unit>/dev/X (a split unit)   -> <unit>/prod/X
 *   state.dev.<key>               -> state.prod.<key>
 *
 * Files only in prod/ go to trash/. What else changes:
 *
 *   SLICES   a forked slice the dev tree uses is written over its prod slice
 *            (header and slice name put back). The dev slice stays — dev
 *            keeps its own state — and now matches prod. A dev slice with no
 *            prod twin yet gets one: written under its prod name, registered
 *            in store/pageReducers.ts (so sign-out clears it), and taken off
 *            sliceIsolation.test.ts's dev-only list.
 *   TESTS    tests/dev/pages/<page> is copied to tests/prod/pages/<page> with
 *            the same swaps on its @/ imports; prod tests with no dev twin, and
 *            tests left inside the prod tree, go to trash/.
 *   LIBRARY  a dev-library file the prod library doesn't have yet is copied
 *            in; nothing in prod uses it, so that is safe. A dev-library file
 *            that DIFFERS from its prod twin is a change to a component other
 *            prod pages use too, so the run stops and lists them with their
 *            prod users. --lib promotes them all, --lib=a,b the ones named,
 *            --keep-lib none (some differences are deliberate: the dev
 *            LoadingIndicator carries no legacy spinner).
 *
 * Nothing is committed. Afterwards: `npx tsc -b`, then
 * `node scripts/check-split.mjs <page>` — the MIRROR check should be clean.
 */
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync, renameSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { makeResolver, trashPath } from "./relocate.mjs";
import { makePromoter, prodNameFromFile, promoteTestImports, LIB, DEVLIB } from "./promote-common.mjs";

const P = path.posix;
const args = process.argv.slice(2);
const DRY = args.includes("--dry");
// --lib: every changed library file. --lib=a,b: only those (paths under
// src/components/). --keep-lib: none — the prod library stays as it is.
const LIB_ALL = args.includes("--lib");
const LIB_SOME = new Set((args.find((a) => a.startsWith("--lib="))?.slice(6).split(",") ?? [])
  .map((s) => s.trim().replace(/^src\/components(-dev)?\//, "")).filter(Boolean));
const KEEP_LIB = args.includes("--keep-lib");
const page = args.find((a) => !a.startsWith("--"));
if (!page) {
  console.error("usage: node scripts/promote-page.mjs <page> [--dry] [--lib | --lib=a,b | --keep-lib]");
  process.exit(2);
}
const PAGE = `src/pages/${page}/`;
const PROD = `${PAGE}prod/`;
const DEV = `${PAGE}dev/`;
for (const d of [PROD, DEV])
  if (!existsSync(d)) { console.error(`missing ${d} — has ${page} been split?`); process.exit(2); }

const files = execSync("git ls-files -co --exclude-standard src", { encoding: "utf8" })
  .trim().split("\n").filter((f) => existsSync(f) && statSync(f).isFile());
const has = new Set(files);
const resolve = makeResolver(has);
const isTest = (f) => /\.test\.tsx?$/.test(f);
const lf = (s) => s.replace(/\r\n/g, "\n");

const { toProd, promoteText, promoteSlice, edgesOf } = makePromoter(resolve);

// ── the page trees ────────────────────────────────────────────────────────
const devFiles = files.filter((f) => f.startsWith(DEV) && !isTest(f));
const prodFiles = files.filter((f) => f.startsWith(PROD) && !isTest(f));
const writes = new Map(); // prod path -> text
for (const f of devFiles) {
  const to = toProd(f);
  const text = /\.tsx?$/.test(f) ? promoteText(f, readFileSync(f, "utf8")) : readFileSync(f, "utf8");
  if (!existsSync(to) || lf(readFileSync(to, "utf8")) !== lf(text)) writes.set(to, text);
}
const drops = prodFiles.filter((f) => !devFiles.includes(DEV + f.slice(PROD.length)));

// ── slices and library the dev tree reaches ───────────────────────────────
const sliceWrites = [];
const slicesReached = []; // every forked slice the page uses, changed or not
const libNew = [], libChanged = [];
{
  const seen = new Set();
  const stack = [...devFiles];
  while (stack.length) {
    const f = stack.pop();
    if (seen.has(f)) continue;
    seen.add(f);
    const inDevTree = f.startsWith(DEV);
    if (f.startsWith(DEVLIB)) {
      const twin = toProd(f);
      const text = /\.tsx?$/.test(f) ? promoteText(f, readFileSync(f, "utf8")) : readFileSync(f, "utf8");
      if (!existsSync(twin)) libNew.push({ f, twin, text });
      else if (lf(readFileSync(twin, "utf8")) !== lf(text)) libChanged.push({ f, twin, text });
    } else if (/^src\/features\/dev\/dev\w+Slice\.tsx?$/.test(f)) {
      const twin = toProd(f);
      const isNew = !existsSync(twin);
      const prodName = isNew
        ? prodNameFromFile(twin)
        : readFileSync(twin, "utf8").match(/\bname:\s*"(\w+)"/)?.[1];
      const text = promoteSlice(f, readFileSync(f, "utf8"), prodName);
      slicesReached.push({ f, twin });
      if (isNew || lf(readFileSync(twin, "utf8")) !== lf(text)) sliceWrites.push({ f, twin, text, isNew });
    }
    // Walk the dev tree, the dev library and dev slices; stop anywhere else.
    if (inDevTree || f.startsWith(DEVLIB)) for (const t of edgesOf(f)) stack.push(t);
  }
}

// ── the page's tests ──────────────────────────────────────────────────────
const TDEV = `tests/dev/pages/${page}/`, TPROD = `tests/prod/pages/${page}/`;
const testFiles = (dir) =>
  existsSync(dir)
    ? execSync(`git ls-files -co --exclude-standard ${dir}`, { encoding: "utf8" }).trim().split("\n").filter((f) => f && existsSync(f))
    : [];
const promoteTest = (src) => promoteTestImports(src, page);
const testWrites = new Map();
for (const f of testFiles(TDEV)) {
  const to = TPROD + f.slice(TDEV.length);
  const text = promoteTest(readFileSync(f, "utf8"));
  if (!existsSync(to) || lf(readFileSync(to, "utf8")) !== lf(text)) testWrites.set(to, text);
}
// Tests still inside the prod tree belong to the old prod tree: the promoted
// tree's tests are the dev ones above, in tests/prod.
const testDrops = [
  ...testFiles(TPROD).filter((f) => !existsSync(TDEV + f.slice(TPROD.length))),
  ...files.filter((f) => f.startsWith(PROD) && isTest(f)),
];
// A written-back slice brings its tests the same way: tests/dev/features/devX*
// -> tests/prod/features/x*, and a test still beside the prod slice goes to trash.
for (const s of slicesReached) {
  const devBase = P.basename(s.f).replace(/\.tsx?$/, "");
  const prodBase = P.basename(s.twin).replace(/\.tsx?$/, "");
  for (const f of testFiles("tests/dev/features/").filter((f) => P.basename(f).startsWith(`${devBase}.`))) {
    const to = `tests/prod/features/${prodBase}${P.basename(f).slice(devBase.length)}`;
    const text = promoteTest(readFileSync(f, "utf8"));
    if (!existsSync(to) || lf(readFileSync(to, "utf8")) !== lf(text)) testWrites.set(to, text);
  }
  for (const f of files.filter((f) => isTest(f) && P.dirname(f) === "src/features" && P.basename(f).startsWith(`${prodBase}.`)))
    testDrops.push(f);
}

// Who in prod uses a changed library file — the blast radius of --lib.
const prodUsersOf = (libFile) => {
  const users = [];
  for (const f of files) {
    if (f.startsWith(DEV) || f.startsWith(DEVLIB) || f.startsWith("src/features/dev/") || !/\.tsx?$/.test(f)) continue;
    if (edgesOf(f).includes(libFile)) users.push(f);
  }
  return users;
};

// ── report ────────────────────────────────────────────────────────────────
console.log(`\nPromoting ${DEV} -> ${PROD}${DRY ? "   [dry run]" : ""}\n`);
console.log(`  tree: ${writes.size} file(s) to write, ${drops.length} prod-only file(s) to trash`);
for (const f of writes.keys()) console.log(`      ${existsSync(f) ? "update" : "add   "} ${f}`);
for (const f of drops) console.log(`      trash  ${f}`);
console.log(`  slices: ${sliceWrites.length ? "" : "(no changes)"}`);
for (const s of sliceWrites) console.log(`      ${s.f} -> ${s.twin}${s.isNew ? "   (new: registered in pageReducers)" : ""}`);
console.log(`  tests: ${testWrites.size} to write, ${testDrops.length} prod-only to trash`);
for (const f of testWrites.keys()) console.log(`      ${existsSync(f) ? "update" : "add   "} ${f}`);
for (const f of testDrops) console.log(`      trash  ${f}`);
console.log(`  library: ${libNew.length} new, ${libChanged.length} changed`);
for (const l of libNew) console.log(`      add    ${l.twin}`);
const libPicked = (l) => LIB_ALL || LIB_SOME.has(l.twin.slice(LIB.length));
for (const n of LIB_SOME)
  if (!libChanged.some((l) => l.twin === LIB + n)) {
    console.error(`--lib=${n}: not a changed library file this page reaches`);
    process.exit(2);
  }
for (const l of libChanged) {
  const users = prodUsersOf(l.twin);
  const verdict = libPicked(l) ? "update " : KEEP_LIB || LIB_SOME.size ? "keep   " : "CHANGED";
  console.log(`      ${verdict} ${l.twin}   (prod users: ${users.length})`);
  users.slice(0, 12).forEach((u) => console.log(`               ${u}`));
  if (users.length > 12) console.log(`               +${users.length - 12} more`);
}
if (libChanged.length && !LIB_ALL && !LIB_SOME.size && !KEEP_LIB) {
  console.log(`\nSTOP: the dev library differs from prod in components other prod pages share\n` +
    `(above). Choose: --lib promotes them all, --lib=<file,...> promotes those, --keep-lib\n` +
    `leaves the prod library alone (tsc -b then shows whether the page needed them).`);
  process.exit(1);
}
const libApply = libChanged.filter(libPicked);
if (!writes.size && !drops.length && !sliceWrites.length && !libNew.length && !libApply.length && !testWrites.size && !testDrops.length) {
  console.log("\nNothing to promote: prod already matches dev.");
  process.exit(0);
}
if (DRY) process.exit(0);

// ── apply ─────────────────────────────────────────────────────────────────
const put = (f, text) => { mkdirSync(P.dirname(f), { recursive: true }); writeFileSync(f, text); };
for (const [f, text] of writes) put(f, text);
for (const s of sliceWrites) put(s.twin, s.text);
for (const l of [...libNew, ...libApply]) put(l.twin, l.text);
for (const [f, text] of testWrites) put(f, text);
for (const f of [...drops, ...testDrops]) {
  const dest = trashPath(f);
  mkdirSync(P.dirname(dest), { recursive: true });
  renameSync(f, dest);
}
// A new prod slice: mounted in pageReducers under its dev twin's key, and off
// the dev-only list in sliceIsolation.test.ts.
for (const s of sliceWrites.filter((w) => w.isNew)) {
  const devReducers = readFileSync("src/store/devReducers.ts", "utf8");
  const devFile = P.basename(s.f).replace(/\.tsx?$/, "");
  const devImport = devReducers.match(new RegExp(`import (\\w+) from "\\.\\./features/dev/${devFile}"`))?.[1];
  const key = devImport && devReducers.match(new RegExp(`^\\s+(\\w+): ${devImport},`, "m"))?.[1];
  if (!key) {
    console.error(`${s.f}: no key for it in store/devReducers.ts; register it by hand`);
    process.exit(1);
  }
  const prodImport = `${key}Reducer`;
  const PR = "src/store/pageReducers.ts";
  let pr = readFileSync(PR, "utf8");
  const nl = pr.includes("\r\n") ? "\r\n" : "\n";
  const lastImport = [...pr.matchAll(/^import \w+ from "\.\.\/features\/\w+";/gm)].at(-1);
  const at = lastImport.index + lastImport[0].length;
  pr = pr.slice(0, at) + `${nl}import ${prodImport} from "../features/${P.basename(s.twin).replace(/\.tsx?$/, "")}";` + pr.slice(at);
  pr = pr.replace(/(\r?\n)\} satisfies Record<string, Reducer>;/, `$1  ${key}: ${prodImport},$1} satisfies Record<string, Reducer>;`);
  writeFileSync(PR, pr);
  const SI = "src/store/sliceIsolation.test.ts";
  const si = readFileSync(SI, "utf8");
  const next = si.replace(new RegExp(`(?:^[ \\t]*//[^\\n]*\\n)*^[ \\t]*"${key}",\\r?\\n`, "m"), "");
  if (next !== si) writeFileSync(SI, next);
  console.log(`  registered ${key} in ${PR}${next !== si ? `; off the dev-only list in ${SI}` : ""}`);
}
console.log(`\nDone. Next:\n  npx tsc -b\n  node scripts/check-split.mjs ${page}`);
