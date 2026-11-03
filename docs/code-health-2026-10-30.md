# Code health — prod + dev trees

Measured 30 Oct 2026 against `src/`, excluding `src/legacy/` and `trash/`.
Nothing in this document has been changed; it is a survey and a running order.

**1,164 files · 258,351 lines · mean 221 lines.** 25 files over 1,000 lines.

Work the **dev tree only**. `npm run promote:page -- <page>` carries a signed-off
dev tree over its prod twin, so a fix made in dev reaches prod on promotion. A
fix made in both by hand is the same fix twice and risks the two drifting.

## What the split is, and why none of this touches it

The dev/prod duplication is the design, not debt. `split:page` creates the dev
tree, `promote:page` writes it back over prod, and `check:split` proves the two
are a mirror apart from the expected swaps. Measured here:

- 226 dev/prod page pairs; 46 byte-identical, 96 differing **only** in import
  lines, 25 genuinely forked past 50%.
- 56 of 102 `components-dev/` files have a `components/` twin; 30 identical.
- 29 `features/dev/devXSlice.ts` ↔ `features/xSlice.ts` pairs.
- **Zero runtime imports crossing from the dev tree into prod UI.** The only
  crossings are the 27 page switchers (`pages/X/X.tsx` → `pages/X/dev/X.tsx`),
  which are the `apiEnv` switch. Isolation is clean.

So "consolidate dev and prod" is not on this list. Collapsing those twins would
fight the tooling and break `check:split`'s ISOLATION rule.

Once twins are collapsed, real duplication is **251 clone groups, ~8,042 lines —
about 3% of the tree**. Duplication is not this codebase's problem. **File size
and test coverage are.**

Of the 22 files over 700 lines, **not one has a sibling test.** 105 test files
against 1,164 sources.

---

## 1. Tests on the calculation files, before touching them

**Why first:** steps 2 and 3 move code that nothing currently proves. These two
files are pure calculation with no DOM, so they are the cheapest in the codebase
to characterise and the most expensive to get wrong.

| File | Lines | Why it needs cover first |
|---|---|---|
| `pages/itemReport/dev/itemReportMetrics.ts` | 1,839 | 20 exports, no component code. `verdictFor` alone is **741 lines** (1084–1825). Feeds every Item Report verdict. |
| `pages/sales/dev/shared/deptInvestigation.ts` | 1,002 | Has `deptInvestigation.test.ts` (958 lines) — **already covered**, use it as the model for the above. |

Target the seams, not the lines: `buildReport`, `buildPriceEras`,
`comparableEras`, `mergePricePoints`, `verdictFor`, `buildRollup`, `deliveryGap`,
`flatDaysBefore`.

---

## 2. Split `itemReportMetrics.ts`

**Why:** 1,839 lines, and 40% of it is one function. Nothing else in the tree is
this concentrated.

| Affected | What moves |
|---|---|
| `pages/itemReport/dev/itemReportMetrics.ts` | becomes a folder |
| → `types.ts` | `DayPoint`, `PeriodTotals`, `StockMovement`, `SinceDelivery`, `ReportItem`, `PriceEra`, `Verdict`, `MergedPrice` (8 interfaces) |
| → `report.ts` | `buildReport`, `buildRollup` |
| → `prices.ts` | `buildPriceEras`, `comparableEras`, `mergePricePoints` |
| → `verdict.ts` | `verdictFor` (741 lines), `ACTION_LABEL`, `ACTION_RANK` |
| → `delivery.ts` | `daysSince`, `deliveryGap`, `flatDaysBefore` |
| Importers | `pages/itemReport/dev/ItemReport.tsx`, `ItemReportRail.tsx` (918), `ItemReportSheet.tsx`, `ItemReportExportModal.tsx`, `itemReportData.ts`, `verdictRules.test.ts` |

Keep the current path as a barrel re-export so importers do not move in the same
commit.

`verdictFor` wants a second pass of its own afterwards — 741 lines in one
function is the real finding; the file split only makes it visible.

---

