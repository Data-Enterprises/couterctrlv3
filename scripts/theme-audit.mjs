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
 * Run: npm run audit:theme        (add --verbose for every hit, not just 3)
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, sep } from "node:path";

const ROOT = "src/pages";
const VERBOSE = process.argv.includes("--verbose");

/* ── page families ──────────────────────────────────────────────────────── */

const FAMILY = {
  sales: "Performance", lossPrevention: "Performance",
  subDepts: "Performance", categories: "Performance",
  orders: "Data", receivers: "Data", coupons: "Data", couponSales: "Data",
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

const isLegacy = (p) =>
  /legacy/i.test(p) || /tabletComps/.test(p) || /Tablet\.tsx$/.test(p);
const isMobile = (p) => /mobile/i.test(p);

/** The mobile floors (font size, opacity, no-italic) are dev-mobile rules.
 *  These trees have never been through the dev refactor, so a hit there is
 *  un-migrated legacy rather than drift — counted separately. */
const NO_DEV_FORK = new Set(["cashiers", "forecast", "home", "priceSimulator",
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
    scope: DESKTOP,
    why: "the header ? button is src/components/InfoButton.tsx; hand-rolled copies drift in variant and opacity",
    re: /QuestionMarkCircleIcon/g,
    // charts legitimately use the icon inline, not as a header button
    skip: (f) => /charts|TopSub|MarginKpi/.test(f.path),
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
    id: "mobile-opacity-floor",
    scope: MOBILE,
    // A dimmed lone separator glyph is decoration, not unreadable text.
    lineSkip: /className="[^"]*">\s*[·•|/\-]\s*</,
    why: "dev mobile text-colour opacity floor is /85",
    // disabled:/placeholder: states are meant to read as dimmed — not drift.
    re: /(?<!(?:disabled|placeholder|hover|focus|group-hover):)\btext-[a-z_0-9-]+\/(?:[1-9]|[1-7][0-9]|8[0-4])\b/g,
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
    why: "severity pills must use the severity_* tokens; Tailwind's red/amber/emerald-100 are brighter and don't follow a token change",
    // The -100/-800 pair is the *pill* register. Plain bg-red-500 etc. are the
    // list dots, which are deliberately saturated — not a violation.
    re: /\b(?:bg|text)-(?:red|amber|emerald|yellow|green)-(?:100|800)\b/g,
  },
  {
    id: "local-shared-helper",
    scope: ALL,
    why: "re-implements a helper that already exists in src/utils/severity.ts — one shared fix beats N copies",
    re: /^\s*const (pillClass|severityDotClass|formatPct|chipClass|severityHeaderBgClass)\s*[=:]/gm,
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
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (e.endsWith(".tsx") || e.endsWith(".ts")) {
      const rel = p.split(sep).join("/");
      files.push({
        path: rel,
        page: rel.split("/")[2],
        family: FAMILY[rel.split("/")[2]] ?? "Other",
        legacy: isLegacy(rel),
        src: strip(readFileSync(p, "utf8")),
      });
    }
  }
})(ROOT);

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
console.log("  " + files.filter((f) => !f.legacy).length + " current files, " +
            files.filter((f) => f.legacy).length + " legacy (reported separately)");
console.log("=".repeat(76));

for (const level of ["UNIVERSAL", "CATEGORY", "INDIVIDUAL"]) {
  const rules = RULES.filter((r) => {
    const h = results.get(r.id).filter((x) => !x.f.legacy);
    return h.length && bucket(h) === level;
  });
  if (!rules.length) continue;

  console.log(`\n\n${level}`);
  console.log("-".repeat(76));

  for (const r of rules) {
    const hits = results.get(r.id).filter((h) => !h.f.legacy);
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

const legacyTotal = RULES.reduce(
  (a, r) => a + results.get(r.id).filter((h) => h.f.legacy).length, 0);
console.log(`\n\nLEGACY (not counted above): ${legacyTotal} hit(s) — being replaced, ignore unless porting.`);
console.log("");
