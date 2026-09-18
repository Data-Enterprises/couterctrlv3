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
 *            keeps its own state — and now matches prod.
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
import { makeResolver, specFor, SPEC_RE, trashPath } from "./relocate.mjs";

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

const LIB = "src/components/", DEVLIB = "src/components-dev/";
const files = execSync("git ls-files -co --exclude-standard src", { encoding: "utf8" })
  .trim().split("\n").filter((f) => existsSync(f) && statSync(f).isFile());
const has = new Set(files);
const resolve = makeResolver(has);
const isTest = (f) => /\.test\.tsx?$/.test(f);
const lf = (s) => s.replace(/\r\n/g, "\n");

// dev path -> prod path, for every kind of dev-only file.
const toProd = (f) => {
  if (f.startsWith(DEV)) return PROD + f.slice(DEV.length);
  if (f.startsWith(DEVLIB)) return LIB + f.slice(DEVLIB.length);
  const slice = f.match(/^src\/features\/dev\/dev(\w)(\w*Slice\.tsx?)$/);
  if (slice) return `src/features/${slice[1].toLowerCase()}${slice[2]}`;
  const unit = f.match(/^(src\/pages\/.+?)\/dev\/(.+)$/);
  if (unit && existsSync(`${unit[1]}/prod`)) return `${unit[1]}/prod/${unit[2]}`;
  return f;
};

// Rewrite a dev file's text for its prod location.
const selectorParams = (src) => {
  const ps = new Set();
  for (const m of src.matchAll(/useAppSelector\(\s*\(?\s*(\w+)/g)) ps.add(m[1]);
  for (const m of src.matchAll(/\b(\w+)\s*:\s*RootState\b/g)) ps.add(m[1]);
  return ps;
};
const promoteText = (from, src) => {
  const to = toProd(from);
  let out = src.replace(SPEC_RE, (m, head, q, spec) => {
    const r = resolve(from, spec);
    if (!r) return m;
    const next = specFor(to, toProd(r.target), r.suffix);
    return next === spec ? m : `${head}${q}${next}${q}`;
  });
  for (const p of selectorParams(out)) out = out.replace(new RegExp(`(?<![.\\w])${p}\\.dev\\.`, "g"), `${p}.prod.`);
  return out.replace(/\bThe dev tree\b/g, "The prod tree").replace(/\bdev tree\b/g, "prod tree");
};
// A dev slice back to its prod form: no "Dev copy" header, the prod name.
const promoteSlice = (from, src, prodName) => {
  let out = promoteText(from, src);
  out = out.replace(/^\/\*\*\r?\n \* Dev copy of [\s\S]*?\*\/\r?\n/, "");
  out = out.replace(
    /^([ \t]*)\/\/ Distinct from the prod slice's "\w+"[^\n]*\n[ \t]*\/\/ string alone[^\n]*\n[ \t]*name:\s*"\w+"/m,
    (m, ind) => `${ind}name: "${prodName}"`,
  );
  return out;
};

// ── the page trees ────────────────────────────────────────────────────────
const devFiles = files.filter((f) => f.startsWith(DEV) && !isTest(f));
const prodFiles = files.filter((f) => f.startsWith(PROD) && !isTest(f));
const writes = new Map(); // prod path -> text
const edgesOf = (f) => {
  if (!/\.tsx?$/.test(f)) return [];
  const out = [];
  for (const m of readFileSync(f, "utf8").matchAll(SPEC_RE)) {
    const r = resolve(f, m[3]);
    if (r) out.push(r.target);
  }
  return out;
};
for (const f of devFiles) {
  const to = toProd(f);
  const text = /\.tsx?$/.test(f) ? promoteText(f, readFileSync(f, "utf8")) : readFileSync(f, "utf8");
  if (!existsSync(to) || lf(readFileSync(to, "utf8")) !== lf(text)) writes.set(to, text);
}
const drops = prodFiles.filter((f) => !devFiles.includes(DEV + f.slice(PROD.length)));

// ── slices and library the dev tree reaches ───────────────────────────────
const sliceWrites = [];
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
      const prodName = readFileSync(twin, "utf8").match(/\bname:\s*"(\w+)"/)?.[1];
      const text = promoteSlice(f, readFileSync(f, "utf8"), prodName);
      if (lf(readFileSync(twin, "utf8")) !== lf(text)) sliceWrites.push({ f, twin, text });
    }
    // Walk the dev tree, the dev library and dev slices; stop anywhere else.
    if (inDevTree || f.startsWith(DEVLIB)) for (const t of edgesOf(f)) stack.push(t);
  }
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
for (const s of sliceWrites) console.log(`      ${s.f} -> ${s.twin}`);
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
if (!writes.size && !drops.length && !sliceWrites.length && !libNew.length && !libApply.length) {
  console.log("\nNothing to promote: prod already matches dev.");
  process.exit(0);
}
if (DRY) process.exit(0);

// ── apply ─────────────────────────────────────────────────────────────────
const put = (f, text) => { mkdirSync(P.dirname(f), { recursive: true }); writeFileSync(f, text); };
for (const [f, text] of writes) put(f, text);
for (const s of sliceWrites) put(s.twin, s.text);
for (const l of [...libNew, ...libApply]) put(l.twin, l.text);
for (const f of drops) {
  const dest = trashPath(f);
  mkdirSync(P.dirname(dest), { recursive: true });
  renameSync(f, dest);
}
console.log(`\nDone. Next:\n  npx tsc -b\n  node scripts/check-split.mjs ${page}`);
