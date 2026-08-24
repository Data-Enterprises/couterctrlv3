# Sales Tracker v2 — Understanding Pass & Hybrid Spec

**Goal:** a new Sales Tracker that keeps the legacy tracker's *data model and drill-down*, rebuilt on the current Sales page's *theme, layout and grading system*.

This document is the "full understanding" pass of both sides, then a concrete recommendation for the hybrid.

---

## 0. Where each thing lives

`src/DevPages.tsx:48`

```tsx
return devMode ? <Sales /> : <SalesLegacy />;
```

One route, two implementations, switched on `state.app.devMode`. Everything below sits under `src/pages/sales/`.

| | **Sales (current)** | **Legacy Sales Tracker** |
|---|---|---|
| Entry | `Sales.tsx` → `SalesLedger.tsx` | `SalesLegacy.tsx` (`dashboardOption === "tracker"`) → `tracker/SalesTracker.tsx` |
| Redux | `salesSlice` (raw data) + `salesLedgerSlice` (all UI state) | `salesLegacySlice` (data **and** UI state, one slice) |
| Slice access | direct `useAppSelector` | `useSalesState()` / `useSalesActions()` — devMode-switched shim |
| API | `sales/weekly` + `hourly/hourly`, ×3 periods | `subs/sub_sales`, paginated, TY + LY |
| Date input | `search.singleDate` (week-ending) | `search.startDate` / `search.endDate` (arbitrary range) |
| Grain | store → day → sub dept → hour → item | sub dept → week → day |
| Responsive | `SalesLedgerMobile`, `SalesTablet` | `SalesMobile`, `SalesTablet`, `SalesTrackerTablet`, `mobile/salesTracker/*` |

---

## PART 1 — Sales (current): the Ledger

### 1.1 Component tree

```
Sales.tsx                       (thin device shim — lines 251-254)
├── isMobile  → mobile/SalesLedgerMobile
├── isTablet  → tablet/SalesTablet
└── SalesLedger.tsx             ← the desktop page
    ├── components/LedgerEntryCard   (→ shared components/SearchCard) — pre-search state
    └── flex row, h-[calc(100vh-5rem)]
        ├── LEFT  flexBasis 33%
        │   ├── components/LedgerHeader        (navy #1e2a4a bar)
        │   ├── inline severity pill row + components/filters/TextFilter
        │   ├── inline column header row       (components/SortHeader ×3)
        │   └── components/LedgerRow × N       (memoized)
        └── RIGHT flexBasis 52%, flex-1
            └── components/StoreDetailPopup    (memoized) | components/EmptyPrompt
                ├── severity-tinted title bar
                ├── 3-up KPI strip (TY / vs LW / vs LY)
                ├── PopupDaySidebar   (day strip)
                ├── tab bar (Sub dept | Hourly)
                └── PopupSubDeptList | PopupHourlyView
```

**Dead code in `components/`:** `LedgerHeroBar.tsx`, `LedgerFilterChips.tsx`, `LedgerSearchBar.tsx` are not imported anywhere. `LedgerHeroBar` in particular is an earlier full-width hero that was replaced by the compact `LedgerHeader`. Don't copy them into v2 — but `LedgerHeroBar`'s 4-up KPI block is a useful visual reference and is closer to what a tracker header wants.

### 1.2 Data flow

`SalesLedger.fetchLedger()` (line 126) issues **six** calls in parallel — `getWeekly` and `getHourly` for each of three windows:

| Window | Range | Built by |
|---|---|---|
| TW | `singleDate - 6` … `singleDate` | `getDateRanges()` |
| LW | `singleDate - 13` … `singleDate - 7` | `getDateRanges()` |
| LY | every TW day mapped through `sameWeekDayLastYear`, then min/max | `getDateRanges()` |

The LY range is deliberately built per-day rather than by shifting the two endpoints — the comment at lines 109-113 explains why: a fixed-date holiday (July 4th) snaps one endpoint to the exact date while the other gets a weekday-preserving shift, desyncing the range from the per-day lookups in `buildLedgerRows`.

**Group fan-out:** if `search.type === "Group"` and the group resolves to **>30 stores**, it drops to per-store calls via `Promise.allSettled` and `concat*` reducers so rows appear progressively instead of waiting on one huge response (lines 143-235).

