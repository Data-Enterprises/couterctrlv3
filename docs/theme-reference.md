# Theme quick reference

The design-system rules, in one place. `scripts/theme-audit.mjs` enforces most
of what is below and its header refers to "the documented design-system rules"
— this is that document.

Run the audit with:

```bash
npm run audit:theme
```

Add `--verbose` for every hit rather than the first three per page.

---

## 1. Where the truth lives

| Thing | File |
| --- | --- |
| Colour tokens | `src/index.css`, the `:root` block under `@layer base` |
| Tailwind names for those tokens | `tailwind.config.js` |
| Mobile series colours | `src/components-dev/mobile/perf/perfColors.ts` |
| Heat ramp | `src/pages/upc/dev/utils/heatColor.ts` |
| Severity helpers | `src/utils/severity.ts` |
| The rules, executable | `scripts/theme-audit.mjs` |

A token is defined **once**, in `index.css`, as a space-separated RGB triplet:

```css
--color-brand-navy: 30 42 74;
```

and consumed either through Tailwind (`bg-brand_navy`, `text-brand_navy/85`) or,
where a class will not do, as `rgb(var(--color-brand-navy) / 0.12)`.

Inside a Tailwind arbitrary value there can be no spaces, so use the slash form
without them: `shadow-[0_1px_2px_rgb(var(--color-brand-navy)/0.08)]`.

---

## 2. Colour

### The two navies

| Token | Value | Used by |
| --- | --- | --- |
| `brand_navy` / `brand_navy_hover` | `#1e2a4a` / `#2a3a63` | The authenticated app. Headers, buttons, rails, focus rings, every tree. |
| `portal_navy` / `portal_navy_hover` | `#0F2440` / `#1b3a63` | The public portal and the login shell only. |

They are deliberately separate so the marketing front door and the
authenticated shell can diverge without one restyling the other.

### Surfaces

| Token | Value | Job |
| --- | --- | --- |
| `bkg` | `#e4e9ef` | The page ground. Also the empty half of a bar track. |
| `custom-white` | `#f4f7f8` | Cards, panels, bars, headers. |
| `brand_paper` | `#fafcfe` | A lighter fill inside a card. |
| `row_selected` + `row_selected_border` | `#eff1f2` / `#8a9bb0` | Row selection. Always the pair. |
| `filter_active` + `filter_active_border` | `#dbeafe` / `#2563eb` | "This filter is narrowing the list" — louder than row selection on purpose. |
| `row_stripe` | `#ecedef` | Zebra stripes in dense grids. |
| `brand_line` / `brand_line_2` | `#dce5ef` / `#c8d5e4` | Hairlines and borders. |

**Never write `bg-white`, `text-white`, `border-white`.** They bypass
`--color-custom-white`, so themed and unthemed surfaces drift apart. The audit
rule is `raw-white`.

### Meaning colours

Three families, three jobs. They are not interchangeable.

| Family | Tokens | Job |
| --- | --- | --- |
| Severity | `severity_critical_*`, `severity_watch_*`, `severity_healthy_*` | Grading data against a threshold. |
| Delta | `delta_positive_*`, `delta_negative_*` | Direction of change. |
| Danger | `brand_danger`, `brand_danger_bg`, `brand_danger_line` | Form errors and validation. Not a grade. |

**Never hand-write `bg-red-100` / `text-amber-800` / `bg-emerald-100`.** Those
are brighter than the tokens and do not follow a token change. The audit rule
is `hardcoded-severity-palette`, and it is the most-violated rule in the repo.
Saturated dots (`bg-red-500`) are a separate, deliberate register and are fine.

### Text

| Token | Value | Job |
| --- | --- | --- |
| `content` | `#1e293b` | All body text. |
| `brand_slate` | `#5a6c84` | Small mono labels — timestamps, fact keys, panel footers. |
| `brand_slate_2` | `#647489` | The same, one step lighter. |
| `brand_placeholder` | `#6e7f96` | Input placeholders. |

