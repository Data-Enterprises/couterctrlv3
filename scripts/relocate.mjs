#!/usr/bin/env node
/**
 * Move, copy or redirect source files and repoint every relative import that
 * is affected — nothing else is touched.
 *
 * The one primitive behind the dev/prod UI split: pages are forked by copying,
 * shared UI is swapped between the prod and dev libraries by redirecting, and
 * universal code is rehomed by moving. Doing any of those by hand means
 * editing dozens of import paths, and a single one missed either breaks the
 * build or — worse — quietly points a dev file at prod code.
 *
 * Used from other scripts (split-page, promote-page) and from a plan file:
 *
 *   node scripts/relocate.mjs plan.json [--dry]
 *
 * plan.json:
 *   {
 *     "moves":     { "src/old/Path.tsx": "src/new/Path.tsx" },   // git mv
 *     "copies":    { "src/components-dev/X.tsx": "src/components/X.tsx" }, // dest: source
 *     "redirects": [ { "under": "src/pages/sales/dev/",           // importers here
 *                      "from":  "src/pages/sales/dev/ui/",         // targets here
 *                      "to":    "src/components-dev/",             // go here instead
 *                      "trash": true } ]                           // then move from → trash/
 *   }
 *
 * Rules:
 *   - An import is rewritten only if its own file moved, or its target moved,
 *     was copied from (for files inside the copy set), or is redirected.
 *     Every other import stays byte-for-byte as written.
 *   - Inside a copied file, an import of another file that is ALSO copied in
 *     this plan points at that copy; anything else points at the original.
 *     That keeps a copied library self-contained. Copies are keyed by
 *     destination, so one source can go to several places (prod/ and dev/);
 *     an import then resolves to the copy nearest the importing file.
 *   - The written spec keeps whatever the original omitted (".tsx", "/index").
 *   - Line endings are preserved per file.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, copyFileSync, renameSync, readdirSync, rmdirSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const P = path.posix;
const ROOT = process.cwd().split(path.sep).join("/");

const listFiles = () =>
  execSync("git ls-files -co --exclude-standard src", { encoding: "utf8" })
    .trim().split("\n")
    .filter((f) => existsSync(f) && statSync(f).isFile());

const CANDIDATES = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];
const makeResolver = (has) => (from, spec) => {
  const base = P.normalize(P.join(P.dirname(from), spec)).replace(/\/$/, "");
  for (const suffix of CANDIDATES)
    if (has.has(base + suffix)) return { target: base + suffix, suffix };
  return null;
};

const specFor = (fromFile, targetFile, suffix) => {
  // Omit what the original spec omitted — but the target may have changed
  // shape (a folder index moved to a plain file), so trim only what is there.
  let trimmed = targetFile;
  if (suffix && targetFile.endsWith(suffix)) trimmed = targetFile.slice(0, -suffix.length);
  else if (suffix) trimmed = targetFile.replace(/\.tsx?$/, "");
  let r = P.relative(P.dirname(fromFile), trimmed);
  if (r === "") return "."; // the importer's own folder index
  if (!r.startsWith(".")) r = "./" + r;
  return r;
};

// import … from "x" | export … from "x" | import("x") | import "x"
const SPEC_RE = /((?:import|export)[^'"]*?from\s*|import\(\s*|import\s+)(["'])(\.[^"']*)\2/g;

export function relocate(plan, { dry = false, log = console.log } = {}) {
  const files = listFiles();
  const has = new Set(files);
  const resolve = makeResolver(has);
  const moves = new Map(Object.entries(plan.moves ?? {}));
  const copies = new Map(Object.entries(plan.copies ?? {})); // dest -> source
  const redirects = plan.redirects ?? [];

  for (const [from, to] of [...moves, ...[...copies].map(([d, s]) => [s, d])]) {
    if (!has.has(from)) throw new Error(`source missing: ${from}`);
    if (existsSync(to)) throw new Error(`destination exists: ${to}`);
  }

  const finalPath = (f) => moves.get(f) ?? f;
  const redirect = (importer, target) => {
    for (const r of redirects) {
      if (!importer.startsWith(r.under) || !target.startsWith(r.from)) continue;
      const next = r.to + target.slice(r.from.length);
      if (!has.has(next) && !copies.has(next))
        throw new Error(`redirect target missing: ${target} -> ${next} (for ${importer})`);
      return next;
    }
    return null;
  };

  const rewrite = (src, readAs, writeAs, targetFor) => {
    let n = 0;
    const out = src.replace(SPEC_RE, (m, head, q, spec) => {
      const r = resolve(readAs, spec);
      if (!r) return m;
      const target = targetFor(r.target);
      if (writeAs === readAs && target === r.target) return m;
      const next = specFor(writeAs, target, r.suffix);
      if (next === spec) return m;
      n++;
      return `${head}${q}${next}${q}`;
    });
    return { out, n };
  };

  let rewritten = 0;
  const writes = new Map();

  // 1. every existing file: its own move, its targets' moves, redirects.
  for (const f of files) {
    if (!/\.(ts|tsx)$/.test(f)) continue;
    const src = readFileSync(f, "utf8");
    const { out, n } = rewrite(src, f, finalPath(f), (t) =>
      redirect(finalPath(f), finalPath(t)) ?? finalPath(t));
    if (n) { writes.set(f, out); rewritten += n; }
  }

  // 2. copies: read from the original, write at the copy's path.
  const shared = (a, b) => { let i = 0; while (i < a.length && a[i] === b[i]) i++; return i; };
  const copyOf = (importerDest, t) => {
    let best = null;
    for (const [dest, src] of copies)
      if (src === t && (!best || shared(dest, importerDest) > shared(best, importerDest))) best = dest;
    return best ?? finalPath(t);
  };
  const copyWrites = new Map();
  for (const [to, from] of copies) {
    if (!/\.(ts|tsx)$/.test(from)) { copyWrites.set(to, { raw: from }); continue; }
    // Always the original text: resolution is against the tree as it was
    // before this plan, and a source that step 1 already rewrote would carry
    // specs pointing at files that do not exist yet.
    const src = readFileSync(from, "utf8");
    const { out, n } = rewrite(src, from, to, (t) => redirect(to, copyOf(to, t)) ?? copyOf(to, t));
    copyWrites.set(to, { text: out });
    rewritten += n;
  }

  const redirected = files.filter((f) => redirects.some((r) => r.trash && f.startsWith(r.from)));
  // Checked before anything is written, so a collision can't leave a
  // half-applied change behind.
  for (const f of redirected)
    if (existsSync(P.join("trash", f))) throw new Error(`already in trash: trash/${f}`);

  log(`${dry ? "[dry] " : ""}${moves.size} moved, ${copies.size} copied, ${redirected.length} redirected+trashed, ${rewritten} import(s) rewritten`);
  if (dry) {
    for (const [a, b] of moves) log(`  move  ${a} -> ${b}`);
    for (const [dest, src] of copies) log(`  copy  ${src} -> ${dest}`);
    for (const f of redirected) log(`  trash ${f}`);
    for (const f of writes.keys()) log(`  edit  ${f}`);
    return { moves, copies, redirected, writes };
  }

  for (const [f, text] of writes) writeFileSync(f, text);
  for (const [from, to] of moves) {
    mkdirSync(P.dirname(to), { recursive: true });
    execSync(`git mv "${from}" "${to}"`);
  }
  for (const [to, w] of copyWrites) {
    mkdirSync(P.dirname(to), { recursive: true });
    if (w.raw) copyFileSync(w.raw, to);
    else writeFileSync(to, w.text);
  }
  // Never deleted: trash/ is gitignored and keeps the original path, so any of
  // these can be put back exactly where it was.
  for (const f of redirected) {
    const dest = P.join("trash", f);
    if (existsSync(dest)) throw new Error(`already in trash: ${dest}`);
    mkdirSync(P.dirname(dest), { recursive: true });
    renameSync(f, dest);
  }
  // Remove directories the moves and drops left empty.
  const prune = (d) => {
    if (!existsSync(d) || !statSync(d).isDirectory()) return;
    for (const e of readdirSync(d)) prune(P.join(d, e));
    if (!readdirSync(d).length) rmdirSync(d);
  };
  for (const f of [...moves.keys(), ...redirected]) prune(P.dirname(f));
  return { moves, copies, redirected, writes };
}

if (process.argv[1] && process.argv[1].endsWith("relocate.mjs")) {
  const planFile = process.argv[2];
  if (!planFile) {
    console.error("usage: node scripts/relocate.mjs plan.json [--dry]");
    process.exit(1);
  }
  relocate(JSON.parse(readFileSync(planFile, "utf8")), { dry: process.argv.includes("--dry") });
}
