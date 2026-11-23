#!/usr/bin/env node
/**
 * Promotes the dev component library to prod: every src/components-dev file is
 * written over its src/components twin with the same swaps promote-page makes
 * (promote-common.mjs), and tests/dev/components is copied to
 * tests/prod/components the same way.
 *
 *   node scripts/promote-lib.mjs [--dry] [--keep=a,b]
 *   npm run promote:lib -- --dry
 *
 * --keep names files (paths under src/components-dev/) whose prod copy stays as
 * it is, on purpose. Prod library files with no dev twin (the title bar, the
 * avatar menu) are shared code edited in place: never touched here.
 *
 * Each changed file is listed with the prod files that use it, the reach of the
 * change into prod pages that are not being promoted. Nothing is committed.
 * Afterwards: `npx tsc -b`.
 */
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { makeResolver } from "./relocate.mjs";
import { makePromoter, promoteTestImports, LIB, DEVLIB } from "./promote-common.mjs";

const P = path.posix;
const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const KEEP = new Set((args.find((a) => a.startsWith("--keep="))?.slice(7).split(",") ?? []).map((s) => s.trim()).filter(Boolean));

const list = (where) =>
  execSync(`git ls-files -co --exclude-standard ${where}`, { encoding: "utf8" })
    .trim().split("\n").filter((f) => f && existsSync(f) && statSync(f).isFile());
const files = list("src");
const resolve = makeResolver(new Set(files));
const { toProd, promoteText, promoteSlice, edgesOf } = makePromoter(resolve);
const isTest = (f) => /\.test\.tsx?$/.test(f);
const lf = (s) => s.replace(/\r\n/g, "\n");

for (const k of KEEP)
  if (!existsSync(DEVLIB + k)) { console.error(`--keep=${k}: no such file under ${DEVLIB}`); process.exit(2); }

// ── the library ───────────────────────────────────────────────────────────
const devLib = files.filter((f) => f.startsWith(DEVLIB) && !isTest(f));
const added = [], changed = [], kept = [];
for (const f of devLib) {
  const twin = toProd(f);
  const text = /\.tsx?$/.test(f) ? promoteText(f, readFileSync(f, "utf8")) : readFileSync(f, "utf8");
  const state = !existsSync(twin) ? "add" : lf(readFileSync(twin, "utf8")) !== lf(text) ? "update" : null;
  if (!state) continue;
  if (KEEP.has(f.slice(DEVLIB.length))) { kept.push(twin); continue; }
  (state === "add" ? added : changed).push({ f, twin, text });
}

// Dev slices the library reads are written back over their prod twins, so the
// promoted library finds the same actions and state there.
const slices = [...new Set(devLib.flatMap(edgesOf).filter((t) => /^src\/features\/dev\/dev\w+Slice\.tsx?$/.test(t)))].sort();
const sliceWrites = [];
for (const s of slices) {
  const twin = toProd(s);
  if (!existsSync(twin)) {
    console.error(`${s}: the library reads it and it has no prod twin; promote the page that owns it first`);
    process.exit(1);
  }
  const prodName = readFileSync(twin, "utf8").match(/name:\s*"(\w+)"/)?.[1];
  const text = promoteSlice(s, readFileSync(s, "utf8"), prodName);
  if (lf(readFileSync(twin, "utf8")) !== lf(text)) sliceWrites.push({ s, twin, text });
}

// Prod files outside the library and outside every dev tree that use a file.
const prodUsersOf = (twin) =>
  files.filter((f) => /\.tsx?$/.test(f) && !f.startsWith(DEVLIB) && !f.startsWith(LIB) &&
    !f.startsWith("src/features/dev/") && !/\/dev\//.test(f) && edgesOf(f).includes(twin));

// ── the library's tests ───────────────────────────────────────────────────
const TDEV = "tests/dev/components/", TPROD = "tests/prod/components/";
const testWrites = new Map();
for (const f of existsSync(TDEV) ? list(TDEV) : []) {
  const to = TPROD + f.slice(TDEV.length);
  const text = promoteTestImports(readFileSync(f, "utf8"), null);
  if (!existsSync(to) || lf(readFileSync(to, "utf8")) !== lf(text)) testWrites.set(to, text);
}

// ── report ────────────────────────────────────────────────────────────────
console.log(`\nPromoting ${DEVLIB} -> ${LIB}${DRY ? "   [dry run]" : ""}\n`);
console.log(`  library: ${added.length} new, ${changed.length} changed, ${kept.length} kept`);
for (const l of added) console.log(`      add    ${l.twin}`);
for (const l of changed) {
  const users = prodUsersOf(l.twin);
  console.log(`      update ${l.twin}   (prod users outside the library: ${users.length})`);
  users.slice(0, 8).forEach((u) => console.log(`               ${u}`));
  if (users.length > 8) console.log(`               +${users.length - 8} more`);
}
for (const k of kept) console.log(`      keep   ${k}`);
console.log(`  slices the library reads, written back: ${sliceWrites.length ? "" : "(no changes)"}`);
for (const w of sliceWrites) console.log(`      ${w.s} -> ${w.twin}`);
console.log(`  tests: ${testWrites.size} to write`);
for (const f of testWrites.keys()) console.log(`      ${existsSync(f) ? "update" : "add   "} ${f}`);
if (!added.length && !changed.length && !sliceWrites.length && !testWrites.size) {
  console.log("\nNothing to promote: the prod library already matches dev.");
  process.exit(0);
}
if (DRY) process.exit(0);

// ── apply ─────────────────────────────────────────────────────────────────
const put = (f, text) => { mkdirSync(P.dirname(f), { recursive: true }); writeFileSync(f, text); };
for (const l of [...added, ...changed]) put(l.twin, l.text);
for (const w of sliceWrites) put(w.twin, w.text);
for (const [f, text] of testWrites) put(f, text);
console.log("\nDone. Next:\n  npx tsc -b");
