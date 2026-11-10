#!/usr/bin/env node
/**
 * Theme / styling / structure audit.
 *
 * Checks the documented design-system rules across every page and reports at
 * three levels:
 *
 *   UNIVERSAL  — the same violation in 3+ page families. A rule nobody is
 *                following, or one the shared components should enforce.
 *   CATEGORY   — confined to one family (Performance / Data / Config /
 *                Diagnostic). Usually that family's fork drifting.
 *   INDIVIDUAL — one page. Ordinary drift, fix in place.
 *
 * Legacy trees are reported separately and never mixed into the totals: they
 * are being replaced, and folding them in buries the signal.
 *
 * Scans src/pages (dev trees; prod snapshots are skipped) and src/components-dev.
 *
 * src/components, the shared library both modes render, is scanned as a
 * ratchet: today's hits are recorded in scripts/baselines/theme-shared.json and
 * only hits above that count fail. Its fixes land with a promotion, since they
 * change what clients see; until then nothing new may be added.
 *
 * Run: npm run audit:theme        (add --verbose for every hit, not just 3)
 *      npm run audit:theme -- --update-baseline   (after fixing or moving a shared file)
 * A clean run ends "TOTAL: 0 hit(s)"; any hit outside legacy exits 1.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, sep } from "node:path";

const ROOTS = ["src/pages", "src/components-dev"];
const SHARED_ROOT = "src/components";
const BASELINE = "scripts/baselines/theme-shared.json";
const VERBOSE = process.argv.includes("--verbose");
const UPDATE = process.argv.includes("--update-baseline");

/* ── page families ──────────────────────────────────────────────────────── */

const FAMILY = {
  sales: "Performance", lossPrevention: "Performance",
  subDepts: "Performance", categories: "Performance",
  orders: "Data", receivers: "Data", coupons: "Data", couponSales: "Data",
  suggested: "Data",
  admin: "Config", organization: "Config", groups: "Config",
  team: "Config", settings: "Config",
  lookup: "Diagnostic", upc: "Diagnostic",
  cashiers: "Other", forecast: "Other", home: "Other",
  priceSimulator: "Other", quicksight: "Other", tickets: "Other",
};

/** Commented-out markup is not a live violation. Replaced with blank lines of
 *  the same shape so reported line numbers still point at the real file. */
const blank = (m) => m.replace(/[^\n]/g, " ");
const strip = (src) =>
  src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, blank)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/^\s*\/\/.*$/gm, blank);

/**
 * Dev/prod UI trees (`pages/<page>/prod/` and `pages/<page>/dev/`).
 *
 *   prod/     is a released snapshot. Nothing is fixed there directly: a fix
 *             goes into dev/, gets tested, and is promoted over prod. Auditing
 *             both reports every finding twice and points at the copy you are
 *             not meant to edit. Everything under dev/ is audited normally —
 *             that is where changes land.
 *
 * src/components-dev, the dev library, is scanned too (as "components-dev").
 * src/components, the prod library, is not: it changes by promotion.
 */
// `.*` rather than `[^/]+`: the shared pages keep their prod copy two levels
// down (src/pages/shared/eventPerf/prod/), so a single segment missed them and
// the whole frozen tree was being audited as if it were live code. Invisible
// while dev and prod agreed; it surfaced the moment a floor moved.
const isTreeCopy = (p) => /^src\/pages\/.*\/prod\//.test(p);

const isLegacy = (p) =>
  /legacy/i.test(p) || /tabletComps/.test(p) || /Tablet\.tsx$/.test(p);
const isMobile = (p) => /mobile/i.test(p);

/** The mobile floors (font size, opacity, no-italic) are dev-mobile rules.
 *  These trees have never been through the dev refactor, so a hit there is
 *  un-migrated legacy rather than drift — counted separately. */
const NO_DEV_FORK = new Set(["forecast", "home", "priceSimulator",
                             "quicksight", "tickets", "settings"]);

/* ── rules ──────────────────────────────────────────────────────────────── */
//  scope: which files a rule applies to. Keeping this explicit is what stops
//  mobile-only floors being reported against desktop and vice versa.