Raw data lands in `salesSlice`; **all** UI state lands in `salesLedgerSlice`.

### 1.3 Row building — `shared/ledgerUtils.ts`

`buildLedgerRows(tw, lw, ly, assignedStores, threshold, gradingMetric)`:

1. **Keys on `storeid + store_number`, not `storeid`.** Some storeids carry two store_numbers — genuinely separate locations sharing an id (e.g. 685 returns "369" and "370"). Keying on id alone merged them, doubled every date in the day strip, and double-counted the LW/LY baseline.
2. For each TW day, finds the LW day (`-7`) and LY day (`sameWeekDayLastYear`). **`lwNet`/`lyNet` are `null`, not `0`, when no row exists** — a real distinction from a genuine $0 day.
3. Uses `net_sales` off the row, *not* `total_sales - total_tax` — the backend figure reconciles to the register report because it nets coupons as well as tax.
4. `computeDayMatchedTotals` then scopes **the TY side of each comparison to only the days that have a counterpart on that side**. This is the single most important correctness idea on the page: without it, a week with two real declines can show a positive "vs LW".
5. Grades via `ledgerSeverity` → `gradeSeverity`, sorts critical → watch → healthy, then by pct ascending.

**Perf split.** `baseLedgerRows` (the expensive regroup) is memoized on data alone; `regradeLedgerRows` is a cheap re-grade on threshold. `regradeLedgerRows` **preserves object identity for rows whose severity didn't change**, so `memo(LedgerRow)` skips ~all rows during a threshold drag. `handleRowClick` / `handlePopupClose` are `useCallback`'d for the same reason. This is a hard-won pattern — v2 should inherit it verbatim.

### 1.4 Grading — `src/utils/severity.ts` (app-wide)

```ts
const PCT_EPSILON = 1e-6;
gradeSeverity = (pct, threshold) =>
  pct < -threshold - PCT_EPSILON ? "critical"
  : pct < -PCT_EPSILON          ? "watch"
  : "healthy";
```

Three bands, one function, everywhere. The epsilon (not rounding) is deliberate — rounding to 1dp moved the boundary by up to 0.05 points and made a -9.03% department grade "watch" while its own printed number said critical.

Exports v2 should use directly: `pillClass(pct|null, threshold)`, `severityDotClass`, `severityHeaderBgClass`, `chipClass(active, sev?)`, `CTA_SEVERITY_CLASSES`, `formatPct`, `PCT_COL_W` (72), `BADGE_BG`, `BADGE_COLOR`.

`pillClass(null, …)` → grey — the canonical "no comparison" rendering.

Threshold defaults to `9`, held in `salesLedgerSlice.threshold` as `{op, amount}`, with independent per-scope thresholds (`subDeptThreshold`, `hourlyThreshold`, `itemThreshold`, `categoryThreshold`) all defaulting to 9.

### 1.5 Theme / layout language

Everything resolves through CSS variables in `src/index.css` (`:root`, single theme) exposed as Tailwind tokens in `tailwind.config.js`.

| Token | Value | Used for |
|---|---|---|
| `bg-custom-white` | `244 247 248` | every card surface |
| `bg-bkg` | `228 233 239` | page ground, inset panels |
| `text-content` | `30 41 59` | all text; opacity variants `/60 /70 /80 /85` for labels |
| `bg-row_selected` + `border-row_selected_border` | `239 241 242` / `138 155 176` | selected list row |
| `severity_{critical,watch,healthy}_{bg,text}` | see index.css 224-229 | pills, chips |
| `delta_{positive,negative}_{bg,text}` | 230-233 | deltas outside the severity system |

**Hard-coded navy `#1e2a4a`** is the page's signature chrome — `LedgerHeader` background, active tab underline, `LedgerRow` bottom border at `/15`, `chipClass` active-no-severity. It is *not* a token yet. v2 should either use it identically or promote it to `--color-brand-navy`-style token first.

Layout constants worth copying:

- Page shell: `w-full p-4 select-none min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden`
- Content row: `flex gap-4 h-[calc(100vh-5rem)]`
- Cards: `rounded-xl` outer, `rounded-t-xl` on the navy header, `rounded-b-xl` on the list body, `shadow-lg` on the two columns, `shadow-sm` inside
- Borders: `border-gray-100`
- Scroll: `flex-1 overflow-y-auto thin-scrollbar` (the legacy page uses `no-scrollbar` instead)
- Type scale: `10px` uppercase labels · `11.5px` column headers · `12px` secondary · `13px` primary/row · `14px` KPI values
- Icons: `@heroicons/react/20/solid`, `w-3.5 h-3.5` in chrome, `w-4 h-4` in title bars

