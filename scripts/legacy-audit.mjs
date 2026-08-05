#!/usr/bin/env node
/**
 * legacy-audit.mjs — what can be deleted, and what only looks like it can.
 *
 * WHY THIS EXISTS
 * Pages get built as a dev fork, tested behind `devMode`, approved, and then
 * become the live page. At that point the old one is dead weight — but "old"
 * is not something a filename can tell you. `TeamLegacy.tsx` is imported by
 * the *dev* Organization page. `priceSimulator` is an unrouted dead page whose
 * `calc/` folder is imported by Forecasting. Deleting on name alone breaks the
 * app; deleting on evidence does not.
 *
 * HOW
 * Builds the import graph over src/**, then walks it from src/main.tsx twice:
 *
 *   as-is                        -> everything the running app can reach
 *   with the legacy edges cut    -> what survives once DevPages stops
 *                                   importing the legacy half of each switch
 *
 * The difference is group A. Files neither walk reaches are group B — already
 * dead, deletable now. Group C is the trap list: named like legacy, still
 * imported by live code.
 *
 * The legacy roots are READ OUT OF DevPages.tsx, not hardcoded, so this keeps
 * working as pages graduate. Retire a switch and its root stops being counted
 * on the next run without anyone editing this file.
 *
 * USAGE
 *   npm run audit:legacy
 *   npm run audit:legacy -- --list      every file, not just the summary
 *   npm run audit:legacy -- --json      machine-readable, for scripting a purge
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative, sep } from "node:path";

const ROOT = "src";
const ENTRY = "src/main.tsx";
const DEVPAGES = "src/DevPages.tsx";

/** Entry points the build uses that main.tsx never imports. Without this,
 *  vitest.setup.ts reads as dead and deleting it takes the test suite with
 *  it. Add to this list rather than trusting the walk blindly. */
const BUILD_ENTRIES = new Set(["src/vitest.setup.ts"]);

const args = new Set(process.argv.slice(2));
const LIST = args.has("--list");
const JSON_OUT = args.has("--json");

const norm = (p) => p.split(sep).join("/");

/* ---- files ------------------------------------------------------------ */

const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|jsx?)$/.test(e)) files.push(norm(p));
  }
})(ROOT);

const src = new Map();
const lines = new Map();
for (const f of files) {
  const t = readFileSync(f, "utf8");
  src.set(f, t);
  lines.set(f, t.split("\n").length);
}

/* ---- graph ------------------------------------------------------------ */

const CANDIDATES = ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx"];

const resolveSpec = (from, spec) => {
  if (!spec.startsWith(".")) return null; // node_modules
  const base = resolve(dirname(from), spec);
  for (const ext of CANDIDATES) {
    if (existsSync(base + ext) && statSync(base + ext).isFile()) {
      return norm(relative(process.cwd(), base + ext));
    }
  }
  return null;
};

const specsOf = (t) => {
  const out = [];
  const re =
    /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(t))) out.push(m[1] || m[2] || m[3]);
  return out;
};

const edges = new Map();
for (const f of files) {
  edges.set(f, specsOf(src.get(f)).map((s) => resolveSpec(f, s)).filter(Boolean));
}

/* ---- derive the legacy roots from DevPages ---------------------------- */

/** Everything DevPages imports that is a local component, minus everything it
 *  renders on the devMode side, is the legacy side. Covers both shapes in the
 *  file — the `devMode ? <Dev/> : <Legacy/>` ternaries and NavSwitch's
 *  `if (devMode) return <TitleBar/>` early return. */
function legacyRoots() {
  const text = src.get(DEVPAGES);
  if (!text) {
    console.error(`!! ${DEVPAGES} not found — nothing to cut, A will be empty.`);
    return [];
  }

  const imported = new Map(); // component name -> file
  const re = /import\s+(\w+)\s+from\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(text))) {
    const file = resolveSpec(DEVPAGES, m[2]);
    if (file) imported.set(m[1], file);
  }

  const dev = new Set();
  for (const [, name] of text.matchAll(/devMode\s*\?\s*<(\w+)/g)) dev.add(name);
  for (const [, name] of text.matchAll(/if\s*\(\s*devMode\s*\)\s*return\s*<(\w+)/g))
    dev.add(name);

  const roots = [];
  for (const [name, file] of imported) {
    if (!dev.has(name)) roots.push(file);
  }
  return roots;
}

