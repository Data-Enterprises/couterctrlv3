#!/usr/bin/env node
/**
 * Checks the CLAUDE.md file rules that a script can judge.
 *
 *   npm run check:rules                          every file in scope
 *   node scripts/check-rules.mjs <files...>      just these (the pre-commit hook)
 *   npm run check:rules -- --update-baseline     record today's hits
 *
 * Today's hits are recorded per file and rule in scripts/baselines/rules.json;
 * only hits above that count fail, so nothing new can be added while old files
 * are brought in line. A move commit carries its files' entries to their new
 * paths with --update-baseline; a logic commit never raises the baseline.
 *
 * Scope: src, minus tests, prod snapshots (they change by promotion) and legacy.
 *
 * Rules (CLAUDE.md section in brackets):
 *   labels             imports are labelled Hooks, Redux, API, Utils, Interfaces,
 *                      Components, in that order, with no other label (§6)
 *   one-line-per-source  one import line per source file (§6)
 *   prod-imports-dev   the prod library or a prod tree imports the dev library (§1)
 *   cross-page-import  a page imports another page's folder (§3)
 *   types-folder       a folder named types/; it is interfaces/ (§3)
 *   barrel             an index file that only re-exports (§3)
 *   file-length        over 900 lines (§2)
 *   shape-*            a component file holds imports, its props interface, the
 *                      component, and export default last, nothing else (§2)
 *   doc-comment        the component has no doc comment above it (§2)
 *   any-in-props       `any` in a props interface (§5.6)
 *   commented-code     code left in a comment; delete it instead (§7)
 *   shape-inline-props props typed inline instead of as <Component>Props (§2)
 *   selector-outside-hook  a dev page's component reads Redux with
 *                      useAppSelector rather than through the page's context
 *                      hook; the page's own top-level file may read it (§4)
 */
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import ts from "typescript";

const P = path.posix;
const BASELINE = "scripts/baselines/rules.json";
const UPDATE = process.argv.includes("--update-baseline");
const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));

const LABELS = ["Hooks", "Redux", "API", "Utils", "Interfaces", "Components"];
const MAX_LINES = 900;

const inScope = (f) =>
  /^src\/.*\.(ts|tsx)$/.test(f) &&
  !/\.test\.(ts|tsx)$/.test(f) &&
  !f.endsWith(".d.ts") &&
  !/^src\/pages\/.*\/prod\//.test(f) &&
  !/^src\/pages\/shared\//.test(f) &&
  !/legacy/i.test(f);

const all = execSync("git ls-files -co --exclude-standard src", { encoding: "utf8" })
  .trim().split("\n").filter((f) => existsSync(f) && statSync(f).isFile() && inScope(f));
const files = args.length
  ? args.map((f) => f.replace(/\\/g, "/")).filter((f) => existsSync(f) && inScope(f))
  : all;

/* ── one file ───────────────────────────────────────────────────────────── */