## 3. Split `DeptInvestigation.tsx`

**Why:** 3,490 lines — the largest file in the tree — holding **14 components**,
44 top-level declarations and 25 hooks. Every change to any of the fourteen
touches one file.

| Component | Lines | Goes to |
|---|---|---|
| `SupplyPanel` | 1683–2254 (571) | `deptInvestigation/SupplyPanel.tsx` |
| `HoldsPanel` | 1080–1438 (358) | `deptInvestigation/HoldsPanel.tsx` |
| `Document` | 1553–1683 (130) | `deptInvestigation/Document.tsx` |
| `ActPanel` | 2254–2378 (124) | `deptInvestigation/ActPanel.tsx` |
| `Carousel` | 162–279 (117) | `deptInvestigation/Carousel.tsx` |
| `Timeline` | 1438–1546 (108) | `deptInvestigation/Timeline.tsx` |
| `Index`, `Weeks` | 971–1080 | `deptInvestigation/Index.tsx` |
| `SkCard`, `TabSkeleton`, `LoadNote`, `Waves`, `Bar` | 279–471 | `deptInvestigation/skeletons.tsx` |
| `Col`, `Fmt`, `FilterKind`, `ColumnDef`, `CSV_HEADERS`, `PAGE_ROWS`, `NAME_W` | — | `deptInvestigation/columns.ts` |
| `DeptInvestigation` (root) | 2388–3490 (1102) | stays |

Moves only — no logic changes, so `tsc -b` is the proof. The root is still 1,100
lines afterwards and can be looked at separately.

Prod twin `pages/sales/prod/components/DeptInvestigation.tsx` is left alone and
picks this up at promotion.

---

## 4. Split `interfaces/index.ts`

**Why:** 190 exported types in one file, imported by **460 files**. Every type
change invalidates a large rebuild graph, and nothing says which types belong to
which feature. `interfaces/tickets.ts` already shows the shape working.

Rough domain spread of the 190: Cashier 15, Upc 10, Sub 9, User 8, Store 8,
Receiver 8, Forecast 8, Vendor 6, Price 6, Company 4, Category 4, Base 4,
Order 3, Sales 2, Item 2, Invoice 2, Group 2, Coupon 2, remainder mixed.

| Affected | What |
|---|---|
| `src/interfaces/index.ts` | split into `cashiers.ts`, `upc.ts`, `subDepts.ts`, `users.ts`, `stores.ts`, `receivers.ts`, `forecast.ts`, `vendors.ts`, `pricing.ts`, `orders.ts`, … |
| `src/interfaces/index.ts` (kept) | barrel re-exporting all of them, so the 460 importers do not change |

Reversible and mechanical. Do it after 2 and 3 so those files move once, not twice.

---

## 5. Collapse the real cross-page clones

**Why:** these are the duplications the split does not explain — the same code in
two different pages, where a fix to one silently misses the other. Counts below
are **distinct places** with dev/prod twins already collapsed.

| Shared block | Places | Files affected |
|---|---|---|
| ~298 lines | 2 | `components/ItemMarginsTable.tsx` (877) and `subDepts/display/perf/MarginPerfItemsTable.tsx` (1,057). A shared component and a page-local table a third identical. |
| ~205 lines | 2 | `categories/CategoryExportModal.tsx` (1,035) and `vendors/VendorExportModal.tsx` (1,188) |
| ~144 lines | 2 | `features/forecastSlice.ts` (900) and `features/forecastDevSlice.ts` — two slices in the **same** tree, then both copied into dev: 4 files, one block |
| ~139 lines | 2 | `sales/components/PopupHourlyView.tsx` (918) and `PopupSubDeptList.tsx` (1,583) |
| ~80 lines | 2 | `components/transactions/Transaction.tsx` and `pages/cashiers/transactions/Transaction.tsx` — a shared component **and** a page-local copy of it |
| ~62 lines | 3 | `coupons/CouponDetailPanel.tsx`, `lossPrevention/desktop/LPTransactionPanel.tsx`, `orders/components/OrderReportPanel.tsx` — three unrelated pages, one detail-panel skeleton |

