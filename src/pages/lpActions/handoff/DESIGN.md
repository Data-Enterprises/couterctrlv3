# Cashier Exception Case File — design & port spec

Reference implementation: `exception-case-file.html` (single file, no build step).
This document is the contract. Where the two disagree, **this document wins** — the HTML
is a sketch that proves the layout works, not a style guide.

Target: React + TypeScript.

---

## 0. How to use this with Claude Code

Put `DESIGN.md` and `exception-case-file.html` side by side in the repo, then:

```
Read DESIGN.md and exception-case-file.html. Implement §5 Component inventory
as React components under src/features/exceptions/, using our existing
<DataTable> and <Card> primitives where §5 says "reuse". Do not port the mock
data generator — take the props defined in §6. Start with DeviationBar and
StackedBarChart only; I'll review before you continue.
```

Two things that matter in that prompt: **scoping it to a couple of components** so you
can course-correct early, and **explicitly forbidding the mock generator**, which is 90
lines of fabricated data an agent will otherwise faithfully port.

---

## 1. What this screen is for

A store manager or LP analyst has a cashier flagged and needs to answer, in order:

1. **Is this person actually an outlier?** → peer multiple, not raw counts
2. **What kind of outlier?** → which exception type is out of line, on a comparable scale
3. **Is it a pattern or noise?** → when it clusters
4. **Can I prove it?** → the receipts

Every design decision below serves that sequence. If a change makes one of those four
questions harder to answer, it's the wrong change regardless of how it looks.

**The screen is one cashier, one period.** It does not scale to a roster view — that's a
separate screen that sits above this one and is out of scope here.

---

## 2. Design tokens

Ship these as CSS custom properties, not Tailwind utilities. Three theme states must
work: explicit light, explicit dark, and unstamped (OS preference). Define the complete
light palette on bare `:root`; redefine **only** tokens in the two dark blocks.

```css
:root{
  /* surfaces */
  --paper:#F1F4F8;        /* page ground */
  --surface:#FBFCFD;      /* cards */
  --surface-2:#E7ECF3;    /* recessed: bar tracks, weekend bands, facet bars */
  --surface-3:#F5F7FA;    /* row hover, expanded detail */

  /* ink — navy-biased neutrals, not pure grey */
  --ink:#0F1724;
  --ink-2:#48566E;
  --ink-3:#7A879D;
  --rule:#D9E0EA;
  --rule-strong:#C4CEDC;

  /* chrome — the dossier header */
  --chrome:#16233D;
  --chrome-ink:#EAEEF5;
  --chrome-ink-2:#A0ADC4;

  /* categorical — exception types. See §3 before touching these. */
  --s-void:#9E2B2B;
  --s-cancel:#2E5E9E;
  --s-nosale:#B57C10;
  --s-refund:#109A72;

  /* tints — expanded-row accents only, never chart fills */
  --s-void-t:#F5E5E4;
  --s-cancel-t:#E4EBF5;
  --s-nosale-t:#F6EDDC;
  --s-refund-t:#DFF1EA;

  --shadow:0 1px 2px rgba(15,23,36,.06), 0 6px 18px -10px rgba(15,23,36,.22);
}

@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){ /* dark values — see §2.1 */ }
}
:root[data-theme="dark"]{ /* same dark values */ }
```

### 2.1 Dark values

```css
--paper:#0C1017;  --surface:#171A21;  --surface-2:#212733;  --surface-3:#1B2029;
--ink:#EDF0F5;    --ink-2:#A3AEC1;    --ink-3:#6E7B90;
--rule:#2A313D;   --rule-strong:#3B4453;
--chrome:#070A10; --chrome-ink:#EDF0F5; --chrome-ink-2:#93A0B7;
--s-void:#CF5F58; --s-cancel:#5B93DE; --s-nosale:#B58819; --s-refund:#1E9E77;
--s-void-t:#331E1E; --s-cancel-t:#1B2534; --s-nosale-t:#2E2716; --s-refund-t:#12281F;
--shadow:0 1px 2px rgba(0,0,0,.4), 0 8px 24px -12px rgba(0,0,0,.7);
```

**Rule:** never declare a color whose only definition lives inside a media query or a
`[data-theme]` block. That's how you get one theme's text on the other theme's ground.
Components reference tokens; tokens carry the theme.

### 2.2 Typography

| Role | Face | Usage |
|---|---|---|
| UI / headings | **Archivo** 400/500/600/700 | everything that is words |
| Data | **IBM Plex Mono** 400/500/600 | every numeral, transaction ID, timestamp, currency, count |