const pageOf = (f) => f.match(/^src\/pages\/([^/]+)\//)?.[1];

function check(f) {
  const src = readFileSync(f, "utf8").replace(/\r\n/g, "\n");
  const lines = src.split("\n");
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true,
    f.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const lineOf = (node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
  const hits = [];
  const hit = (rule, line, msg) => hits.push({ rule, line, msg });

  /* imports */
  const imports = sf.statements.filter(ts.isImportDeclaration);
  if (imports.length) {
    const labelLines = [];
    lines.forEach((l, i) => {
      const m = l.match(/^\/\/ ([A-Z][A-Za-z]*)\s*$/);
      if (m) labelLines.push({ word: m[1], line: i + 1 });
    });
    const firstImport = lineOf(imports[0]);
    const lastImport = lineOf(imports[imports.length - 1]);
    const inBlock = labelLines.filter((l) => l.line < lastImport + 2);
    const known = inBlock.filter((l) => LABELS.includes(l.word));
    for (const l of inBlock.filter((l) => !LABELS.includes(l.word)))
      hit("labels", l.line, `"// ${l.word}" is not an import label`);
    if (!known.length) hit("labels", firstImport, "imports have no labels");
    else {
      if (known[0].line > firstImport) hit("labels", firstImport, "an import sits above the first label");
      const order = known.map((l) => LABELS.indexOf(l.word));
      if (order.some((v, i) => i && v <= order[i - 1]))
        hit("labels", known[0].line, `labels out of order: ${known.map((l) => l.word).join(", ")}`);
    }
    const seen = new Map();
    for (const imp of imports) {
      const spec = imp.moduleSpecifier.text;
      if (seen.has(spec)) hit("one-line-per-source", lineOf(imp), `second import line from "${spec}"`);
      else seen.set(spec, true);
      const target = spec.startsWith(".") ? P.normalize(P.join(P.dirname(f), spec)) : spec;
      if ((/^src\/components\//.test(f) || /^src\/pages\/[^/]+\/prod\//.test(f) || /^src\/features\/(?!dev\/)/.test(f)) &&
          /^src\/(components-dev|features\/dev)(\/|$)/.test(target))
        hit("prod-imports-dev", lineOf(imp), `the prod library imports ${target}`);
      const from = pageOf(f), to = pageOf(target);
      if (from && to && from !== to) hit("cross-page-import", lineOf(imp), `imports another page's folder: ${target}`);
    }
  }

  /* folders and size */
  if (/\/types\//.test(f)) hit("types-folder", 1, "a types/ folder; helpers' types go in interfaces/");
  if (/\/index\.tsx?$/.test(f) && sf.statements.length &&
      sf.statements.every((s) => ts.isExportDeclaration(s) && s.moduleSpecifier))
    hit("barrel", 1, "an index file that only re-exports");
  if (lines.length > MAX_LINES) hit("file-length", 1, `${lines.length} lines (keep well under ${MAX_LINES})`);

  /* component file shape */
  const exp = sf.statements.find(ts.isExportAssignment);
  const name = exp && exp.expression.getText(sf).replace(/^(memo|forwardRef)\((\w+)\)$/, "$2");
  const isComponentFile = f.endsWith(".tsx") && name && /^[A-Z]\w*$/.test(name) &&
    !/\/(utils|hooks|interfaces)\//.test(f);
  if (isComponentFile) {
    let decl = null;
    const types = [];
    for (const s of sf.statements) {
      if (ts.isImportDeclaration(s) || ts.isExportAssignment(s)) continue;
      if (ts.isInterfaceDeclaration(s) || ts.isTypeAliasDeclaration(s)) { types.push(s); continue; }
      const names = ts.isVariableStatement(s)
        ? s.declarationList.declarations.map((d) => d.name.getText(sf))
        : (ts.isFunctionDeclaration(s) || ts.isClassDeclaration(s)) && s.name ? [s.name.text] : [];
      if (!names.length) { if (!ts.isExpressionStatement(s)) hit("shape-extra-code", lineOf(s), "code other than the component"); continue; }
      for (const n of names) {
        if (n === name) { decl = s; continue; }
        if (/^[A-Z][a-z]/.test(n)) hit("shape-extra-component", lineOf(s), `a second component (${n}); it gets its own file`);
        else hit("shape-extra-code", lineOf(s), `${n} belongs in utils/`);
      }
      if (s.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) && !names.includes(name))
        hit("shape-named-export", lineOf(s), "a component file exports only its component");
    }
    // At most one type, and it is the props interface named after the component.
    for (const t of types) {
      if (t.name.text === `${name}Props` && t === types.find((x) => x.name.text === `${name}Props`)) continue;
      if (/Props$/.test(t.name.text)) hit("shape-props-name", lineOf(t), `props interface is ${t.name.text}, not ${name}Props`);
      else hit("shape-extra-type", lineOf(t), `${t.name.text} belongs in interfaces/`);
    }
    // Props typed inline in the parameter list rather than as <Name>Props.
    const fn = decl && (ts.isFunctionDeclaration(decl) ? decl
      : decl.declarationList?.declarations.find((d) => d.name.getText(sf) === name)?.initializer);
    const inner = fn && (ts.isCallExpression(fn) ? fn.arguments[0] : fn);
    const param = inner && (ts.isArrowFunction(inner) || ts.isFunctionExpression(inner) || ts.isFunctionDeclaration(inner)) ? inner.parameters[0] : null;
    if (param?.type && ts.isTypeLiteralNode(param.type))
      hit("shape-inline-props", lineOf(param), `props typed inline; declare ${name}Props`);
    if (sf.statements[sf.statements.length - 1] !== exp)
      hit("shape-export-last", lineOf(exp), "export default is not the last line");
    if (decl && !src.slice(decl.getFullStart(), decl.getStart(sf)).includes("/**"))
      hit("doc-comment", lineOf(decl), `${name} has no doc comment`);
  }

  /* any in props */
  for (const t of sf.statements.filter((s) => ts.isInterfaceDeclaration(s) && /Props$/.test(s.name.text))) {
    const walk = (n) => {
      if (n.kind === ts.SyntaxKind.AnyKeyword) hit("any-in-props", lineOf(n), `any in ${t.name.text}`);
      ts.forEachChild(n, walk);
    };
    walk(t);
  }

  /* commented-out code */
  let inJsxComment = false;
  lines.forEach((l, i) => {
    if (/^\s*\/\/\s*(const|let|var|import|export|return|function)\b|^\s*\/\/\s*<\/?[A-Za-z][\w.]*(\s|>|\/>|$)/.test(l))
      hit("commented-code", i + 1, "code in a comment; delete it");
    if (/\{\/\*/.test(l)) inJsxComment = true;
    if ((inJsxComment && /^\s*<\/?[A-Za-z][\w.]*(\s|>|\/>|$)/.test(l)) || /\{\/\*\s*<\/?[A-Za-z][\w.]*(\s|>|\/>)/.test(l))
      hit("commented-code", i + 1, "markup in a comment; delete it");
    if (/\*\/\}/.test(l)) inJsxComment = false;
  });

  /* Redux through the page's context hook (the page's own top-level file may read it) */
  if (/^src\/pages\/[^/]+\/dev\/.+\//.test(f) && !/\/hooks\//.test(f))
    lines.forEach((l, i) => {
      if (/\buseAppSelector\(/.test(l) && !/^\s*(\/\/|\*)/.test(l))
        hit("selector-outside-hook", i + 1, "reads Redux directly; read it through the page's context hook");
    });

  return hits;
}

/* ── compare with the baseline ──────────────────────────────────────────── */

let base = {};
try { base = JSON.parse(readFileSync(BASELINE, "utf8")); } catch { /* none yet */ }

const results = new Map(files.map((f) => [f, check(f)]));
const countsOf = (hits) => hits.reduce((a, h) => ((a[h.rule] = (a[h.rule] ?? 0) + 1), a), {});

if (UPDATE) {
  if (args.length) { console.error("--update-baseline scans every file; run it without file names"); process.exit(2); }
  const out = {};
  for (const [f, hits] of [...results].sort()) if (hits.length) out[f] = Object.fromEntries(Object.entries(countsOf(hits)).sort());
  writeFileSync(BASELINE, JSON.stringify(out, null, 2) + "\n");
  const n = Object.values(out).reduce((a, r) => a + Object.values(r).reduce((b, c) => b + c, 0), 0);
  console.log(`Baseline written: ${BASELINE} (${n} known hit(s) in ${Object.keys(out).length} file(s))`);
  process.exit(0);
}

let fresh = 0, fewer = 0;
for (const [f, hits] of results) {
  const counts = countsOf(hits);
  for (const [rule, n] of Object.entries(counts)) {
    const allowed = base[f]?.[rule] ?? 0;
    if (n <= allowed) continue;
    fresh += n - allowed;
    console.log(`\n  ${f}  [${rule}] ${n} hit(s), baseline ${allowed}`);
    for (const h of hits.filter((h) => h.rule === rule)) console.log(`    ${f}:${h.line}  ${h.msg}`);
  }
  for (const [rule, n] of Object.entries(base[f] ?? {})) if ((counts[rule] ?? 0) < n) fewer += n - (counts[rule] ?? 0);
}
const known = files.reduce((a, f) => a + Object.values(base[f] ?? {}).reduce((b, c) => b + c, 0), 0);
console.log(`\ncheck:rules  ${files.length} file(s), ${known} known hit(s) in the baseline`);
if (fewer) console.log(`  ${fewer} fewer than the baseline: run with --update-baseline to lock that in.`);
if (fresh) {
  console.log(`  ${fresh} new hit(s). Fix them; a move commit carries its baseline entries with --update-baseline.`);
  process.exitCode = 1;
} else console.log("  0 new hit(s)");
