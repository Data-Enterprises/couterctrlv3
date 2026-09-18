#!/usr/bin/env node
/**
 * Proves a page's dev/prod UI split is sound.
 *
 *   node scripts/check-split.mjs sales
 *   npm run check:split -- sales
 *
 * Exits non-zero on any failure, so it can gate a commit. Checks:
 *
 *   1. MIRROR     pages/<page>/prod and pages/<page>/dev hold the same files, and
 *                 each pair is identical apart from the expected swaps
 *                 (state.prod <-> state.dev, prod slices <-> features/dev slices,
 *                 components <-> components-dev). Anything else means one tree
 *                 was edited and the other wasn't — expected while dev work is
 *                 in progress, so this one only WARNS, and lists the files.
 *   2. ISOLATION  at runtime (type-only imports are erased, so they don't count):
 *                   dev tree  reaches no prod UI: src/components (except toasts),
 *                             the prod tree, or a prod slice that has a dev twin
 *                   prod tree reaches no dev UI: src/components-dev, the dev tree,
 *                             or features/dev
 *                   components-dev reaches no src/components (except toasts)
 *   3. IMPORTS    every relative import anywhere in src resolves to a file.
 *   4. DEAD       nothing under pages/<page> or src/components-dev is
 *                 unreachable from src/main.tsx (tests count as entry points).
 */