The lighter greys that used to sit here (`#94A3B8`, `#8D9CB0`, `#A3B0C2`)
measured 2.2–2.8:1 against the card and were replaced in the Aug 2026 handoff
revision. Do not reintroduce them.

---

## 3. Opacity

**Text never goes below `/95`.** This is the rule most easily broken by eye,
because 70% still looks readable on a bright monitor and does not on a phone in
a store.

Raised from `/85` in Oct 2026. The old floor was set against a monitor; at
arm's length outdoors the difference between 85% and full strength is the
difference between reading a figure and guessing it, and these screens are read
standing in a shop.

```jsx
text-content/95     ✓
text-content/85     ✗
```

Four exceptions, all of which the audit already skips:

- `disabled:` and `placeholder:` states — meant to read as dimmed.
- `hover:` / `focus:` / `group-hover:` transitions.
- A lone separator glyph (`·`, `|`, `/`) used as decoration.
- The dimmed bar in `PairedBars` (`LOSER_OPACITY`, 0.42), which encodes which
  of a pair is larger and is a graphic, not a label.

Fills and borders may go below 85% freely — `border-brand_navy/15`,
`bg-brand_navy/[0.06]` are all normal.

---

## 4. Mobile (the dev tree)

| Rule | Value |
| --- | --- |
| Text opacity floor | `/95` |
| Font floor | `text-[10px]` for body; `text-[9.5px]` only for mono uppercase captions |
| Italic | Never |
| Severity chips on Performance pages | None. Mobile Performance does not grade. |

### The components, and what they are for

| Component | Job |
| --- | --- |
| `MobilePerfCard` | A row that opens where it sits. **Expanding is not navigation.** |
| `MobilePerfDetail` | A breakdown as its own screen, with a named `backLabel`. |
| `PerfCardHeader` | The white in-card header: magnifier, title, `?`, mono line. |
| `MobilePerfHeader` | The older navy two-row header. Coupons, Orders, Cashiers. |
| `MobileSortChips` | A scrolling pill row. Sorting, or picking a lens. |
| `PairedBars` | Two figures on one shared scale, smaller one dimmed. |
| `PerfDayChart` | Seven pairs of columns; also the screen's only day filter. |

### Composition

- Content lives in `<section>` cards: `rounded-2xl border border-gray-200
  bg-custom-white shadow-md`, stacked with `gap-3` inside `p-3`.
- **A filter belongs inside the card it filters.** The search field, the sort
  chips and the scope line all sit inside the list's own card.
- **Navigation belongs in a bar under the header**, not floating between cards
  and not inside a card. `ItemPerfMobile` states this directly.
- The figure beside a card's title is small, neutral and never graded — it is
  "information and never a verdict".
- The hero figure is `font-display text-[31px] font-extrabold`; supporting
  figures go in a borderless two-column grid under one `border-gray-100` rule,
  each a `font-mono text-[9.5px] uppercase` caption over `text-[15px] font-bold`.
- `KpiTileGrid` is a **desktop** component. Its divided band becomes a bordered
  lattice when it wraps to two across. Use the hero + supporting grid instead.

### Chrome

- `TitleBar` is `h-12`, white on prod and **navy on the dev API**, so which
  tree you are in is never a question. Every mobile screen sits under it — it
  is the `3rem` in `h-[calc(100dvh-3rem)]`.
- The bottom tab bar is 56px, `bg-custom-white border-t border-gray-200`, with
  category icons at `brand_navy` active and `brand_navy/0.35` inactive.

### The module-screen pattern

Settled Sep 2026 while bringing the Analytics pages to the phone. A page that
lists things and analyses each one is built as **one screen**, in this order:

1. **The scope card.** Store or group, window, and the set's headline figure
   with its comparison. It carries the magnifier back to search and the `?`.
   It **never collapses, never minimises and is not selectable** — it is where
   the single-store or group information lives, and it reads the same whatever
   is open below it.
