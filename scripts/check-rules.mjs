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
 *   catalogued-look    a dev-tree className spells out a whole cc-* class from
 *                      src/styles/components-dev.css instead of using it (§11)
 *   off-reference-look a page pinned to a reference page in STYLE_REFERENCE
 *                      uses a text colour or size that page does not (§11)
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

/** The dev tree's shared looks: each cc-* class and the classes it stands for. */
const SHEET = "src/styles/components-dev.css";
const LOOKS = existsSync(SHEET)
  ? [...readFileSync(SHEET, "utf8").matchAll(/\.(cc-[a-z0-9-]+)\s*\{\s*@apply ([^;]+);/g)]
      .map((m) => ({ cls: m[1], need: m[2].trim().split(/\s+/) }))
  : [];
/** Looks too short to tell apart by classes alone, and what they must not claim: a
 *  button or a filled element that happens to share a navy title's two classes is
 *  not a navy title. docs/tools/cc_swap.mjs skips the same elements. */
const NOT_FOR = {
  "cc-navy-title": (tag, have) => tag === "button" || [...have].some((c) => /^bg-/.test(c)),
};
const isDevTree = (f) => /^src\/pages\/[^/]+\/dev\//.test(f) || /^src\/components-dev\//.test(f);

/**
 * Pages that follow another page's look exactly, and the page they follow.
 *
 * `audit:theme` passes any class built from a token, so a page can be entirely
 * legal and still not look like the one it was meant to copy. LP Actions ran a
 * type scale of 8 / 9 / 9.5 / 13.5 / 17px and used `text-brand_slate` 27 times
 * where Item Actions uses it never, and the audit was clean throughout. This
 * pins a page's text colours and sizes to its reference's.
 *
 * `also` is the deliberate departures, each with the reason it is not drift.
 */
const STYLE_REFERENCE = {
  lpActions: {
    page: "itemReport",
    also: {
      "text-delta_negative_text":
        "up is the bad way on this page, so a rise is a direction, not a grade (§11)",
      "text-delta_positive_text": "the same, falling",
      "text-rate_text": "Observe the lane points at a terminal, not at a person",
      "text-volume_text": "Review procedure is a process finding, not a grade",
    },
  },
};

/** Words after `text-` that set alignment or wrapping, not colour or size. */
const TEXT_KEYWORDS = new Set([
  "left", "center", "right", "justify", "start", "end", "wrap", "nowrap",
  "balance", "pretty", "ellipsis", "clip", "opacity", "current", "inherit",
]);

/** Comments blanked, line count kept, so a class named in prose is not a use. */
const stripComments = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => "\n".repeat((m.match(/\n/g) ?? []).length))
    .replace(/\/\/[^\n]*/g, "");

/** Every text colour and text size class in a piece of source. */
const textClasses = (src) =>
  [...src.matchAll(/\btext-(\[[^\]\s]+\]|[a-z][a-z0-9_]*)(\/(?:\[[^\]\s]+\]|[0-9.]+))?/g)]
    .filter((m) => !TEXT_KEYWORDS.has(m[1]))
    .map((m) => m[0]);

const refCache = new Map();
/** The set a reference page actually uses, across its whole dev tree. */
const referenceText = (page) => {
  if (!refCache.has(page)) {
    const out = new Set();
    const listed = execSync(
      `git ls-files -co --exclude-standard src/pages/${page}/dev`,
      { encoding: "utf8" },
    ).trim().split("\n");
    for (const rf of listed.filter(
      (x) => /\.(ts|tsx)$/.test(x) && !/\.test\./.test(x) && existsSync(x),
    ))
      for (const c of textClasses(stripComments(readFileSync(rf, "utf8")))) out.add(c);
    refCache.set(page, out);
  }
  return refCache.get(page);
};

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

  /* a catalogued look spelled out: the always-on classes (a plain string, or a
     template's fixed text) hold every class of a cc-* definition */
  if (isDevTree(f) && f.endsWith(".tsx") && LOOKS.length) {
    const walk = (n) => {
      if (ts.isJsxAttribute(n) && n.name.getText(sf) === "className" && n.initializer) {
        const e = ts.isJsxExpression(n.initializer) ? n.initializer.expression : n.initializer;
        const fixed = !e ? [] : ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e) ? [e.text]
          : ts.isTemplateExpression(e) ? [e.head.text, ...e.templateSpans.map((sp) => sp.literal.text)] : [];
        const have = new Set(fixed.join(" ").split(/\s+/).filter(Boolean));
        const tag = n.parent.parent.tagName?.getText(sf) ?? "";
        for (const l of LOOKS)
          if (l.need.every((c) => have.has(c)) && !NOT_FOR[l.cls]?.(tag, have)) hit("catalogued-look", lineOf(n), `spells out ${l.cls}; use the class`);
      }
      ts.forEachChild(n, walk);
    };
    walk(sf);
  }

  /* a page pinned to a reference page's text colours and type scale (§11) */
  const pinned = STYLE_REFERENCE[pageOf(f) ?? ""];
  if (pinned && isDevTree(f)) {
    const allowed = referenceText(pinned.page);
    stripComments(src).split("\n").forEach((l, i) => {
      for (const c of textClasses(l))
        if (!allowed.has(c) && !(c in pinned.also))
          hit(
            "off-reference-look",
            i + 1,
            `${c} is not used by ${pinned.page}; this page follows its text colours and type scale`,
          );
    });
  }

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