const LEGACY_ROOTS = legacyRoots();

/* ---- walks ------------------------------------------------------------ */

const reach = (roots, skip = new Set()) => {
  const seen = new Set();
  const stack = [...roots];
  while (stack.length) {
    const f = stack.pop();
    if (!f || seen.has(f)) continue;
    seen.add(f);
    for (const d of edges.get(f) ?? []) {
      if (!skip.has(`${f}->${d}`)) stack.push(d);
    }
  }
  return seen;
};

const live = reach([ENTRY]);
const kept = reach([ENTRY], new Set(LEGACY_ROOTS.map((r) => `${DEVPAGES}->${r}`)));

const dropped = [...live].filter((f) => !kept.has(f)).sort();
const orphans = files.filter((f) => !live.has(f) && !BUILD_ENTRIES.has(f)).sort();

/** Named like legacy, still imported by something that survives. These are
 *  the ones a filename-based purge would delete by mistake. */
const traps = [...kept]
  .filter((f) => /legacy|Legacy|tabletComps|Tablet\.tsx$/.test(f))
  .sort()
  .map((f) => ({
    file: f,
    importedBy: files.filter((x) => kept.has(x) && (edges.get(x) ?? []).includes(f)),
  }));

/* ---- report ----------------------------------------------------------- */

const loc = (l) => l.reduce((a, f) => a + (lines.get(f) ?? 0), 0);
const n = (x) => x.toLocaleString();

if (JSON_OUT) {
  console.log(
    JSON.stringify(
      { legacyRoots: LEGACY_ROOTS, removableWithSwitch: dropped, alreadyDead: orphans, traps },
      null,
      2,
    ),
  );
  process.exit(0);
}

const group = (list) => {
  const g = {};
  for (const f of list) {
    const p = f.split("/");
    (g[p[1] === "pages" ? `pages/${p[2]}` : p.slice(0, 2).join("/")] ??= []).push(f);
  }
  return Object.entries(g).sort((a, b) => loc(b[1]) - loc(a[1]));
};

const section = (title, note, list) => {
  console.log(`\n\n${title} — ${list.length} files, ${n(loc(list))} lines`);
  console.log(`   ${note}\n`);
  for (const [k, v] of group(list)) {
    console.log(`   ${k}  (${v.length} files, ${n(loc(v))} lines)`);
    if (LIST) for (const f of v) console.log(`      ${f}`);
  }
};

console.log(`\n${"=".repeat(70)}`);
console.log("  LEGACY AUDIT");
console.log(`  ${files.length} files, ${n(loc(files))} lines · ${live.size} reachable from ${ENTRY}`);
console.log(`  ${LEGACY_ROOTS.length} legacy roots read from ${DEVPAGES}`);
console.log(`${"=".repeat(70)}`);

section(
  "A. REMOVABLE WHEN THE SWITCH FLIPS",
  "Orphaned once DevPages stops importing the legacy half.",
  dropped,
);
section(
  "B. ALREADY DEAD",
  `Nothing reaches these today. Deletable now.`,
  orphans,
);

console.log(`\n\nC. TRAPS — ${traps.length} files named like legacy, still imported by live code`);
console.log("   A filename-based purge would break the app on these.\n");
if (LIST) {
  for (const t of traps) {
    console.log(`   ${t.file}`);
    for (const i of t.importedBy) console.log(`      <- ${i}`);
  }
} else {
  const byArea = {};
  for (const t of traps) {
    const p = t.file.split("/");
    const k = p[1] === "pages" ? `pages/${p[2]}` : p.slice(0, 2).join("/");
    byArea[k] = (byArea[k] ?? 0) + 1;
  }
  for (const [k, c] of Object.entries(byArea).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${k}  ${c}`);
  }
}

console.log(`
   Re-run after each deletion pass. Removing A orphans a second wave —
   shared helpers only the legacy branches called — and one pass never
   finds all of it.

   --list for every file, --json to script a purge.
`);