2. **The nav bar**, attached under the scope card's information above a
   `border-gray-100` rule. Picking a module or a view is navigation, so it is
   a bar. A filter is not, and goes inside the card it filters.
3. **The find row**, in its own card directly under the scope card. Adding an
   item is how you get anywhere on this screen, so it sits where it can be
   reached without scrolling past everything already scanned — never at the
   foot of the list.
4. **The item cards**, one `MobilePerfCard` each, opening in place.

There is no second screen, no page header slab and no back link inside the
flow. The item's name and code live on its own card, which is the only place
they mean anything.

**Inside an open card**, follow `PerfStoreReport`'s order — it reads as the
window narrowing, and it is deliberate:

> the shape of the period first, then the figure those add up to, then that
> figure against last year, then what made it up.

Then the supporting figures, then the insight strip.

**The collapsed card's comparison slot** takes whatever compares best for that
module — `PairedBars` on most pages, but any small graphic will do. Opening the
card should grow that graphic rather than replace it: the collapsed form is the
full one at the size a row can afford, drawn from the same data and the same
ramp.

**Insight strips open closed on mobile.** `CtaInsightStrip` is already
expandable; a phone shows the verdict and one short line, with the full
sentence behind the chevron. Tone (up / down / flat) is a direction flag and is
allowed there — it is not a severity grade, and it is the only coloured thing
on the card.

**Totals reconcile.** If a card shows a breakdown that sums, the sum shown must
be the same figure on the card's own title row, the way the desktop week grid
puts the period total in its corner.

### Translating a wide desktop grid

Transposing beats shrinking. A seven-column grid at 340px gives about 41px a
cell, which costs the currency symbol, the cents and the full day name. Turned
on its side it becomes seven rows that keep every figure legible, and vertical
is the direction a phone scrolls anyway. This is the move that worked for the
companions table, the forecast row and the Sales Comp day grid.

Do not substitute a different component to dodge the problem. Swapping the
Sales Comp heat grid for `PerfDayChart` looked tidy and silently dropped the
per-day delta row, which was the thing the grid existed to show.

---

## 5. Desktop panels

- Navy left-panel header padding is exactly `px-4 pt-1 pb-2.5` — top tighter
  than bottom, never `py-` alone.
- A two-row navy header separates its rows with exactly
  `pt-1.5 mt-1 border-t border-custom-white/[0.08]`.
- A graded row pairs `bg-row_selected` with `border-row_selected_border`.
- The header `?` is `src/components/InfoButton.tsx`. Hand-rolled
  `QuestionMarkCircleIcon` buttons drift in variant and opacity.

---

## 6. Do not re-implement

These already exist in `src/utils/severity.ts`: `pillClass`,
`severityDotClass`, `formatPct`, `chipClass`, `severityHeaderBgClass`. One
shared fix beats N copies.

---

## 7. Tailwind classes must be literal

Tailwind scans source text, so a class assembled at runtime is never emitted
and the element renders unstyled:

```jsx
bg-severity_${sev}_bg                    ✗ never emitted
sev === "critical" ? "bg-severity_critical_bg" : "bg-severity_healthy_bg"   ✓
```

Appending a separate class is fine — `` `text-ellipsis${cond ? " x" : ""}` `` —
because the variable does not complete the class name.

---

## 8. What the audit does not cover

Worth knowing before trusting a clean run:

- It scans `src/pages` only. `src/components` and `src/components-dev` have
  never been scanned, and that is where the shared components live.
- It skips `src/pages/*/prod/` — those are released snapshots, fixed by
  promoting `dev/` over them rather than edited in place.
- The font-floor regex is `text-\[[1-9]px\]`, so decimals like `text-[9.5px]`
  pass. That is mostly correct, since 9.5px mono captions are the established
  pattern, but it means the rule is not checking what its name says.
- Nothing checks colour *contrast*. The token values were measured by hand
  during the Aug 2026 handoff revision; a new colour needs the same treatment.