### 1.6 Interaction model

- **Entry gate.** No `hasSearched` → `LedgerEntryCard` only. Search re-opens as a modal over `bg-black/40` rather than occupying permanent space.
- **Filter chain** (line 353-374): severity pills → text filter → tri-state sort (`useTriStateSort`, `SortHeader`, chevron only on the active column).
- **Selection** is Redux (`setLedgerSelection`), keyed on `storeId + storeNumber` so co-located stores don't both highlight.
- **Threshold** has two controls writing one value: `ThresholdSlider` (explore) and `ThresholdFilter` (commit). Both `variant="dark"`. Clearing the input dispatches `null`; `lastValidThresholdRef` keeps grading on the last valid number so rows don't reshuffle out from under the user — and `LedgerHeader` mirrors the same ref so the slider can't display a value nothing is graded against.
- **Info.** `InfoButton` → `InfoPopover` fed by `SALES_LEDGER_INFO` in `salesInfo.ts` (title + purpose + glossary).
- **Metric toggle.** `sales | qty` flips every number and every grade on the page.

---

## PART 2 — Legacy Sales Tracker

### 2.1 Component tree

```
SalesLegacy.tsx  (dashboardOption === "tracker")
├── LEFT rail  grid-cols-[17%_83%]
│   ├── SingleSelect "Views"  (Daily / Weekly / Sales Tracker)
│   ├── StorePicker
│   ├── DatePickers showBtn={false}   ← range, not single date
│   ├── Search button
│   └── tracker/WeekCards             ← TY/LY week summary cards
└── RIGHT  tracker/SalesTracker.tsx
    ├── tracker/SalesTrackerKpis      (7-up KPI grid)
    └── tracker/TotalsGrid            grid-cols-[54.5%_45%]
        ├── LEFT  sub-dept table → tracker/TotalsGridLvlOne (row)
        └── RIGHT drill-down (only when a sub dept is picked)
             └── TotalsGridLvlOne isLvlTwo
                 └── tracker/TotalsGridLvlTwo   (one card per week)
                     ├── 5-metric mini panel
                     ├── tracker/CardLine       (nivo line, TY vs LY)
                     └── tracker/TotalsGridLvlThree × 7  (day tiles, grid-cols-4)
```

Tablet: `SalesTrackerTablet` + `SalesTrackerKpisTablet`. Mobile: `mobile/salesTracker/*` (separate, `salesMobileSlice`).

### 2.2 Data flow — `SalesLegacy.getSubsTracker()` (line 136)

Two independent paginated fan-outs against `subs/sub_sales`:

- **TY:** `search.startDate` … `search.endDate`
- **LY:** both endpoints through `sameWeekDayLastYear`

Page 1 fetched first; if `total_pages > 1`, pages 2..N fire **in parallel**, each `concat`ing into `thisYrSubTracker` / `lastYrSubTracker`. A local `pages[]` array tracks `fetched` flags and clears the loading flag when all are in.

> **Known weakness.** Two loading flags (`loadingTYTrackerData`, `loadingLYTrackerData`) exist but the render only checks the component-local `isLoading`, and each fan-out clears it independently — so the page can un-blank while the other year is still arriving. There is no error path that clears loading either. v2 should replace this with a single `Promise.allSettled` and one loading flag.

### 2.3 The transform pipeline — the real asset here

Four stages, each in a `useEffect` in a *different* component. This is the part worth preserving and the part worth restructuring.

```
thisYrSubTracker / lastYrSubTracker      (raw SubSale[], both years)
        │  WeekCards.useEffect
        │  · unique dates → chunkData(7) → "start - end" range strings
        │  · per range: filter sales in range, reduce by storeid
        │    (total_sales := total_sales - total_tax), unshift
        ▼
tyWeekCards / lyWeekCards                (SubSale[] — one per week per store)
tyCollapsedSubSales / lyCollapsedSubSales (SubSale[][] — per-week buckets)
        │  SalesTracker.useEffect
        │  · uniqueSubs from sub_department / _description
        │  · per (sale_date, storeid, subDept): salesTY += total_sales,
        │    salesLY from sameWeekDayLastYear match (total_sales - total_tax)
        │  · derive dollarChange, percentChange, atsTotalSales
        │  · group by subDept, sort by date, chunkData(7)
        ▼
tyReducedTotals: WeekTotal[][][]         (sub dept → week → day)
        │  SalesTrackerKpis.useEffect  → trackerKpis
        │  TotalsGrid / LvlOne / LvlTwo → calcTotals() re-derived at each level
        ▼
rendered
```

