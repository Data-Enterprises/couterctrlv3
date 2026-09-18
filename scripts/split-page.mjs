#!/usr/bin/env node
/**
 * Forks a page into a prod UI tree and a dev UI tree.
 *
 *   node scripts/split-page.mjs categories [--dry] [--fork key,..] [--share key,..]
 *   npm run split:page -- categories
 *
 * What it does, in order:
 *
 *   1. Finds the page's ENTRIES — files under pages/<page>/ that code outside
 *      the page imports (the router). Each must be a default-exported
 *      component imported only by default, because it becomes a switcher at
 *      the same path and every outside import keeps working unchanged.
 *      Any other page file imported from outside is a blocker: it is shared
 *      code living in a page, and has to move to src/ first.
 *   2. The TREE is everything under the page the entries reach. It is copied
 *      to pages/<page>/prod/ and pages/<page>/dev/ (tests go to dev/ only).
 *      Page files the entries don't reach are left alone and listed — they
 *      are dead or legacy, and check-split's DEAD check will flag them.
 *   3. DEV LIBRARY: every src/components file the tree reaches (toasts aside)
 *      that src/components-dev lacks is copied there, and the dev tree is
 *      pointed at src/components-dev.
 *   4. DEV SLICES: every page slice the tree uses is forked into
 *      features/dev/dev<Name>Slice.ts with a distinct slice name, mounted in
 *      store/devReducers.ts, and the dev tree reads state.dev.<key> — dev and
 *      prod each get their own Redux state, as Sales has. Code OUTSIDE the
 *      page that uses the same slice stays on prod state and is listed: if
 *      the dev tree renders it (a modal borrowed from another page), it needs
 *      a look. --share keeps a slice prod-side (dev reads state.prod).
 *   5. Selectors: page-slice reads become state.prod.<key> in the prod tree,
 *      and state.dev.<key> (forked) or state.prod.<key> (shared) in dev.
 *   6. The original files go to trash/ (same path, restorable) and each entry
 *      is replaced by a switcher picking the tree from app.apiEnv.
 *
 * Nothing is committed. Afterwards: `npx tsc -b`, then
 * `node scripts/check-split.mjs <page>`, then cut what the new trees don't
 * need (tablet routes and the like) and trash what that leaves dead.
 */
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync, renameSync, readdirSync, rmdirSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { relocate, trashPath } from "./relocate.mjs";

const P = path.posix;
const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const listArg = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1].split(",").map((s) => s.trim()).filter(Boolean) : [];
};
const FORCE_FORK = new Set(listArg("--fork"));
const FORCE_SHARE = new Set(listArg("--share"));
// --dev-only: a Coming Soon page. dev/ tree only, no prod/ tree; the switcher
// renders the page on the dev API and DevOnlyNotice everywhere else.
const DEV_ONLY = args.includes("--dev-only");
// --entry a.tsx,b.tsx: entry files (relative to the page) when nothing routes
// to the page yet — e.g. a route that is commented out.
const ENTRY_ARGS = listArg("--entry");
const page = args.find((a, i) => !a.startsWith("--") && !["--fork", "--share", "--entry"].includes(args[i - 1]));
if (!page) {
  console.error("usage: node scripts/split-page.mjs <page> [--dry] [--fork key,..] [--share key,..]");
  process.exit(2);
}
const PAGE = `src/pages/${page}/`;
const PROD = `${PAGE}prod/`;
const DEV = `${PAGE}dev/`;
if (!existsSync(PAGE)) { console.error(`no ${PAGE}`); process.exit(2); }
if (existsSync(PROD) || existsSync(DEV)) { console.error(`${page} is already split (${PROD} or ${DEV} exists)`); process.exit(2); }

const die = (msg) => { console.error(`\nSTOP: ${msg}`); process.exit(1); };

// ── the import graph ──────────────────────────────────────────────────────
const files = execSync("git ls-files -co --exclude-standard src", { encoding: "utf8" })
  .trim().split("\n").filter((f) => existsSync(f) && statSync(f).isFile());