The mono-for-numerals rule is not decoration — it's a receipt audit, and tabular figures
make columns of amounts scannable. Apply `font-variant-numeric: tabular-nums` alongside.

Scale: 64 / 38 / 26 / 19 / 16 / 14 / 13.5 / 12.5 / 11 / 10.5px. Uppercase micro-labels
get `letter-spacing: .09em–.1em`. Stay on the scale.

Substitute the faces if you already have a licensed pair — but keep the *pairing logic*:
one grotesque for language, one mono for data.

---

## 3. Color rules — read before changing any hex

The four categorical hues were selected and machine-validated, not chosen by eye. They
pass, in both light and dark, at every adjacent pair: colorblind separation ΔE ≥ 8
(OKLab ×100), normal-vision separation ΔE ≥ 15, and ≥ 3:1 contrast against the chart
surface.

**Non-negotiable:**

- **Color follows the exception type, forever.** Voided is `--s-void` whether it's first
  in the list or filtered out entirely. Never assign color by rank or array index — a
  reader who learned "red = voided" must never be retrained by a filter.
- **Slot order is `[void, cancel, nosale, refund]`** in every stack and legend. That
  order is what passes the adjacent-pair check; reordering (e.g. sorting stacks by
  volume, which would put gold next to red) breaks it.
- **Two types may not share a hue.** The current production screen colors both Voided and
  Cancelled the same red. That is the single worst bug in the existing design — the two
  most serious types are visually identical.
- **Text never wears a series color.** Values, labels and legend text use `--ink` /
  `--ink-2` / `--ink-3`; a colored swatch beside them carries the identity. The one
  exception is the multiple on a deviation card, which is the card's whole point.
- **No status palette.** There is deliberately no separate red/amber "severity" color,
  because it would collide with Voided. Severity is encoded by *position* (sort order),
  *bar length past the 1× mark*, and the multiple stated in text. Don't add one.

If you change a hex, re-validate the set rather than eyeballing it.

---

## 4. Layout

```
┌─ CaseFileHeader ────────────────────────── chrome bg, full bleed ─┐
│  identity + period + actions                                      │
│  ── rule ──                                                       │
│  2.7×   sentence explaining it        rank / value / days active   │
└───────────────────────────────────────────────────────────────────┘
   01  Exception breakdown              [Deviation|Volume|$ exposure]
   ┌────────┬────────┬────────┬────────┐  4-up, 2-up <1080px, 1-up <620px
   │ Deviation cards                    │
   └────────┴────────┴────────┴────────┘
   02  When it happens
   ┌─ StackedBarChart: per shift, 13 cols, weekend bands, peer ref ─┐
   │  FindingLine                                                   │
   └────────────────────────────────────────────────────────────────┘
   ┌─ by hour ──────────────┬─ by day of week ──────────────────────┐
   03  Evidence
   ┌─ FacetRail ─┬─ EvidenceTable ──────────────────────────────────┐
   │  sticky     │  sticky thead, max-height 560px, expandable rows │
   └─────────────┴──────────────────────────────────────────────────┘
```

Max width 1420px. Section padding 28px. Card gap 14px. Lay out sibling groups with
grid/flex `gap`, not per-element margins.

Wide content (the table, the charts) scrolls inside its own `overflow-x:auto` container.
The page body never scrolls sideways.

---

## 5. Component inventory

Reuse your existing primitives where noted; build the rest.

### `<CaseFileHeader>`

```ts
interface CaseFileHeaderProps {
  cashier:  { id: string; name: string; storeLabel: string; lanes: number[] };
  period:   { from: string; to: string; shiftCount: number };   // ISO dates
  summary:  CaseSummary;                                        // §6
  flagged:  boolean;
  onFlag:   () => void;
  onNote:   () => void;
  onExport: () => void;
}
```

The headline number is `summary.multiple`, at 64px, in mono. The sentence beside it is
generated, not authored — see §7.4.

### `<DeviationCard>` / `<DeviationBar>`

```ts
interface DeviationBarProps {
  multiple: number;          // e.g. 3.0
  color: string;             // CSS var reference, e.g. 'var(--s-void)'
  max?: number;              // default 4 — the shared axis ceiling
}
```

**The axis is shared and fixed at 0×–4× for every card**, with a tick at 1×. That's what
makes a 3.3× Cancelled (19 events) comparable to a 1.6× No Sale (26 events). If you make
each bar relative to its own value, you have rebuilt the sparkline problem.

Values above `max` clamp the fill but still print the true multiple in the label.

### `<StackedBarChart>`

