# Dev → production: what is actually waiting

Audited 2026-10-16 against `master_publish`. Coming Soon pages are **out of
scope** — nothing in the Coming Soon category is going to production in this
move. This covers only the pages clients already have, where the dev tree has
drifted ahead of the prod tree.

Method: `node scripts/check-split.mjs <page>` section 1 (MIRROR) for every page
with a real prod tree, which is the authoritative list because it normalizes the
legitimate dev/prod swaps (`state.dev`, `components-dev/`, the forked slice
spellings, the tree's own name in comments). The two `shared/` units and the
component libraries are not pages, so those were diffed by hand with the same
normalization.

---

## The two patterns that run through nearly everything

**1. The help swap.** Every prod page still carries its own `<page>Info.ts`
constant plus the old `InfoButton` + `InfoPopover` state, and the dev tree has
replaced all of it with one line:

```
-  <InfoButton onClick={() => setInfoOpen((p) => !p)} />
-  {infoOpen && <InfoPopover title={…} purpose={…} glossary={…} … />}
+  <PageInfoButton page="forecasting" />
```

On mobile the same change is `info={RECEIVERS_INFO}` → `helpPage="receivers"`.
This is the single most widespread delta — **13 pages** use `PageInfoButton` in
dev: admin, categories, couponSales, coupons, forecast, lookup, lossPrevention,
organization, receivers, sales, subDepts, upc, vendors. It accounts for the
recurring ~15-line diff on each list panel and the deletion of each
`<page>Info.ts`.

**2. A mobile contrast bump.** `text-content/85` → `text-content/95` on the
mobile files he touched. Pure Tailwind, no logic. It is what inflates the
coupons and receivers mobile diffs past the help swap.

Neither pattern changes a request, a number, or a layout.

---

## What the help swap depends on

`PageInfoButton` → `InfoModal` → `useHelpPageUrl`, and that hook is currently on
the **public S3 bucket**, not the API — `VITE_HELP_PAGES_URL_PROD` is already
set in `.env.production`. So promoting help does **not** wait on the backend.

What it does wait on: the `prod/` folder in that bucket has to hold the built
HTML for every name in `src/constants/helpPages.ts` (17 pages, 12 with a
`-mobile` twin). A missing key answers **403, not 404**, and a sandboxed
cross-origin iframe can't read the status — so a page that isn't uploaded shows
S3's error XML inside the modal and the app never hears about it. There is no
graceful degradation here. **Verify the uploads before promoting any page that
uses `PageInfoButton`.**

---

## Component library

`src/components-dev/` holds 10 components that `src/components/` does not. Only
these matter for the non-Coming-Soon promote:

| Component | Needed by |
|---|---|
| `PageInfoButton`, `InfoModal` | 13 pages (above) — the help swap |
| `Checkbox` | admin, organization |
| `AssignPanel` | organization |
| `mobile/perf/PerfChange`, `mobile/perf/PerfDelta` | sales, shared perf |

(`ComingSoonHelp`, `ConfirmDelete`, `inputs/TextField`, `charts/TrendLine` are
used only by Coming Soon pages — leave them.)

21 components exist in both libraries but differ. The substantial ones are
`filters/MultiSelectFilter` (+118/−32), `filters/SelectFilter` (+108/−25),
`mobile/perf/perfColors` (+85/−13), `mobile/MobilePerfHeader` (+16/−36),
`SearchCard` (+15), `SingleStoreSearchCard` (+13). **These are shared**, so
promoting one page's panel can drag a filter change onto every page that uses
it. Promote library components deliberately, not as a side effect.

---

## Per page

Ordered by how much is actually moving. Line counts are changed lines
(added + removed) after normalization.

### Help swap and styling only — safe, and safe in any order

| Page | Files | Size | Notes |
|---|---|---|---|
| **forecast** | `ForecastListPanel` | 15 | delete `forecastInfo.ts` |
| **categories** | `CategoryListPanel`, `Categories.tsx` | 19 | delete `categoriesInfo.ts` |
| **lossPrevention** | `LPStorePanel`, `LossPrevention.tsx` | 18 | delete `lpInfo.ts` |
| **receivers** | `ReceiverListPanel`, `mobile/RcvReceiverList` | 44 | delete `receiversInfo.ts`; rest is the /85→/95 bump |
| **coupons** | `CouponListPanel` + 5 mobile files | 104 | delete `couponsInfo.ts`; rest is the bump |

### Real changes, page-local

| Page | What moves |
|---|---|
| **couponSales** | Help swap, plus a genuine mobile fix: the week's coupon lines moved from a `useRef` to module scope. The ref died with the component, so coming back to the page repainted the list from the slice while the receipt resolved against an empty array — every sale said "No lines came back" over a row showing its amount. 44 lines. |
| **upc** | Help swap (`UpcLeftPanel`, and `moduleInfo.ts` + `ModuleInfoPopover.tsx` get deleted), plus `useUpcDevCtx.ts` — **promoting flips `fixes` from `false` to `true`**, which turns the UPC List fixes on for clients. That is a product decision, not a merge. |
| **cashiers** | Help swap, plus `explorer/lensUtils.ts` gains `lensListLabel` (Back reads "back to stores", not "back to signals") and `transactionLabel` (shows the receipt number out of the compound `sale_id` instead of the whole string). Mobile signal list and transactions rebuilt, 332 + 176 lines. |
| **vendors** | Help swap plus `VendorDetailPanel` (+81), `vendorsUtils` (+29), `VendorListPanel`, `VendorExportModal`. 155 lines. |
| **subDepts** | Help swap plus the margin perf panels — `MarginPerfRightPanel` (67), `MarginPerfLeftPanel` (57), `index.ts` (55). 186 lines. |
| **lookup** | **Option A.** Promoting swaps `LookupResultScreen` for `LookupItemReport`: prod's `LookupResultScreen.tsx` + `DailyBreakdown.tsx` are deleted, dev's `LookupItemReport.tsx` (492), `LookupDayRows.tsx`, `lookupReport.ts`, `ItemDayChart.tsx` come in. The entry point and queue panel change with it. This is a visible rewrite of what a lookup returns. |
| **orders** | The largest single-page rebuild. `OrderReportPanel` (1041), `OrdersExportModal` (772), `Orders.tsx` (328), `index.ts` (285), 3 mobile files. prod's `AvailableOrdersPanel.tsx` is deleted; dev's `OrdersConfigPanel.tsx`, `ordersRows.ts`, `ordersExportColumns.ts` come in. Net the desktop page gets *smaller* — it was consolidated, not extended. |
| **sales** | Biggest by volume. The promotable part is `Sales.tsx` (395), `SalesExportModal` (340), `SalesLedger` (247), `StoreDetailPopup` (143), `PopupSubDeptList` (92), `LedgerRow`/`LedgerHeader`, and the mobile perf set (`SalesPerfMobile` 183, `PerfDrillList` 166, `perfData` 59, `PerfStoreReport` 52). **Plus ~9,000 lines of dev-only investigation code** — `DeptInvestigation` (3021), `deptInvestigation` (941), `DeptReport` (874), `ItemEvidence` (776), `investigationSteps` (607), `deptReport` (520), `storeComparison` (512), `HourlySideBySide`, `GroupComparisonPanel`, `DeptMatrixPanel`, and the rest. That is unfinished work, not a promote. **Sales needs a decision about what to leave behind before it can be split into a promote.** |

### Shared units

| Unit | What moves |
|---|---|
| `shared/itemPerf` | `ItemPerfMobile` +241/−88, delete `itemPerfInfo.ts`. Pulled in by categories, vendors, subDepts — promoting any of them touches this. |
| `shared/eventPerf` | `EventPerfMobile` +83/−44, `EventStoreReport` +16/−8, `EventDrillList` +5/−5. Pulled in by couponSales, coupons. |

### Not ready — hold

| Page | Why |
|---|---|
| **organization** | This is the User & Store Access rewrite. 20 dev-only files (`users/access/*`, `sharedGroups/*`, `companies/*`, `stores/StoresTab`, `scoping.ts`, `panelFit.ts`), 7 prod-only files deleted (`AssignPanel`, `StoresDirectory`, `StepAssignments`, `StepUserInfo`, `BaseGroupsTab`, `CompaniesTab`, `StoresTab`), and 12 differing including `CreateUserWizard` (544) and `StepReview` (404). It is a different page. It also depends on backend endpoints that are **dev-only**: `users/user_group_picks`, `stores/store_users`, `stores/assign_store_to_users`, `stores/unassign_store_from_users`. |
| **groups** | `Groups.tsx` (200), `GroupsList` (77), `GroupDetail` (70), 3 mobile files. Same file names in both trees, but this is the groups half of the same access rewrite and the plan is for the three group types to move off User Management onto their own Config page. Promoting it now ships a shape that is about to change again. |
| **admin** | `SubDeptExclusions.tsx` (591) + `shared/subDeptExclusions.ts` (310), `StoreRecords.tsx` (378), `StoreFormModal.tsx` (174), `storeStatus.ts` (94) are all dev-only; `NewStoreName.tsx` is deleted; `Admin.tsx` and `CompanyGrid.tsx` differ. Depends on backend endpoints that are **dev-only**: `stores/sub_department_catalog`, `stores/sub_department_exclusions`, `stores/add_sub_department_exclusion`, `stores/remove_sub_department_exclusion`. |

### Already level

**quicksight** — identical in both trees. Nothing to do.

---

## Hard gate: the backend has to land first

The backend `dev` branch is **37 commits ahead of `prod`**. Every endpoint the
dev frontend calls exists in the repo, but four clusters are dev-only:
`users/user_group_picks`, `stores/store_users` +
`assign_store_to_users` / `unassign_store_from_users`, the four
`sub_department_exclusion` routes, and `help/page_url` (not needed — help is on
the public bucket today).

So: **nothing in organization, groups or admin can go to production until the
backend dev→prod deploy lands.** Everything else on this page is frontend-only
and does not wait on it.

---

## Suggested order

1. **Verify the S3 `prod/` help uploads.** Everything downstream depends on it
   and the failure mode is silent.
2. **Promote the library** — `PageInfoButton` + `InfoModal` into `components/`,
   and only those. Hold the shared filter and perf-card changes.
3. **The five help-only pages** — forecast, categories, lossPrevention,
   receivers, coupons. Smallest possible first publish that proves the help
   path works for clients.
4. **The two shared perf units**, then the pages that depend on them —
   couponSales, cashiers, vendors, subDepts, categories.
5. **Decide on UPC List `fixes`** before promoting upc. It is a yes/no, not a
   merge.
6. **Item Lookup Option A** on its own, because it changes what the page
   returns and should be publishable and revertable by itself.
7. **Orders** on its own, same reason, bigger.
8. **Sales** last, after deciding what of the investigation work is staying in
   dev.
9. **organization / groups / admin** only after the backend is on prod, and
   only after the access and Groups-Config-page decisions are settled.

## Known limit of this audit

`check-split.mjs` compares normalized text, so it catches every textual
difference in the mirrored files. What it does not tell you is whether a
differing file *behaves* differently — a 15-line help swap and a 15-line logic
change look the same in the counts. The classifications above come from reading
the diffs, not from the sizes.