import { readFileSync, existsSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const P = path.posix;
const page = process.argv[2];
if (!page) {
  console.error("usage: node scripts/check-split.mjs <page>   e.g. sales");
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
const resolve = (from, spec) => {
  const base = P.normalize(P.join(P.dirname(from), spec)).replace(/\/$/, "");
  for (const s of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]) if (has.has(base + s)) return base + s;
  return null;
};

const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const unresolved = [];
const edges = new Map(); // runtime edges only
const allEdges = new Map(); // including type-only, for reachability
for (const f of files) {
  if (!/\.(ts|tsx)$/.test(f)) { edges.set(f, []); allEdges.set(f, []); continue; }
  const src = stripComments(readFileSync(f, "utf8"));
  const rt = [], every = [];
  const re = /(import|export)(\s+type)?\s*([^'";]*?)\s*from\s*["'](\.[^"']*)["']|import\s*\(\s*["'](\.[^"']*)["']\s*\)|import\s+["'](\.[^"']*)["']/g;
  for (const m of src.matchAll(re)) {
    const spec = m[4] || m[5] || m[6];
    const to = resolve(f, spec);
    if (!to) { unresolved.push(`${f} -> ${spec}`); continue; }
    every.push(to);
    const names = (m[3] || "").trim();
    const typeOnly = !!m[2] || /^\{\s*(type\s+\w+\s*,?\s*)+\}$/.test(names);
    if (!typeOnly) rt.push(to);
  }
  edges.set(f, rt);
  allEdges.set(f, every);
}

let failures = 0;
const fail = (msg) => { failures++; console.log(`  FAIL  ${msg}`); };
const ok = (msg) => console.log(`  ok    ${msg}`);

// ── 1. mirror ─────────────────────────────────────────────────────────────
console.log(`\n1. MIRROR  ${PROD} vs ${DEV}`);
// Tests live in dev/ only — dev is where changes are made and tested.
const treeFiles = (root) => files.filter((f) => f.startsWith(root) && !/\.test\.tsx?$/.test(f)).map((f) => f.slice(root.length)).sort();
const prodFiles = treeFiles(PROD), devFiles = treeFiles(DEV);
const onlyProd = prodFiles.filter((f) => !devFiles.includes(f));
const onlyDev = devFiles.filter((f) => !prodFiles.includes(f));
if (onlyProd.length || onlyDev.length) {
  onlyProd.forEach((f) => console.log(`  warn  only in prod/: ${f}`));
  onlyDev.forEach((f) => console.log(`  warn  only in dev/:  ${f}`));
} else ok(`same ${prodFiles.length} files in both trees`);
const norm = (text, tree) => {
  let t = text.replace(/\r/g, "");
  if (tree === "dev")
    t = t
      .replace(/\bstate\.dev\b/g, "state.prod").replace(/\bs\.dev\b/g, "s.prod")
      .replace(/features\/dev\/dev([A-Z])(\w*Slice)/g, (m, a, b) => `features/${a.toLowerCase()}${b}`)
      .replace(/components-dev\//g, "components/")
      .replace(/\bdev tree\b/g, "TREE").replace(/\bThe dev tree\b/g, "The TREE");
  else t = t.replace(/\bprod tree\b/g, "TREE").replace(/\bThe prod tree\b/g, "The TREE");
  return t;
};
// The page's switcher (pages/<page>/<Name>.tsx, importing both trees) names the
// tree entry files, which legitimately differ — prod may still route a layout
// dev has dropped — so they are left out of the comparison.
const switcher = files.find((f) => P.dirname(f) + "/" === PAGE && /\.tsx$/.test(f) &&
  (allEdges.get(f) ?? []).some((d) => d.startsWith(PROD)) && (allEdges.get(f) ?? []).some((d) => d.startsWith(DEV)));
const entry = switcher ? P.basename(switcher) : null;
const drift = prodFiles.filter((f) => devFiles.includes(f) && f !== entry &&
  norm(readFileSync(PROD + f, "utf8"), "prod") !== norm(readFileSync(DEV + f, "utf8"), "dev"));
if (drift.length) drift.forEach((f) => console.log(`  warn  dev differs from prod: ${f}`));
else ok("every shared file identical apart from the expected swaps");

// ── 2. isolation ──────────────────────────────────────────────────────────
console.log("\n2. ISOLATION (runtime imports)");
const devTwinOf = new Set(
  files.filter((f) => /^src\/features\/dev\/dev\w+Slice\.tsx?$/.test(f))
    .map((f) => f.replace(/^src\/features\/dev\/dev(\w)(\w*Slice\.tsx?)$/, (m, a, b) => `src/features/${a.toLowerCase()}${b}`)),
);
const isToast = (f) => f.startsWith("src/components/toasts/");
const walk = (starts, forbidden, label) => {
  const parent = new Map(starts.map((s) => [s, null]));
  const queue = [...starts];
  const hits = [];
  while (queue.length) {
    const f = queue.shift();
    for (const d of edges.get(f) ?? []) {
      if (parent.has(d)) continue;
      parent.set(d, f);
      if (forbidden(d)) { hits.push(d); continue; }
      queue.push(d);
    }
  }
  if (!hits.length) return ok(label);
  for (const h of hits) {
    const chain = [];
    for (let c = h; c; c = parent.get(c)) chain.push(c.replace("src/", ""));
    fail(`${label}:\n          ${chain.reverse().join("\n            -> ")}`);
  }
};
walk(files.filter((f) => f.startsWith(DEV)),
  (f) => (f.startsWith("src/components/") && !isToast(f)) || f.startsWith(PROD) || devTwinOf.has(f),
  "dev tree reaches no prod UI and no prod twin slice");
walk(files.filter((f) => f.startsWith(PROD)),
  (f) => f.startsWith("src/components-dev/") || f.startsWith(DEV) || f.startsWith("src/features/dev/"),
  "prod tree reaches no dev UI");
walk(files.filter((f) => f.startsWith("src/components-dev/")),
  (f) => f.startsWith("src/components/") && !isToast(f),
  "components-dev reaches no prod library component");

// ── 2b. state ─────────────────────────────────────────────────────────────
// Redux reads, which imports can't show: a dev file selecting prod state
// renders prod data no matter which slice it imports.
console.log("\n2b. STATE (Redux reads)");
const reducerKeys = (file) => {
  const src = readFileSync(file, "utf8");
  const block = src.slice(src.indexOf("= {"), src.indexOf("} satisfies"));
  return new Set([...block.matchAll(/^\s*(\w+):\s*\w+,/gm)].map((m) => m[1]));
};
const pageKeys = reducerKeys("src/store/pageReducers.ts");
const devKeys = reducerKeys("src/store/devReducers.ts");
const selectorParams = (src) => {
  const ps = new Set();
  for (const m of src.matchAll(/useAppSelector\(\s*\(?\s*(\w+)/g)) ps.add(m[1]);
  for (const m of src.matchAll(/\b(\w+)\s*:\s*RootState\b/g)) ps.add(m[1]);
  return ps;
};
const reads = (f) => {
  const src = stripComments(readFileSync(f, "utf8"));
  const out = [];
  for (const p of selectorParams(src))
    for (const m of src.matchAll(new RegExp(`(?<![.\\w])${p}\\.(?:(prod|dev)\\.)?(\\w+)`, "g")))
      if (pageKeys.has(m[2])) out.push({ ns: m[1] ?? "root", key: m[2], text: m[0] });
  return out;
};
const stateBad = [];
for (const f of files.filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))) {
  const dev = f.startsWith(DEV) || f.startsWith("src/components-dev/");
  const prod = f.startsWith(PROD);
  if (!dev && !prod) continue;
  for (const r of reads(f)) {
    if (prod && r.ns !== "prod") stateBad.push(`${f}: ${r.text} — the prod tree reads state.prod.*`);
    if (dev && devKeys.has(r.key) && r.ns !== "dev") stateBad.push(`${f}: ${r.text} — "${r.key}" has a dev slice, read state.dev.${r.key}`);
    if (dev && !devKeys.has(r.key) && r.ns === "root") stateBad.push(`${f}: ${r.text} — read state.prod.${r.key} (or fork it: npm run fork:slice)`);
    if (dev && r.ns === "dev" && !devKeys.has(r.key)) stateBad.push(`${f}: ${r.text} — no dev slice mounted at "${r.key}"`);
  }
}
if (stateBad.length) stateBad.forEach((b) => fail(b));
else ok("prod tree reads state.prod, dev tree and components-dev read state.dev for every forked slice");

// ── 3. imports ────────────────────────────────────────────────────────────
console.log("\n3. IMPORTS");
if (unresolved.length) unresolved.forEach((u) => fail(`unresolved ${u}`));
else ok("every relative import in src resolves");

// ── 4. dead ───────────────────────────────────────────────────────────────
console.log("\n4. DEAD");
const reach = new Set();
const stack = ["src/main.tsx", ...files.filter((f) => /\.test\.tsx?$/.test(f))];
while (stack.length) {
  const f = stack.pop();
  if (reach.has(f)) continue;
  reach.add(f);
  for (const d of allEdges.get(f) ?? []) stack.push(d);
}
const dead = files.filter((f) => (f.startsWith(PAGE) || f.startsWith("src/components-dev/")) && !reach.has(f));
if (dead.length) dead.forEach((f) => fail(`unreachable (move to trash/): ${f}`));
else ok(`nothing dead under ${PAGE} or src/components-dev/`);

console.log(failures ? `\n${failures} failure(s)` : "\nall checks passed");
process.exit(failures ? 1 : 0);