`WeekTotal` (`salesSlice.ts:23`):

```ts
{ sale_date, storeid, storeName, subDept, subDesc,
  salesTY, salesLY, totalSalesDollarChange, totalSalesPercentChange,
  atsTotalSales, transaction_count }
```

`chunkData` = fixed slices of 7 from index 0. Not calendar-week aligned — an 11-day range yields a 7-day "Week 1" and a 4-day "Week 2".

`TotalsGrid` back-fills **missing calendar days as zero-value `WeekTotal`s** (lines 130-165) so the 7-tile day grid never has holes. Note this is the opposite convention from the ledger's `null`-means-no-data.

### 2.4 Calculations

`calcTotals` is **implemented three times** — `TotalsGrid:17`, `TotalsGridLvlOne:35`, and inline in `SalesTrackerKpis` — with drift between copies (`TotalsGrid` guards ATS with `!isNaN`, `LvlOne` with `totalTrans === 0`). Same shape each time:

```
tyTotalSales  = Σ salesTY
lyTotalSales  = Σ salesLY
dollarChange  = ty - ly
percentChange = ly === 0 ? 0 : (dollarChange / ly) * 100
atsTotalSales = ty / Σ transaction_count     // Average Transaction Size
```

Net sales here is `total_sales - total_tax` — **not** the ledger's `net_sales` (which also nets coupons). The two pages will not tie out against each other today.

### 2.5 Colour and layout language

**Two-band, not three.** `tracker/index.ts`:

```ts
changeTextColor = (a, b) => a > b ? "text-emerald-600" : a < b ? "text-red-600" : "text-content";
```

Every delta on the tracker is green/red on sign alone. No threshold, no Watch band, no severity dots, no pills — text colour only. This is the single biggest visual gap from the Sales page.

Other divergences:

- **Selection = `bg-orange-200`** (`TotalsGridLvlOne:79`) with `shadow-inner`; hover is `bg-blue-200/50`. Sales uses `bg-row_selected` + `border-row_selected_border`.
- **Hover tooltip** is a hand-rolled `isHovering` state + absolutely-positioned `bg-orange-200` chip on the "ATS Sales" header, not `InfoPopover`.
- **KPI cards**: `grid-cols-7`, `bg-custom-white rounded-lg shadow-lg`, thumbs-up/down icons from `@heroicons/react/24/outline` at `w-4 h-4`.
- **Radii** are `rounded-lg` throughout; Sales uses `rounded-xl` on outer cards.
- **Type** runs smaller — `10px` day tiles, `11px` rows, `12px` cards/KPIs.
- **Scroll** is `no-scrollbar` (hidden) vs the ledger's `thin-scrollbar`.
- **Gradient hairline dividers** (`bg-gradient-to-r from-content/15 to-custom-white` ×2) — a nice touch with no equivalent on the Sales page.
- **`CardLine`** — `@nivo/line`, TY `#10b981` / LY `#3b82f6`, tooltip `bg-[rgb(30,45,80)]` (≈ the `#1e2a4a` navy). The only chart in either tracker.
- Heights are hard-coded per nesting level: `max-h-[calc(100vh-180px)]`, `-152px`, `-376px`.

### 2.6 What the legacy tracker does that the ledger does not

1. **Arbitrary date range** with automatic weekly chunking, vs a fixed 7-day week.
2. **Sub department as the primary axis.** The ledger's primary axis is the store; sub dept is a tab inside the detail panel.
3. **Three-level drill**: sub dept → week card → day tile, all visible at once in the right column.
4. **ATS (Average Transaction Size)** as a first-class metric at every level. The ledger has no ATS on the store list at all.
5. **TY vs LY line chart** per week.
6. **Multi-week comparison in one view** — the ledger is strictly one week.
7. **Weight** as a metric (`WeekCards` only).