const has = new Set(files);
const resolve = (from, spec) => {
  const base = P.normalize(P.join(P.dirname(from), spec)).replace(/\/$/, "");
  for (const s of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]) if (has.has(base + s)) return base + s;
  return null;
};
const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const IMPORT_RE = /(import|export)(\s+type)?\s*([^'";]*?)\s*from\s*["'](\.[^"']*)["']|import\s*\(\s*["'](\.[^"']*)["']\s*\)|import\s+["'](\.[^"']*)["']/g;
const edges = new Map(); // file -> [{ to, names, runtime }]
const text = new Map();
for (const f of files) {
  if (!/\.(ts|tsx)$/.test(f)) { edges.set(f, []); continue; }
  const src = readFileSync(f, "utf8");
  text.set(f, src);
  const out = [];
  for (const m of strip(src).matchAll(IMPORT_RE)) {
    const to = resolve(f, m[4] || m[5] || m[6]);
    if (!to) continue;
    const names = (m[3] || "").replace(/\s+/g, " ").trim();
    out.push({ to, names, runtime: !(m[2] || /^\{\s*(type\s+\w+\s*,?\s*)+\}$/.test(names)) });
  }
  edges.set(f, out);
}
const importers = new Map();
for (const [f, es] of edges) for (const e of es) (importers.get(e.to) ?? importers.set(e.to, []).get(e.to)).push({ from: f, ...e });

// Live = reachable from main.tsx or a test, not through a *Legacy* file.
const live = new Set();
{
  const stack = ["src/main.tsx", ...files.filter((f) => /\.test\.tsx?$/.test(f))];
  while (stack.length) {
    const f = stack.pop();
    if (live.has(f) || /Legacy/.test(P.basename(f))) continue;
    live.add(f);
    for (const e of edges.get(f) ?? []) stack.push(e.to);
  }
}

const inPage = (f) => f.startsWith(PAGE);
const isTest = (f) => /\.test\.tsx?$/.test(f);

// ── 1. entries and blockers ───────────────────────────────────────────────
const outsideUses = new Map(); // page file -> outside importers (live only)
for (const f of files) {
  if (!inPage(f)) continue;
  const outs = (importers.get(f) ?? []).filter((i) => !inPage(i.from) && live.has(i.from));
  if (outs.length) outsideUses.set(f, outs);
}
const entries = [];
const blockers = [];
for (const [f, outs] of outsideUses) {
  const defaultOnly = outs.every((o) => /^[A-Za-z_$][\w$]*$/.test(o.names));
  const hasDefault = /\bexport\s+default\b/.test(text.get(f) ?? "");
  if (/\.tsx$/.test(f) && defaultOnly && hasDefault) entries.push(f);
  else blockers.push({ f, outs });
}
for (const e of ENTRY_ARGS) {
  const f = PAGE + e;
  if (!has.has(f)) die(`--entry ${e}: no ${f}`);
  if (!/\bexport\s+default\b/.test(text.get(f) ?? "")) die(`--entry ${e}: ${f} has no default export`);
  if (!entries.includes(f)) entries.push(f);
}
if (!entries.length) die(`nothing outside ${PAGE} imports this page — no entry to switch on (name one with --entry)`);

// ── 2. the tree ───────────────────────────────────────────────────────────
const tree = new Set();
{
  const stack = [...entries];
  while (stack.length) {
    const f = stack.pop();
    if (tree.has(f) || !inPage(f)) continue;
    tree.add(f);
    for (const e of edges.get(f) ?? []) stack.push(e.to);
  }
}
// A non-entry tree file that outside code imports can't be moved: those
// importers would be left pointing at a file in trash/. Nor can a page file
// outside code imports that itself imports tree files (an adapter the page
// calls): it stays in place, and its imports would go to trash.
const stuck = blockers.filter((b) => tree.has(b.f) || (edges.get(b.f) ?? []).some((e) => tree.has(e.to)));
if (stuck.length)
  die(`these page files are imported from outside the page and are not entries.\n` +
    `Move them to src/ (components, hooks, utils, interfaces) first:\n  ` +
    stuck.map((b) => `${b.f}\n      used by ${b.outs.map((o) => `${o.from} { ${o.names} }`).join("\n              ")}`).join("\n  "));
const tests = files.filter((f) => inPage(f) && isTest(f) && (edges.get(f) ?? []).some((e) => tree.has(e.to)));
const isDoc = (f) => /\.(md|txt)$/i.test(f);
const docs = files.filter((f) => inPage(f) && isDoc(f));
const leftovers = files.filter((f) => inPage(f) && !tree.has(f) && !tests.includes(f) && !isDoc(f));
// Leftovers that import tree files lose those imports when the originals go
// to trash — tsc will name them. They are dead or legacy by construction.
const breaking = leftovers.filter((f) => (edges.get(f) ?? []).some((e) => tree.has(e.to)));

// ── 3. the dev library closure ────────────────────────────────────────────
const LIB = "src/components/", DEVLIB = "src/components-dev/";
const isToast = (f) => f.startsWith(`${LIB}toasts/`);
const libCopies = {}; // components-dev path -> components path
{
  const seen = new Set();
  const stack = [...tree].flatMap((f) => (edges.get(f) ?? []).map((e) => e.to));
  while (stack.length) {
    const f = stack.pop();
    if (seen.has(f) || !f.startsWith(LIB) || isToast(f)) continue;
    seen.add(f);
    const twin = DEVLIB + f.slice(LIB.length);
    if (has.has(twin)) {
      // Already in the dev library: follow the dev version's own imports.
      for (const e of edges.get(twin) ?? []) if (e.to.startsWith(DEVLIB)) stack.push(LIB + e.to.slice(DEVLIB.length));
      continue;
    }
    libCopies[twin] = f;
    for (const e of edges.get(f) ?? []) stack.push(e.to);
  }
}

// ── already-split units the tree uses ─────────────────────────────────────
// A switcher (X.tsx beside prod/ and dev/, importing one file from each) picks
// its tree at runtime; the new trees skip it and import their own side, so
// the prod tree never reaches dev UI through it and vice versa. This is how
// a shared unit (pages/shared/itemPerf) that was split first is picked up by
// the pages that use it.
const switchers = []; // { switcher, prod, dev }
for (const f of files) {
  if (!/\.tsx$/.test(f) || inPage(f)) continue;
  const dir = P.dirname(f) + "/";
  const es = (edges.get(f) ?? []).filter((e) => e.runtime);
  const prod = es.find((e) => e.to.startsWith(`${dir}prod/`))?.to;
  const dev = es.find((e) => e.to.startsWith(`${dir}dev/`))?.to;
  if (prod && dev && [...tree].some((t) => (edges.get(t) ?? []).some((e) => e.to === f)))
    switchers.push({ switcher: f, prod, dev });
}

// ── 4. slices ─────────────────────────────────────────────────────────────
const parseReducers = (file) => {
  const src = readFileSync(file, "utf8");
  const mods = new Map(); // import ident -> module file
  for (const m of src.matchAll(/^import (\w+) from "(\.[^"]+)";/gm)) mods.set(m[1], resolve(file, m[2]));
  const block = src.slice(src.indexOf("= {"), src.indexOf("} satisfies"));
  const keys = new Map(); // key -> module file
  for (const m of block.matchAll(/^\s*(\w+):\s*(\w+),/gm)) keys.set(m[1], mods.get(m[2]));
  return keys;
};
const pageKeys = parseReducers("src/store/pageReducers.ts");
const devKeys = parseReducers("src/store/devReducers.ts");
const devFileFor = (mod) => {
  const base = P.basename(mod).replace(/\.tsx?$/, "");
  return `src/features/dev/dev${base[0].toUpperCase()}${base.slice(1)}.ts`;
};

const selectorParams = (src) => {
  const ps = new Set();
  for (const m of src.matchAll(/useAppSelector\(\s*\(?\s*(\w+)/g)) ps.add(m[1]);
  for (const m of src.matchAll(/\b(\w+)\s*:\s*RootState\b/g)) ps.add(m[1]);
  return ps;
};
const readsKey = (src, key) => [...selectorParams(src)].some((p) =>
  new RegExp(`(?<![.\\w])${p}\\.(?:prod\\.|dev\\.)?${key}\\b`).test(src));
// Uses the slice's STATE: dispatches one of its actions or selects from it.
// A type-only import (a union, a row shape) doesn't count.
const usesKey = (f, key, mod) =>
  (edges.get(f) ?? []).some((e) => e.to === mod && e.runtime) || readsKey(text.get(f) ?? "", key);

// Outside code sharing the state. Importing only reset* actions doesn't count:
// that is sign-out (TitleBar), and the dev namespace resets itself then.
const sharesKey = (f, key, mod) =>
  (edges.get(f) ?? []).some((e) => e.to === mod && e.runtime &&
    !/^\{\s*(reset\w*\s*,?\s*)+\}$/.test(e.names)) || readsKey(text.get(f) ?? "", key);

const candidates = [...pageKeys].filter(([key, mod]) => mod && [...tree].some((f) => usesKey(f, key, mod)));
const fork = [], share = [];
for (const [key, mod] of candidates) {
  const others = files.filter((f) => !inPage(f) && live.has(f) && f !== mod && !f.startsWith("src/store/") &&
    !f.startsWith("src/features/dev/") && !/\.test\.tsx?$/.test(f) && /\.(ts|tsx)$/.test(f) && sharesKey(f, key, mod));
  const shared = FORCE_SHARE.has(key);
  (shared ? share : fork).push({ key, mod, dev: devFileFor(mod), exists: devKeys.has(key), others });
}
for (const k of FORCE_FORK) if (!candidates.some(([key]) => key === k)) die(`--fork ${k}: the ${page} tree doesn't use that slice`);

// ── report ────────────────────────────────────────────────────────────────
console.log(`\nSplitting ${PAGE}${DRY ? "   [dry run]" : ""}`);
console.log(`\n  entries (become switchers): ${entries.join(", ")}`);
console.log(`  tree: ${tree.size} file(s) -> prod/ and dev/${tests.length ? `, ${tests.length} test(s) -> dev/ only` : ""}`);
if (leftovers.length) {
  console.log(`  not reached from the entries (left in place — dead or legacy?):`);
  leftovers.forEach((f) => console.log(`      ${f}${breaking.includes(f) ? "   <- imports tree files; will break, trash it" : ""}`));
}
if (switchers.length) {
  console.log(`  split units used (each tree imports its own side, not the switcher):`);
  switchers.forEach((s) => console.log(`      ${s.switcher} -> ${s.prod} | ${s.dev}`));
}
console.log(`  dev library: ${Object.keys(libCopies).length} component file(s) to add to ${DEVLIB}`);
Object.values(libCopies).forEach((f) => console.log(`      ${f}`));
console.log(`  slices forked for dev: ${fork.length ? "" : "(none)"}`);
fork.forEach((s) => {
  console.log(`      ${s.key}  ${s.mod} -> ${s.dev}${s.exists ? "  (already forked, reused)" : ""}`);
  if (s.others.length) {
    console.log(`        also used outside ${PAGE} — these stay on prod state; check any the dev tree renders:`);
    s.others.forEach((o) => console.log(`          ${o}`));
  }
});
if (share.length) {
  console.log(`  slices kept shared (--share; dev reads state.prod):`);
  share.forEach((s) => console.log(`      ${s.key}`));
}
if (DRY) process.exit(0);

// ── apply: run 1 — dev library and dev slices ─────────────────────────────
const newSlices = fork.filter((s) => !s.exists);
relocate({
  copies: { ...libCopies, ...Object.fromEntries(newSlices.map((s) => [s.dev, s.mod])) },
  redirects: [
    { under: DEVLIB, from: `${LIB}toasts/`, to: `${LIB}toasts/` },
    { under: DEVLIB, from: LIB, to: DEVLIB },
  ],
});
for (const s of newSlices) {
  let src = readFileSync(s.dev, "utf8");
  const nl = src.includes("\r\n") ? "\r\n" : "\n";
  const name = src.match(/\bname:\s*"(\w+)"/)?.[1];
  if (!name) die(`no \`name: "..."\` in ${s.mod}`);
  const devName = `dev${name[0].toUpperCase()}${name.slice(1)}`;
  src = src.replace(/^([ \t]*)name:\s*"\w+"/m, (m, ind) =>
    `${ind}// Distinct from the prod slice's "${name}": Redux matches actions on this${nl}` +
    `${ind}// string alone, so sharing it would move prod and dev together.${nl}${ind}name: "${devName}"`);
  src = [
    "/**",
    ` * Dev copy of \`${s.mod.replace("src/", "")}\`, mounted at \`state.dev.${s.key}\` and read only`,
    ` * by \`pages/${page}/dev\`. Edit this one while changing dev ${page}; when dev is`,
    " * promoted, it replaces the prod slice. See src/store/devReducers.ts.",
    " */",
  ].join(nl) + nl + src;
  writeFileSync(s.dev, src);
}

// ── apply: run 2 — the two trees ──────────────────────────────────────────
const treeCopies = {};
for (const f of tree) {
  const rel = f.slice(PAGE.length);
  if (!DEV_ONLY) treeCopies[PROD + rel] = f;
  treeCopies[DEV + rel] = f;
}
for (const f of tests) treeCopies[DEV + f.slice(PAGE.length)] = f;
// Docs (a module README) are never imported, so they aren't in the tree — but
// they describe it, so both trees carry them.
for (const f of docs) {
  if (!DEV_ONLY) treeCopies[PROD + f.slice(PAGE.length)] = f;
  treeCopies[DEV + f.slice(PAGE.length)] = f;
}
relocate({
  copies: treeCopies,
  redirects: [
    ...switchers.flatMap((s) => [
      { under: PROD, from: s.switcher, to: s.prod },
      { under: DEV, from: s.switcher, to: s.dev },
    ]),
    { under: DEV, from: `${LIB}toasts/`, to: `${LIB}toasts/` },
    { under: DEV, from: LIB, to: DEVLIB },
    ...fork.map((s) => ({ under: DEV, from: s.mod, to: s.dev })),
  ],
});

// A Coming Soon page's prod/ is created empty, ready for greenlight. Git keeps
// no empty folders, so it holds a README saying why it is empty — which is
// also how check-split recognises a dev-only page.
if (DEV_ONLY) {
  mkdirSync(PROD, { recursive: true });
  writeFileSync(`${PROD}README.md`, [
    `# ${page} — prod tree (empty)`,
    ``,
    `This is a Coming Soon page: it is dev only. Its UI lives in \`../dev/\`, it`,
    `renders only on the dev API, and on the prod API (what clients see) the`,
    `switcher shows DevOnlyNotice instead.`,
    ``,
    `This folder stays empty until the page is greenlit for production. Then the`,
    `dev tree is copied here and set up for prod, the switcher is changed to pick`,
    `a tree like every other split page, and this README goes.`,
    ``,
  ].join("\n"));
}

// ── selectors ─────────────────────────────────────────────────────────────
const forked = new Set(fork.map((s) => s.key));
const rewriteState = (f, tree) => {
  let src = readFileSync(f, "utf8");
  const before = src;
  for (const p of selectorParams(src))
    for (const key of pageKeys.keys()) {
      const ns = tree === "dev" && forked.has(key) ? "dev" : "prod";
      src = src.replace(new RegExp(`(?<![.\\w])${p}\\.(?:prod\\.|dev\\.)?${key}\\b`, "g"), `${p}.${ns}.${key}`);
    }
  if (src !== before) writeFileSync(f, src);
};
for (const dest of Object.keys(treeCopies)) if (/\.tsx?$/.test(dest)) rewriteState(dest, dest.startsWith(DEV) ? "dev" : "prod");
// The dev library copies made for this page read dev state for its slices.
for (const dest of Object.keys(libCopies)) if (/\.tsx?$/.test(dest)) rewriteState(dest, "dev");

// ── trash the originals, write the switchers ──────────────────────────────
for (const f of [...tree, ...tests, ...docs]) {
  const dest = trashPath(f);
  mkdirSync(P.dirname(dest), { recursive: true });
  renameSync(f, dest);
}
// Remove the folders the originals leave empty.
const prune = (d) => {
  if (!existsSync(d) || !statSync(d).isDirectory()) return;
  for (const e of readdirSync(d)) prune(P.join(d, e));
  if (!readdirSync(d).length) rmdirSync(d);
};
for (const e of readdirSync(PAGE)) if (!["prod", "dev"].includes(e)) prune(P.join(PAGE, e));

for (const f of entries) {
  const rel = f.slice(PAGE.length).replace(/\.tsx$/, "");
  const name = P.basename(rel);
  const hooks = P.relative(P.dirname(f), "src/hooks");
  const local = (p) => { const r = P.relative(P.dirname(rel), p); return r.startsWith(".") ? r : `./${r}`; };
  const src = text.get(f) ?? "";
  const nl = src.includes("\r\n") ? "\r\n" : "\n";
  // Forward props only if the component takes any: ComponentProps of a
  // zero-argument component is `unknown`, which can't be spread.
  const comp = src.match(/export\s+default\s+(\w+)\s*;/)?.[1];
  const noProps = !comp || new RegExp(`(?:const|function)\\s+${comp}\\s*(?::[^=]+)?=?\\s*\\(\\s*\\)`).test(src);
  if (DEV_ONLY) {
    const lib = P.relative(P.dirname(f), "src/components/DevOnlyNotice");
    const devApi = P.relative(P.dirname(f), "src/hooks/useDevApi");
    const props = noProps ? "" : ` {...props}`;
    writeFileSync(f, [
      ...(noProps ? [] : [`import type { ComponentProps } from "react";`]),
      `import { useAppSelector } from "${hooks}";`,
      `import { DEV_API_URL } from "${devApi}";`,
      `import DevOnlyNotice from "${lib}";`,
      `import Dev${name} from "${local(`dev/${rel}`)}";`,
      ``,
      `/**`,
      ` * ${name} is a Coming Soon page: dev only.`,
      ` *`,
      ` * It has a \`pages/${page}/dev\` tree and no prod tree until it is greenlit. The`,
      ` * page renders only when the session is on the dev API — \`apiEnv\` is "dev"`,
      ` * AND the base URL really is the dev one, so every call it makes goes to`,
      ` * dev. Anywhere else (the prod API, which is what clients see) it renders`,
      ` * DevOnlyNotice: none of the page's code runs and nothing is fetched.`,
      ` */`,
      `const ${name} = (${noProps ? "" : `props: ComponentProps<typeof Dev${name}>`}) => {`,
      `  const { apiEnv, url } = useAppSelector((state) => state.app);`,
      `  if (apiEnv !== "dev" || url !== DEV_API_URL) return <DevOnlyNotice />;`,
      `  return <Dev${name}${props} />;`,
      `};`,
      ``,
      `export default ${name};`,
      ``,
    ].join(nl));
    continue;
  }
  writeFileSync(f, [
    ...(noProps ? [] : [`import type { ComponentProps } from "react";`]),
    `import { useAppSelector } from "${hooks}";`,
    `import Prod${name} from "${local(`prod/${rel}`)}";`,
    `import Dev${name} from "${local(`dev/${rel}`)}";`,
    ``,
    `/**`,
    ` * Which ${name} to show.`,
    ` *`,
    ` * The API switch picks the UI tree as well as the backend: on the dev API you`,
    ` * get \`pages/${page}/dev\`, on prod you get \`pages/${page}/prod\`. Work happens in`,
    ` * dev; when it is signed off, \`node scripts/promote-page.mjs ${page}\` copies it`,
    ` * over prod and the two trees match again until the next change.`,
    ` */`,
    ...(noProps
      ? [
          `const ${name} = () => {`,
          `  const apiEnv = useAppSelector((state) => state.app.apiEnv);`,
          `  return apiEnv === "dev" ? <Dev${name} /> : <Prod${name} />;`,
        ]
      : [
          `const ${name} = (props: ComponentProps<typeof Prod${name}>) => {`,
          `  const apiEnv = useAppSelector((state) => state.app.apiEnv);`,
          `  return apiEnv === "dev" ? <Dev${name} {...props} /> : <Prod${name} {...props} />;`,
        ]),
    `};`,
    ``,
    `export default ${name};`,
    ``,
  ].join(nl));
}

// ── register the dev slices ───────────────────────────────────────────────
if (newSlices.length) {
  const file = "src/store/devReducers.ts";
  let src = readFileSync(file, "utf8");
  const nl = src.includes("\r\n") ? "\r\n" : "\n";
  const lastImport = [...src.matchAll(/^import \w+ from "\.\.\/features\/dev\/[^"]+";\r?\n/gm)].pop()
    ?? [...src.matchAll(/^import .*;\r?\n/gm)].pop();
  const imports = newSlices.map((s) => {
    const ident = P.basename(s.dev).replace(/Slice\.ts$/, "Reducer");
    s.ident = ident;
    return `import ${ident} from "../features/dev/${P.basename(s.dev, ".ts")}";${nl}`;
  }).join("");
  src = src.slice(0, lastImport.index + lastImport[0].length) + imports + src.slice(lastImport.index + lastImport[0].length);
  const close = src.indexOf("} satisfies Record<string, Reducer>;");
  src = src.slice(0, close) + newSlices.map((s) => `  ${s.key}: ${s.ident},${nl}`).join("") + src.slice(close);
  writeFileSync(file, src);
}

console.log(`\nDone. Next:\n  npx tsc -b\n  node scripts/check-split.mjs ${page}\n` +
  `then cut what the trees don't need (tablet routes, legacy branches) and trash what that leaves dead.`);