One component, three uses (per shift / per hour / per weekday). Hand-rolled SVG — about
90 lines. **Don't reach for Recharts here.** The 2px surface gap between stacked
segments, the token-driven theming, and the reference-line-in-the-right-gutter all fight
a charting library's defaults harder than writing the scales yourself. If you want
scales without chrome, `d3-scale` alone is the right amount of dependency.

```ts
interface StackedBarCategory {
  key: string;
  label: string;              // axis label, e.g. "8" or "Sat" or "7p"
  sublabel?: string;          // second axis line, e.g. "S"
  counts: Record<ExceptionTypeKey, number>;
  total: number;
  band?: boolean;             // weekend / shaded column
  emphasis?: boolean;         // bold axis label
  tooltipTitle?: string;
}

interface StackedBarChartProps {
  categories: StackedBarCategory[];
  reference?: { value: number; label: string };   // peer average line
  maxBarWidth?: number;
  height?: number;
}
```

Mark specs, all three charts:

- 2px `--surface` gap between stacked segments (a gap, **not** a stroke around each mark)
- 2px corner radius on the data end only
- gridlines and axes: solid hairlines in `--rule`. Never dashed.
- reference line: 1.5px solid `--ink-3`, label in the right gutter **outside** the plot
  area, never overlapping bars
- direct-label the single tallest bar. Never every bar.
- legend always present when ≥2 series

### `<FindingLine>`

```ts
interface FindingLineProps { finding: Finding; }   // §6
```

Left tick rule in the color of the type it describes, then a sentence with the numbers
in `<b>`. See §7.4 — the sentence is computed server-side, not written by hand.

### `<FacetRail>`

```ts
type FacetKey = 'type' | 'dayOfWeek' | 'timeBlock' | 'lane' | 'tender';

interface FacetRailProps {
  facets: FacetGroup[];
  active: Partial<Record<FacetKey, Set<string>>>;
  onToggle: (key: FacetKey, value: string) => void;
}

interface FacetGroup {
  key: FacetKey;
  label: string;
  values: { value: string; label: string; count: number; swatch?: string }[];
}
```

Sticky at `top: 12px`. Each row is a `<button>` with `aria-pressed`, a background bar
scaled to `count / maxCountInGroup`, and the count right-aligned in mono. Multi-select
within a group (OR), intersect across groups (AND).

### `<EvidenceTable>`

Reuse your `<DataTable>` if it supports sticky headers and expandable rows; otherwise a
plain table is fine — it's 141 rows, not 141,000.

Columns: Date · Time · Transaction · Lane · Type · Item · Qty · Amount.
Numerics right-aligned, mono. Negative amounts in `--s-refund`. Zero amounts render `—`,
not `$0.00` — a column of zeros is wasted space.

Row click expands one detail panel (accordion — opening one closes the last), showing the
full receipt: every line on that transaction, with the clicked line tinted, plus receipt
ID, tender, count of this exception type on the receipt, and total receipt exposure.

---

## 6. Data contract

One request per case file.

```
GET /api/loss-prevention/case-file
    ?cashierId=40&storeId=002&from=2026-08-01&to=2026-08-13
```

```ts
type ExceptionTypeKey = 'void' | 'cancel' | 'nosale' | 'refund';

interface CaseFile {
  cashier: {
    id: string;
    name: string;
    storeId: string;
    storeLabel: string;      // "IGA #002"
    lanes: number[];         // lanes worked, in the order worked
  };
  period: { from: string; to: string; shiftCount: number };
  summary: CaseSummary;
  byType: TypeSummary[];
  findings: Finding[];
  events: ExceptionEvent[];
}

interface CaseSummary {
  occurrences: number;        // 141
  expected: number;           // 52  — from the peer cohort, NOT occurrences/multiple
  multiple: number;           // 2.7
  peerRank: number;           // 1
  peerCount: number;          // 18
  exceptionValue: number;     // 677.74 — sum of |amount|
  peerCohort: string;         // "All cashiers, IGA #002, same period"
}

interface TypeSummary {
  key: ExceptionTypeKey;
  label: string;              // "Voided"
  occurrences: number;
  receipts: number;           // may equal occurrences
  total: number;              // signed; refunds negative
  average: number;
  daysActive: number;
  expected: number;
  multiple: number;
}

interface ExceptionEvent {
  id: string;
  receiptId: string;          // "36-907353-4-8-4-2026"
  transactionNo: number;
  occurredAt: string;         // ISO 8601 with offset — see §7.5
  lane: number;
  type: ExceptionTypeKey;
  item: string;
  department: string;
  quantity: number;
  amount: number;             // signed; 0 for no-sale
  tender: string | null;      // null for no-sale
}

interface Finding {
  type: ExceptionTypeKey;
  count: number;
  ofTotal: number;
  dimension: 'dayHour' | 'lane' | 'tender' | 'item';
  window: string;             // "Saturdays, 4p–7p"
  detail: string;             // "covering lane 3"
  text: string;               // full rendered sentence
}
```