---

## PART 3 — Gap analysis

| Concern | Sales (current) | Legacy Tracker | v2 should take |
|---|---|---|---|
| Grading | 3 bands + threshold, `gradeSeverity` | 2 bands on sign | **Sales** |
| Delta rendering | `pillClass` pills | coloured text | **Sales** |
| Selection | `bg-row_selected` | `bg-orange-200` | **Sales** |
| Radii / shadows | `rounded-xl` / `shadow-lg` + `shadow-sm` | `rounded-lg` / `shadow-lg` | **Sales** |
| Header chrome | navy `#1e2a4a` compact bar | plain white KPI grid | **Sales** shell, **Tracker** metrics |
| Info affordance | `InfoButton` + `InfoPopover` | hover chip | **Sales** |
| Scrollbars | `thin-scrollbar` | `no-scrollbar` | **Sales** |
| Threshold control | slider + numeric, dark variant | none | **Sales** |
| Sort | `useTriStateSort` + `SortHeader` | none | **Sales** |
| Text filter | `TextFilter` | none | **Sales** |
| Empty/entry state | `SearchCard` / `EmptyPrompt` | `NoPanelsFound` | **Sales** |
| Primary axis | store | sub dept | **Tracker** |
| Date input | single week-ending | start + end range | **Tracker** |
| Drill depth | store → day → subdept → hour → item | subdept → week → day | **Tracker** |
| ATS | absent | every level | **Tracker** |
| Chart | none (grids only) | `CardLine` nivo | **Tracker** |
| Net sales basis | `net_sales` | `total_sales - total_tax` | **decide — see below** |
| Missing days | `null` = no data | back-filled zeros | **Sales** (`null`) |
| Perf | memo + identity-preserving regrade | none | **Sales** |
| Loading | one flag, `Promise.all` | two flags, races | **Sales** |
| State | data slice + UI slice split | one slice | **Sales** |

### The one decision that isn't a style call

**`net_sales` vs `total_sales - total_tax`.** The ledger deliberately uses the backend's `net_sales` because it reconciles to the register report — it has coupons out as well as tax. The tracker subtracts tax only. If v2 sits next to the Sales page under the same nav, the two will show different dollars for the same store and week, and someone will file that as a bug. Recommendation: **move v2 to `net_sales`** and note it in the info popover. This does need your confirmation, because it will change every historical number the tracker shows.

---

## PART 4 — Proposed hybrid: Sales Tracker v2

### 4.1 Shape

Mirror the ledger's two-column split, with sub dept where store was:

```
Sales Tracker v2                       p-4, max-h-[calc(100vh-3rem)]
├── (no search) → TrackerEntryCard  (SearchCard, range mode)
└── flex gap-4 h-[calc(100vh-5rem)]
    ├── LEFT  flexBasis 40%
    │   ├── TrackerHeader                 ← navy #1e2a4a, LedgerHeader clone
    │   │   ├── row 1: range label · total · LY pill (pillClass)
    │   │   └── row 2: search · sales|qty|ats toggle · threshold · InfoButton
    │   ├── severity pill row (Crit/Watch/OK counts) + TextFilter
    │   ├── SortHeader row: Sub Dept | TY | ATS | vs LY
    │   └── TrackerSubDeptRow × N   (memo — LedgerRow shape)
    └── RIGHT flex-1
        └── TrackerDetailPanel | EmptyPrompt
            ├── severity-tinted title bar (severityHeaderBgClass)
            ├── 4-up KPI strip: TY · LY · $ vs LY · ATS
            ├── week chip strip (PopupDaySidebar analogue)
            └── week cards: mini-panel + CardLine + 7 day tiles
```

The left rail from `SalesLegacy` (Views select / StorePicker / DatePickers / Search) collapses into the `SearchCard` entry gate + header search modal, exactly as the ledger did.

### 4.2 Concrete changes from legacy