const ALL = () => true;
const MOBILE = (f) => isMobile(f.path) && !NO_DEV_FORK.has(f.page);
const DESKTOP = (f) => !isMobile(f.path);
// A panel header is the only place the navy-header rules mean anything.
const NAVY = (f) => f.src.includes("#1e2a4a");

const RULES = [
  {
    id: "raw-white",
    scope: ALL,
    why: "bg-white/text-white bypass the controlled --color-custom-white variable, so themed and unthemed surfaces drift apart",
    re: /\b(?:text|bg|border|divide|ring|from|via|to)-white(?:\/|\b)/g,
  },
  {
    id: "interpolated-tailwind",
    scope: ALL,
    why: "Tailwind scans source text — a class built at runtime is never emitted, so the element renders unstyled",
    // Only inside className, and only where the variable completes the class
    // name itself. `text-ellipsis${cond ? " x" : ""}` appends a separate class
    // and is fine; `bg-severity_${sev}_bg` is not. data-* attrs are not classes.
    re: /className=\{`[^`]*(?:bg|text|border|ring|fill|stroke)-[a-z_0-9]*[-_]\$\{/g,
  },
  {
    id: "bespoke-info-button",
    scope: ALL,
    why: "the header ? button is components-dev/InfoButton.tsx; hand-rolled copies drift in variant and opacity",
    re: /QuestionMarkCircleIcon/g,
    // charts and caution strips use the icon inline, not as a button; InfoButton is the component itself
    skip: (f) => /charts|TopSub|MarginKpi|CaseSummary|components-dev\/InfoButton\.tsx$/.test(f.path),
  },
  {
    id: "mobile-italic",
    scope: MOBILE,
    why: "italic is a hard no on dev mobile",
    re: /className="[^"]*\bitalic\b[^"]*"/g,
  },
  {
    id: "mobile-text-floor",
    scope: MOBILE,
    why: "dev mobile font floor is text-[10px]",
    re: /text-\[(?:[1-9])px\]/g,
  },
  {
    id: "text-opacity-floor",
    scope: ALL,
    // A dimmed lone separator glyph is decoration, not unreadable text.
    lineSkip: /className="[^"]*">\s*[·•|/\-]\s*</,
    why: "text-colour opacity floor is /95, desktop and phone (9 Nov 2026)",
    // The public portal and login shell (src/pages/home) are one copy shared
    // with prod, with their own portal palette; they change on their own.
    skip: (f) => /^src\/pages\/home\//.test(f.path),
    // disabled:/placeholder:/hover:/focus:/active: states are meant to read as dimmed.
    re: /(?<!(?:disabled|placeholder|hover|focus|group-hover|active):)\btext-[a-z_0-9-]+\/(?:[1-9]|[1-8][0-9]|9[0-4])\b/g,
  },
  {
    id: "navy-header-padding",
    scope: (f) => DESKTOP(f) && NAVY(f),
    why: "left panel navy header is px-4 pt-1 pb-2.5 — top tighter than bottom, never py- alone",
    re: /bg-\[#1e2a4a\][^"']*rounded-t-xl(?![^"']*px-4 pt-1 pb-2\.5)/g,
  },
  {
    id: "header-row-separator",
    scope: (f) => DESKTOP(f) && NAVY(f) && /rounded-t-xl/.test(f.src),
    why: "the 2-row header separator is exactly `pt-1.5 mt-1 border-t border-custom-white/[0.08]`",
    absent: /pt-1\.5 mt-1 border-t border-custom-white\/\[0\.08\]/,
  },
  {
    id: "hardcoded-severity-palette",
    scope: ALL,
    why: "meaning colours are tokens: severity_* (grades), delta_* (direction), brand_danger* (errors), severity_watch_* (notices); Tailwind's palette is brighter and doesn't follow a token change",
    // The pale fills and dark texts are the pill and notice register. Plain
    // bg-red-500 etc. are the list dots, deliberately saturated — not a violation.
    re: /\b(?:bg|text|border)-(?:red|amber|emerald|yellow|green|orange|rose)-(?:50|100|200|700|800|900)\b/g,
  },
  {
    id: "grey-text",
    scope: ALL,
    why: "text is text-content (/95 at least), text-brand_slate for small mono labels, placeholder:text-brand_placeholder for placeholders; Tailwind greys measured below contrast",
    re: /(?<!(?:disabled|placeholder):)\btext-(?:gray|slate)-(?:300|400|500)\b/g,
  },
  {
    id: "raw-hex",
    scope: ALL,
    why: "colours come from the tokens in src/index.css (a class, or rgb(var(--color-…)) where a class won't do); a raw hex doesn't follow a token change",
    // Exceptions: the public portal (its own palette, shared with prod), the
    // Upc List heat ramp and chart series colours, which the chart library
    // takes as plain colour strings and which no token stands for.
    skip: (f) => /^src\/pages\/home\/|heatColor\.ts$|HourTrendChart\.tsx$/.test(f.path),
    re: /\b(?:bg|text|border|from|to|via|ring|fill|stroke)-\[#[0-9a-fA-F]{3,8}\]|(?:color|background|backgroundColor|borderColor)\s*:\s*["'`]#[0-9a-fA-F]{3,8}/g,
  },
  {
    id: "local-shared-helper",
    scope: ALL,
    why: "re-implements a helper that already exists in src/utils/severity.ts — one shared fix beats N copies",
    re: /^\s*const (pillClass|severityDotClass|formatPct|chipClass|severityHeaderBgClass)\s*[=:]/gm,
  },
  {
    id: "darkened-backdrop",
    scope: ALL,
    why: "a modal blurs what is behind it (backdrop-blur-sm); a black sheet costs the page the colours the reader opened the modal about",
    re: /\bbg-black(?:\/\d+| bg-opacity-\d+)/g,
  },
  {
    id: "perf-row-selection",
    scope: (f) => f.family === "Performance" && DESKTOP(f) && /bg-row_selected/.test(f.src),
    why: "graded rows pair bg-row_selected with border-row_selected_border",
    absent: /bg-row_selected border-row_selected_border/,
  },
];

/* ── walk ───────────────────────────────────────────────────────────────── */

const files = [];
let treeCopies = 0;
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (e.endsWith(".tsx") || e.endsWith(".ts")) {
      const rel = p.split(sep).join("/");
      if (isTreeCopy(rel)) { treeCopies++; continue; }
      const page = rel.startsWith("src/components-dev/") ? "components-dev" : rel.split("/")[2];
      files.push({
        path: rel,
        page,
        family: FAMILY[page] ?? "Other",
        legacy: isLegacy(rel),
        src: strip(readFileSync(p, "utf8")),
      });
    }
  }
})(ROOTS[0]);
for (const r of ROOTS.slice(1)) (function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if ((e.endsWith(".tsx") || e.endsWith(".ts")) && !/\.test\./.test(e)) {
      const rel = p.split(sep).join("/");
      files.push({ path: rel, page: "components-dev", family: "Library", legacy: false, src: strip(readFileSync(p, "utf8")) });
    }
  }
})(r);
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if ((e.endsWith(".tsx") || e.endsWith(".ts")) && !/\.test\./.test(e)) {
      const rel = p.split(sep).join("/");
      files.push({ path: rel, page: "components", family: "Shared library", legacy: isLegacy(rel), shared: true, src: strip(readFileSync(p, "utf8")) });
    }
  }
})(SHARED_ROOT);