### Three things worth arguing about now, not later

**`expected` comes from the server.** The mockup back-computes it by dividing by the
multiple, because the multiple was all I had. In production the peer baseline is the
real computation and the multiple is derived from it — not the reverse. Whoever owns
that calculation should also own what "peer" means (same store? same daypart? same
tenure?) and return it in `peerCohort` so the screen can state its own assumptions.

**Bin client-side until it hurts.** At 141 events, deriving every chart and every facet
count in the browser from `events[]` is correct and keeps the filtering instant. Above
roughly 5,000 events, move binning server-side and add a `bins` block to the payload —
but keep `events[]` for the table, paginated. Don't build the server-side path first.

**`daysActive` needs a denominator.** "13 days" is meaningless without "of 13 shifts
worked." Return both, or return a ratio.

---

## 7. Interaction rules

These are the behaviors the mockup implements but doesn't explain. They're easy to get
subtly wrong.

**7.1 Facet counts are conditional, and a facet does not condition itself.** When
computing counts for the *Lane* group, apply every active filter **except** Lane. This
is why selecting Lane 3 doesn't collapse the other lanes to zero, and it's what lets a
user see "if I also picked Lane 4, I'd get 45 more" while Lane 3 is selected. Getting
this wrong makes multi-select within a group useless.

**7.2 Filters never repaint the charts' color assignment.** Filtering to Voided-only must
not promote Cancelled's blue to slot 1. See §3.

**7.3 The evidence count line restates the filter result in both units** — number of
exceptions and total value — because those two numbers diverge in ways that matter (26
no-sales are worth $0.00 and still the most interesting thing on the screen).

**7.4 The finding sentence is computed, not authored.** Scan (day-of-week × 3-hour block)
for the densest cluster of the highest-deviation type, and render:

> **{n} of {total} {type}** land in a single recurring window — **{window}**, {detail}.
> That is {pct}% of her {type} in {hours} hours of the period.

If no cluster exceeds a threshold (suggest: 20% of that type's volume in ≤10% of the
period's hours), render nothing rather than a weak claim. An LP screen that cries wolf
gets ignored.

**7.5 Timezones.** Every timestamp is store-local. A void at 8:47pm belongs to that
store's Saturday close, not to UTC Sunday. Send offsets and bin in store time, or the
day-of-week chart — the whole point of which is shift patterns — will be quietly wrong
for evening events.

**7.6 Tooltips are not optional.** Crosshair-free per-bar tooltip on every chart, hit
target spanning the full column width, not just the bar.

---

## 8. Accessibility

- Legend present whenever ≥2 series; identity is never carried by color alone — every
  chart is backed by the evidence table, which is the table view.
- All facet rows and table rows are real `<button>` / focusable elements with
  `aria-pressed` / `aria-expanded`. Visible focus ring (`--s-cancel`, 2px, 2px offset).
- Respect `prefers-reduced-motion` — kill the transitions, keep the layout.
- Currency and counts announce properly: don't put `$` in a separate span from the digits.

---

## 9. Do not port

From `exception-case-file.html`, discard:

- **the entire mock data section** — `mk()`, `VOID_BY_DAY`, `NOSALE_ROWS`, `ITEMS_VOID`,
  the total-forcing IIFEs, and everything down to `EVENTS.sort(...)`. Roughly 90 lines.
  It exists so the interactions have something to move.
- **the `.note` block** at the bottom of the page (the wireframe caveat).
- **`Ann Delacroix`** — invented surname; the source data has only "Ann".
- **`peerRank: 1 of 18`** — invented. Real value comes from `summary`.
- Hour-of-day distributions, item names, tenders, and 11 of the 26 No Sale receipts are
  plausible fill. The totals, peer multiples, day-of-week shapes, and 15 of the No Sale
  receipts are from the live screens.

---

## 10. Suggested build order

1. Tokens + typography, both themes. Verify the unstamped OS-dark case explicitly.
2. `DeviationBar` and `DeviationCard`. Smallest piece, highest information value.
3. `StackedBarChart` against static fixtures. Get the marks and reference line right
   before wiring data.
4. `CaseFileHeader`.
5. `FacetRail` + `EvidenceTable` with the §7.1 conditional-count logic. Test with two
   filters active in different groups — that's where the bug lives.
6. `FindingLine` last; it depends on real binning.

Ship 1–4 behind a flag and put it in front of one store manager before building 5.