- **Grade sub-dept rows** with `gradeSeverity(vsLYPct, threshold)`; dot + `pillClass` deltas; sort critical → watch → healthy like `sortLedgerRows`.
- **Replace `changeTextColor`** everywhere with `pillClass` / `severityDotClass`. Retire it from `tracker/index.ts`.
- **Single `calcTotals`** in `shared/trackerUtils.ts`, imported by every level.
- **Split the pipeline out of render.** Move the four `useEffect` transforms into pure functions in `shared/trackerUtils.ts` (`buildWeekTotals`, `chunkWeeks`, `calcTotals`, `buildTrackerKpis`) called from `useMemo` in the page — same split as `buildLedgerRows` / `regradeLedgerRows`, so the threshold can drive a slider without redoing aggregation.
- **New `salesTrackerSlice`** for UI state (selection, threshold, metric, sort, hasSearched, loading) alongside the existing raw-data slice — mirroring the `salesSlice` / `salesLedgerSlice` split. Do **not** extend `salesLegacySlice`.
- **One loading flag**, `Promise.allSettled` across both years and all pages.
- **`null` for missing days**, then `computeDayMatchedTotals`-style scoping, instead of zero back-fill.
- **`memo` the row and the detail panel**; preserve object identity on unchanged rows during re-grade.
- **Add `SALES_TRACKER_INFO`** to `salesInfo.ts`; drop the hand-rolled ATS hover chip.
- **Keep**: `CardLine` as-is (colours already match the theme), the gradient hairline dividers, `chunkData`, `WeekTotal`, the ATS metric, the day-tile grid.

### 4.3 Open questions for you

1. **`net_sales` vs `total_sales - total_tax`** — see above. Changes every number.
2. **Metric toggle** — ledger has `sales | qty`. Should v2 be `sales | qty | ats`, or keep ATS as a permanent column?
3. **Store dimension** — legacy reduces across stores by sub dept. Do you want a store breakdown inside the detail panel, or stay purely sub-dept?
4. **`chunkData` alignment** — keep fixed 7-from-start chunking, or align weeks to a calendar boundary?
5. **Where does v2 live** — replace `tracker/` in place behind `devMode`, or a new `salesTracker/` folder that both pages can point at?
6. **Tablet/mobile** — port now, or desktop first?

---

## Appendix — file inventory

**Sales (current)** — `src/pages/sales/`

| File | LOC | Note |
|---|---|---|
| `Sales.tsx` | 388 | device shim; ~250 lines commented-out legacy |
| `SalesLedger.tsx` | 582 | desktop page |
| `shared/ledgerUtils.ts` | 553 | row builder, day-matching, gap report, aggregators |
| `components/StoreDetailPopup.tsx` | 750 | right panel |
| `components/PopupSubDeptList.tsx` | 1406 | sub dept tab |
| `components/PopupHourlyView.tsx` | 868 | hourly tab |
| `components/LedgerRow.tsx` | 195 | memoized row |
| `components/LedgerHeader.tsx` | 172 | navy header |
| `components/SalesExportModal.tsx` | 900 | CSV export |
| `components/LedgerHeroBar.tsx` | 109 | **unused** |
| `components/LedgerFilterChips.tsx` | 78 | **unused** |
| `components/LedgerSearchBar.tsx` | 29 | **unused** |
| `salesInfo.ts` | 15 | `SALES_LEDGER_INFO` |

**Legacy Tracker** — `src/pages/sales/tracker/`

| File | LOC | Note |
|---|---|---|
| `SalesTracker.tsx` | 135 | container + `WeekTotal` build |
| `SalesTrackerKpis.tsx` | 156 | 7-up KPI grid |
| `TotalsGrid.tsx` | 186 | two-column grid + zero back-fill |
| `TotalsGridLvlOne.tsx` | 133 | sub-dept row / week list |
| `TotalsGridLvlTwo.tsx` | 91 | week card |
| `TotalsGridLvlThree.tsx` | 57 | day tile |
| `WeekCards.tsx` | 239 | left-rail cards + stage-1 transform |
| `CardLine.tsx` | 122 | nivo TY/LY line |
| `index.ts` | 18 | `chunkData`, `changeTextColor`, `formatDate` |
| `SalesTrackerTablet.tsx` | 157 | tablet |
| `SalesTrackerKpisTablet.tsx` | 137 | tablet KPIs |

**Shared** — `src/utils/severity.ts` · `src/components/SortHeader.tsx` · `src/utils/useTriStateSort.ts` · `src/components/filters/{ThresholdSlider,ThresholdFilter,TextFilter}.tsx` · `src/components/{SearchCard,EmptyPrompt,InfoButton,InfoPopover}.tsx` · `tailwind.config.js` · `src/index.css`