/* ── run ────────────────────────────────────────────────────────────────── */

const results = new Map(); // ruleId -> hits[]

for (const rule of RULES) {
  const hits = [];
  for (const f of files) {
    if (!rule.scope(f)) continue;
    if (rule.skip?.(f)) continue;

    if (rule.absent) {
      if (!rule.absent.test(f.src)) hits.push({ f, line: 0, text: "(missing)" });
      continue;
    }
    const lines = f.src.split("\n");
    lines.forEach((l, i) => {
      if (rule.lineSkip?.test(l)) return;
      const m = l.match(rule.re);
      if (m) hits.push({ f, line: i + 1, text: m[0].trim().slice(0, 60) });
    });
  }
  results.set(rule.id, hits);
}

/* ── report ─────────────────────────────────────────────────────────────── */

const pad = (s, n) => String(s).padEnd(n);
const bucket = (hits) => {
  const fams = new Set(hits.map((h) => h.f.family));
  const pages = new Set(hits.map((h) => h.f.page));
  if (fams.size >= 3) return "UNIVERSAL";
  if (pages.size > 1) return "CATEGORY";
  return "INDIVIDUAL";
};

console.log("\n" + "=".repeat(76));
console.log("  THEME / STYLING / STRUCTURE AUDIT");
console.log("  " + treeCopies + " prod/ snapshot files skipped (audited in dev/)");
console.log("  " + files.filter((f) => !f.legacy).length + " current files, " +
            files.filter((f) => f.legacy).length + " legacy (reported separately)");