The `forecastSlice` / `forecastDevSlice` pair is the odd one and worth deciding
first: two slices with the same name stem in one tree is either a fork nobody
finished or a split nobody documented.

---

## 6. Export modal configuration

**Why:** 24 distinct export modals, ~12,000 de-twinned lines. The *shell* is
already shared — 38 of 43 files use `ResizableModalShell` — so this is about the
config above it, not the chrome.

| Symbol | Distinct places | Variants | Note |
|---|---|---|---|
| `AGG_OPTIONS` | 9 | **3** | 6 of the 9 are byte-identical. A change to the aggregation list today means finding six copies and matching three variants. |
| `DIMS` | ~5 | — | dimension descriptors per page |
| `METRICS` | ~5 | — | metric descriptors per page |

Identical `AGG_OPTIONS` lives in: `cashiers/explorer/CashiersExportModal.tsx`,
`categories/CategoryExportModal.tsx`, `receivers/ReceiversExportModal.tsx`,
`sales/components/SalesExportModal.tsx`, `suggested/SuggestedExportModal.tsx`,
`vendors/VendorExportModal.tsx`. The other two variants are
`orders/components/ordersExportShared.ts` and the pair
`lossPrevention/desktop/LPExportModal.tsx` + `subDepts/display/perf/MarginPerfExportModal.tsx`.

Lifting the identical one is an afternoon. The descriptor shape is a larger
design question — whether an export modal becomes config plus shell — and should
wait until after the file splits.

---

## 7. Opportunistic: scattered helpers

**Why:** low individual value, but `npm run audit:theme` already flags this class
as `local-shared-helper`. Fold them in when a file is open for another reason,
not as a project.

| Helper | Distinct declarations | Shared version |
|---|---|---|
| `fmtDate` | **19** (most common body repeated 10 times identically) | `src/utils/dateLabels.ts` |
| `formatDate` | 4 | `src/utils/index.ts` |
| `formatPct` | 2 | `src/utils/severity.ts` |

---

## 8. Six orphan files

**Why:** nothing imports them. Some may be deliberately parked — check before
removing.

| File | Lines |
|---|---|
| `features/ticketsMockData.ts` | 215 |
| `pages/home/SecurityQuestion.tsx` | 131 |
| `pages/home/ResetPassword.tsx` | 96 |
| `api/helpPages.ts` | 69 |
| `pages/home/portal/support/SupportPanel.tsx` | 62 |
| `hooks/useLegacyApi.ts` | 15 |

588 lines. `check:split`'s DEAD rule covers `pages/<page>` and `components-dev`
only, which is why these sit outside it.

---

## Reference: where the weight is

| Page | Lines | | File | Lines |
|---|---|---|---|---|
| sales | 33,265 | | `sales/dev/components/DeptInvestigation.tsx` | 3,490 |
| organization | 12,840 | | `interfaces/index.ts` | 2,877 |
| subDepts | 11,328 | | `itemReport/dev/itemReportMetrics.ts` | 1,839 |
| orders | 10,698 | | `sales/dev/components/PopupTopItems.tsx` | 1,668 |
| upc | 9,853 | | `sales/dev/components/PopupSubDeptList.tsx` | 1,583 |
| shared | 8,630 | | `exportBuilder/dev/ConfigPanel.tsx` | 1,457 |
| coupons | 7,688 | | `shared/itemPerf/dev/ItemPerfMobile.tsx` | 1,442 |
| exportBuilder | 7,446 | | `coupons/dev/CouponDetailPanel.tsx` | 1,232 |

Sales is 3.5× the next heaviest page. `PopupSubDeptList.tsx` (1,583) and
`ItemPerfMobile.tsx` (1,442) are each a **single component function** — the
opposite problem to `DeptInvestigation`, and a harder one.

Of the 96 import-only dev/prod pairs, **35 are in `upc`** (dev 5,850 lines, prod
4,436) — that page is the furthest along the mirror and the cleanest candidate
for the next `promote:page`.
