#!/usr/bin/env node
/**
 * Gives an already-split page its own dev copy of a page slice, the way Sales
 * has one: dev reads state.dev.<key> and dispatches to the dev slice, prod
 * reads state.prod.<key> and dispatches to the prod slice.
 *
 *   node scripts/fork-slice.mjs lossPrevention lossPrevention [--dry]
 *   npm run fork:slice -- <page> <key>
 *
 *   1. copies features/<x>Slice.ts to features/dev/dev<X>Slice.ts with a
 *      distinct slice name (see store/devReducers.ts for why), unless the
 *      dev slice already exists
 *   2. mounts it in store/devReducers.ts under the same key
 *   3. points every import of the prod slice under pages/<page>/dev/ at it
 *   4. rewrites state.<key> / state.prod.<key> reads there to state.dev.<key>
 *
 * Then it lists everything OUTSIDE the page that still uses the prod slice.
 * Those keep working on prod state — but if one of them is UI the dev tree
 * renders (a components-dev file, another page's modal), it will read prod
 * state while dev LP writes dev state. Each needs a look; `check-split` flags
 * the dev-tree and components-dev ones.
 */
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { relocate } from "./relocate.mjs";

const P = path.posix;
const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const [page, key] = args.filter((a) => !a.startsWith("--"));
if (!page || !key) {
  console.error("usage: node scripts/fork-slice.mjs <page> <reducer key> [--dry]");
  process.exit(2);
}
const DEV = `src/pages/${page}/dev/`;
if (!existsSync(DEV)) { console.error(`${DEV} missing — split the page first`); process.exit(2); }

const files = execSync("git ls-files -co --exclude-standard src", { encoding: "utf8" })
  .trim().split("\n").filter((f) => existsSync(f) && statSync(f).isFile());
const has = new Set(files);
const resolve = (from, spec) => {
  const base = P.normalize(P.join(P.dirname(from), spec)).replace(/\/$/, "");
  for (const s of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]) if (has.has(base + s)) return base + s;
  return null;
};
const reducers = (file) => {
  const src = readFileSync(file, "utf8");
  const mods = new Map();
  for (const m of src.matchAll(/^import (\w+) from "(\.[^"]+)";/gm)) mods.set(m[1], resolve(file, m[2]));
  const block = src.slice(src.indexOf("= {"), src.indexOf("} satisfies"));
  const keys = new Map();
  for (const m of block.matchAll(/^\s*(\w+):\s*(\w+),/gm)) keys.set(m[1], mods.get(m[2]));
  return keys;
};
const mod = reducers("src/store/pageReducers.ts").get(key);
if (!mod) { console.error(`no page slice mounted at "${key}" in store/pageReducers.ts`); process.exit(2); }
const already = reducers("src/store/devReducers.ts").has(key);
const base = P.basename(mod).replace(/\.tsx?$/, "");
const devMod = `src/features/dev/dev${base[0].toUpperCase()}${base.slice(1)}.ts`;