console.log("=".repeat(76));

for (const level of ["UNIVERSAL", "CATEGORY", "INDIVIDUAL"]) {
  const rules = RULES.filter((r) => {
    const h = results.get(r.id).filter((x) => !x.f.legacy && !x.f.shared);
    return h.length && bucket(h) === level;
  });
  if (!rules.length) continue;

  console.log(`\n\n${level}`);
  console.log("-".repeat(76));

  for (const r of rules) {
    const hits = results.get(r.id).filter((h) => !h.f.legacy && !h.f.shared);
    const byPage = {};
    for (const h of hits) (byPage[h.f.page] ??= []).push(h);

    console.log(`\n  [${r.id}]  ${hits.length} hit(s) across ${Object.keys(byPage).length} page(s)`);
    console.log(`     why: ${r.why}`);
    for (const [page, hs] of Object.entries(byPage).sort((a, b) => b[1].length - a[1].length)) {
      console.log(`     ${pad(page + " (" + hs[0].f.family + ")", 30)} ${hs.length}`);
      for (const h of (VERBOSE ? hs : hs.slice(0, 3))) {
        console.log(`        ${h.f.path}:${h.line}  ${h.text}`);
      }
      if (!VERBOSE && hs.length > 3) console.log(`        … ${hs.length - 3} more (--verbose)`);
    }
  }
}

/* ── shared library ratchet ─────────────────────────────────────────────── */

const shared = {}; // path -> rule -> hits[]
for (const r of RULES)
  for (const h of results.get(r.id).filter((x) => x.f.shared && !x.f.legacy))
    ((shared[h.f.path] ??= {})[r.id] ??= []).push(h);
const counts = Object.fromEntries(Object.entries(shared).sort().map(([p, rs]) =>
  [p, Object.fromEntries(Object.entries(rs).sort().map(([id, hs]) => [id, hs.length]))]));
if (UPDATE) {
  writeFileSync(BASELINE, JSON.stringify(counts, null, 2) + "\n");
  console.log(`\nBaseline written: ${BASELINE}`);
}
let base = {};
try { base = JSON.parse(readFileSync(BASELINE, "utf8")); } catch { /* no baseline yet: every hit is new */ }
let over = 0, under = 0;
const sharedTotal = Object.values(counts).reduce((a, rs) => a + Object.values(rs).reduce((b, n) => b + n, 0), 0);
console.log(`\n\nSHARED LIBRARY (src/components): ${sharedTotal} known hit(s), held for the promotion`);
for (const [p, rs] of Object.entries(shared)) for (const [id, hs] of Object.entries(rs)) {
  const allowed = base[p]?.[id] ?? 0;
  if (hs.length > allowed) {
    over += hs.length - allowed;
    console.log(`  NEW  [${id}] ${p}: ${hs.length} hit(s), baseline ${allowed}`);
    for (const h of hs) console.log(`        ${p}:${h.line}  ${h.text}`);
  }
}
for (const [p, rs] of Object.entries(base)) for (const [id, n] of Object.entries(rs))
  if ((counts[p]?.[id] ?? 0) < n) under += n - (counts[p]?.[id] ?? 0);
if (under && !UPDATE) console.log(`  ${under} fewer than the baseline: run with --update-baseline to lock that in.`);

const legacyTotal = RULES.reduce(
  (a, r) => a + results.get(r.id).filter((h) => h.f.legacy).length, 0);
console.log(`\nLEGACY (not counted above): ${legacyTotal} hit(s) — being replaced, ignore unless porting.`);
const liveTotal = RULES.reduce(
  (a, r) => a + results.get(r.id).filter((h) => !h.f.legacy && !h.f.shared).length, 0) + over;
console.log(`TOTAL: ${liveTotal} hit(s)`);
console.log("");
if (liveTotal > 0) process.exitCode = 1;