const selectorParams = (src) => {
  const ps = new Set();
  for (const m of src.matchAll(/useAppSelector\(\s*\(?\s*(\w+)/g)) ps.add(m[1]);
  for (const m of src.matchAll(/\b(\w+)\s*:\s*RootState\b/g)) ps.add(m[1]);
  return ps;
};
const readRe = (p) => new RegExp(`(?<![.\\w])${p}\\.(?:prod\\.)?${key}\\b`, "g");

// What changes, for the report.
const devFiles = files.filter((f) => f.startsWith(DEV) && /\.tsx?$/.test(f));
const importing = devFiles.filter((f) => /from\s*["'][^"']*features\/[^"']*["']/.test(readFileSync(f, "utf8")) &&
  [...readFileSync(f, "utf8").matchAll(/from\s*["'](\.[^"']+)["']/g)].some((m) => resolve(f, m[1]) === mod));
const reading = devFiles.filter((f) => { const s = readFileSync(f, "utf8"); return [...selectorParams(s)].some((p) => readRe(p).test(s)); });
const outside = files.filter((f) => /\.tsx?$/.test(f) && !f.startsWith(`src/pages/${page}/`) && f !== mod &&
  !f.startsWith("src/store/") && !f.startsWith("src/features/dev/") && (() => {
    const s = readFileSync(f, "utf8");
    return [...s.matchAll(/from\s*["'](\.[^"']+)["']/g)].some((m) => resolve(f, m[1]) === mod) ||
      [...selectorParams(s)].some((p) => new RegExp(`(?<![.\\w])${p}\\.(?:prod\\.|dev\\.)?${key}\\b`).test(s));
  })());

console.log(`\nForking "${key}" for ${DEV}${DRY ? "   [dry run]" : ""}\n`);
console.log(`  slice: ${mod} -> ${devMod}${already ? "  (exists, reused)" : ""}`);
console.log(`  dev tree files importing the prod slice: ${importing.length}`);
importing.forEach((f) => console.log(`      ${f}`));
console.log(`  dev tree files reading state.${key}: ${reading.length}`);
reading.forEach((f) => console.log(`      ${f}`));
console.log(`  outside the page, still on the prod slice (check each):`);
outside.forEach((f) => console.log(`      ${f}`));
if (DRY) process.exit(0);

// 1–2. the dev slice
if (!already) {
  relocate({ copies: { [devMod]: mod } }, { log: () => {} });
  let src = readFileSync(devMod, "utf8");
  const nl = src.includes("\r\n") ? "\r\n" : "\n";
  const name = src.match(/\bname:\s*"(\w+)"/)?.[1];
  if (!name) { console.error(`no \`name: "..."\` in ${mod}`); process.exit(1); }
  const devName = `dev${name[0].toUpperCase()}${name.slice(1)}`;
  src = src.replace(/^([ \t]*)name:\s*"\w+"/m, (m, ind) =>
    `${ind}// Distinct from the prod slice's "${name}": Redux matches actions on this${nl}` +
    `${ind}// string alone, so sharing it would move prod and dev together.${nl}${ind}name: "${devName}"`);
  src = [
    "/**",
    ` * Dev copy of \`${mod.replace("src/", "")}\`, mounted at \`state.dev.${key}\` and read only`,
    ` * by \`pages/${page}/dev\`. Edit this one while changing dev ${page}; when dev is`,
    " * promoted, it replaces the prod slice. See src/store/devReducers.ts.",
    " */",
  ].join(nl) + nl + src;
  writeFileSync(devMod, src);

  const file = "src/store/devReducers.ts";
  let red = readFileSync(file, "utf8");
  const rnl = red.includes("\r\n") ? "\r\n" : "\n";
  const ident = P.basename(devMod).replace(/Slice\.ts$/, "Reducer");
  const last = [...red.matchAll(/^import \w+ from "\.\.\/features\/dev\/[^"]+";\r?\n/gm)].pop()
    ?? [...red.matchAll(/^import .*;\r?\n/gm)].pop();
  const at = last.index + last[0].length;
  red = red.slice(0, at) + `import ${ident} from "../features/dev/${P.basename(devMod, ".ts")}";${rnl}` + red.slice(at);
  const close = red.indexOf("} satisfies Record<string, Reducer>;");
  red = red.slice(0, close) + `  ${key}: ${ident},${rnl}` + red.slice(close);
  writeFileSync(file, red);
}

// 3. dev tree imports -> dev slice
relocate({ redirects: [{ under: DEV, from: mod, to: devMod }] }, { log: () => {} });

// 4. dev tree selectors -> state.dev.<key>
for (const f of devFiles) {
  let src = readFileSync(f, "utf8");
  const before = src;
  for (const p of selectorParams(src)) src = src.replace(readRe(p), `${p}.dev.${key}`);
  if (src !== before) writeFileSync(f, src);
}
console.log(`\nDone. Next: npx tsc -b && node scripts/check-split.mjs ${page}`);
