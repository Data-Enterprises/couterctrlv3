# Dev → production: the full list

Re-audited **2026-10-19** against the working tree on `sales_top_items`
(`master_publish` + 5 Top 200 commits, 3 files uncommitted). Supersedes the
2026-10-16 pass, which is now wrong in one important way — see *What changed*.

Method: `node scripts/check-split.mjs <page>` section 1 (MIRROR) for every page
with a real prod tree. That is authoritative because it normalizes the
legitimate dev/prod swaps. The two `shared/` perf units and the component
libraries aren't pages, so those were diffed by hand with the same
normalization. Counts below are changed lines (added + removed) per file.

---

## What changed since the 16th

**Help is no longer an S3 iframe on desktop.** The 10-16 audit called the S3
`prod/` uploads the gate on everything. That's been rebuilt since:
`components-dev/help/` now holds `HelpPanel`, `helpTypes.ts`,
`useHelpHighlight.ts` and **16 typed content modules** covering all 17 names in
`constants/helpPages.ts`. The panel renders inside the app and can point at the
control it's describing via `data-help` anchors — which the cross-origin frame
could never do.

`PageInfoButton` now splits by device: **desktop gets the panel, a phone keeps
the S3 document.** So S3 still matters, but only for the 12 `-mobile` pages, not
for 17 desktop ones. That is a much smaller surface than it was three days ago.

The knock-on is that nearly every page picked up small anchor edits — the
`data-help` attributes the panel looks for. That's what the new 2-to-6-line
diffs on `UpcItemList`, `CouponDetailPanel`, `ReceiverDetailPanel`,
`ForecastEntry`, `CpnSalesDetailPanel`, `LensPanel`, `SignalDetail`,
`CompanyPicker` and `StoreActivityComp` are.

---

## Client-facing pages

### Help swap + anchors only — cosmetic, promote in any order

| Page | Files | Lines | Notes |
|---|---|---|---|
| **lossPrevention** | `LossPrevention`, `LPStorePanel` | 30 | delete `lpInfo.ts` (34) |
| **receivers** | `ReceiverListPanel`, `ReceiverDetailPanel`, `mobile/RcvReceiverList` | 54 | delete `receiversInfo.ts`; mobile part is the `/85`→`/95` contrast bump |
| **categories** | `CategoryListPanel` | 27 | delete `categoriesInfo.ts` (69) |
| **coupons** | `CouponListPanel`, `CouponDetailPanel` + 6 mobile | 120 | delete `couponsInfo.ts`; mobile is the contrast bump |
| **forecast** | `ForecastListPanel`, `ForecastRowsTable`, `ForecastEntry` | 27 | delete `forecastInfo.ts` (151) |

### Real changes, page-local

| Page | Lines | What moves |
|---|---|---|
| **upc** | 29 + 70 deleted | Help swap (`moduleInfo.ts` + `ModuleInfoPopover` go), and `useUpcDevCtx.ts` — **promoting flips `fixes` from `false` to `true`**, turning the UPC List fixes on for clients. That's a product call, not a merge. |
| **couponSales** | 55 | Help swap plus a real fix: the week's coupon lines moved from a `useRef` to module scope. The ref died with the component, so returning to the page resolved every receipt against an empty array — "No lines came back" over a row showing its amount. |
| **vendors** | 146 | `VendorDetailPanel` (81), `vendorsUtils` (29), `VendorListPanel` (27), `VendorExportModal` (9). |
| **subDepts** | 197 | `MarginPerfLeftPanel` (68), `MarginPerfRightPanel` (67), `index.ts` (55). |
| **cashiers** | 545 | `mobile/SignalListMobile` (332) and `mobile/SignalTransactionsMobile` (176) rebuilt; `explorer/lensUtils` (27) gains `lensListLabel` (Back reads "back to stores", not "back to signals") and `transactionLabel` (shows the receipt number out of the compound `sale_id`). |
| **lookup** | 1,160 | **Option A.** `LookupResultScreen` (211) + `DailyBreakdown` (160) deleted; `LookupItemReport` (470), `LookupDayRows` (117), `lookupReport.ts` (86), `ItemDayChart` (71) come in. Visible rewrite of what a lookup returns — promote it alone so it can be reverted alone. |
| **orders** | 3,093 | Largest finished rebuild. `OrderReportPanel` (1041), `OrdersExportModal` (772), `Orders.tsx` (328), `index.ts` (285); `AvailableOrdersPanel` (269) out, `OrdersConfigPanel` (232) + `ordersRows` + `ordersExportColumns` in. The desktop page gets *smaller* — consolidated, not extended. |
| **groups** | 373 | `Groups.tsx` (200), `GroupsList` (81), `GroupDetail` (72) + 3 mobile. Same 9 files in both trees. See the hold note below. |
| **shared/itemPerf** | 409 | `ItemPerfMobile` (329), delete `itemPerfInfo.ts` (80). Used by categories, vendors, subDepts — promoting any of them touches this. |
| **shared/eventPerf** | 155 | `EventPerfMobile` (121), `EventStoreReport` (24), `EventDrillList` (10). Used by couponSales, coupons. |

### Needs a decision before it can be promoted

**sales — 12,275 lines.** The promotable part is real and finished:
`Sales.tsx` (395), `SalesExportModal` (340), `SalesLedger` (251),
`StoreDetailPopup` (180), `PopupSubDeptList` (92), `LedgerRow` (73),
`LedgerHeader` (21), and the mobile perf set — `SalesPerfMobile` (183),
`PerfDrillList` (166), `perfData` (59), `PerfStoreReport` (52).

Sitting beside it is **~10,000 lines of dev-only work in varying states**:
`DeptInvestigation` (2850), `deptInvestigation` (856), `PopupTopItems` (842),
`DeptReport` (824), `ItemEvidence` (730), `investigationSteps` (549),
`deptReport` (474), `storeComparison` (470), `HourlySideBySide` (419),
`DeptMatrixPanel` (348), `investigationData` (345), `topItems` (327),
`deptMatrix` (263), `PopupComparisonList` (241), plus the hooks and
`treemapLayout`.

Top 200 (`PopupTopItems`, `topItems.ts`) is being actively worked on right now
and has uncommitted changes. **Sales can't be promoted until you say which of
this stays in dev.** Everything else on the list can go without it.

### Hold — backend-gated

**organization — 7,255 lines.** This is the User & Store Access rewrite, and
it's a different page, not a changed one: 20 dev-only files
(`users/access/*`, `sharedGroups/*`, `companies/*`, `stores/StoresTab`,
`scoping.ts`, `panelFit.ts`), 7 prod files deleted (`AssignPanel`,
`StoresDirectory`, `StepAssignments`, `StepUserInfo`, `BaseGroupsTab`,
`CompaniesTab`, `StoresTab`), and 12 differing including `CreateUserWizard`
(544), `StepReview` (404), `BaseGroupUsersTab` (277).

**admin — 1,815 lines.** `SubDeptExclusions` (559) + `shared/subDeptExclusions`
(288), `StoreRecords` (350), `StoreFormModal` (160), `storeStatus` (84) all
new; `NewStoreName` (206) deleted; `CompanyGrid` (78), `Admin.tsx` (54).

Both call endpoints that are **dev-only on the backend**:
`users/user_group_picks`, `stores/store_users`, `stores/assign_store_to_users`,
`stores/unassign_store_from_users`, and the four `sub_department_exclusion`
routes. Backend `dev` is 37 commits ahead of `prod` and carries all of them, so
these unblock when that deploy lands — but not before.

**groups** is the groups half of the same access rewrite, and the plan is for
the three group types to leave User Management for their own Config page.
Technically promotable on its own; promoting it ships a shape that's about to
change again.

### Already level

**quicksight** — identical in both trees. Nothing to do.

---

## Item Actions and Sales Tracker

Both are Coming Soon today, desktop-only, and both are **frontend-only
promotes — no backend work needed.** I checked every endpoint.

**Item Actions** (`pages/itemReport`, `href: "item-report"`, 13 dev files,
~6,200 lines). Calls `subs/subs`, `receivers/details`,
`receivers/item_search`, `cashiers/transaction_list` — all four are on backend
`prod` already. Has its own CSV upload path (`parseUpload.ts`). Currently level
7–9.

**Sales Tracker** (`pages/salesTracker`, `href: "sales-tracker"`, 13 dev files,
~2,200 lines). Reads `subs/sub_sales`, which is on `prod`. It also imports
`getSalesTracker` → `subs/sales_tracker`, and **that endpoint does not exist on
any backend branch** — but `useTrackerEndpoint` is a hard `false` with a
docblock explaining exactly why ("the endpoint is not on the API yet — on dev
it would 404, and the API toggle is reachable by anyone at level 7"). So the
page is publish-safe as written. Leave the flag alone; if it gets flipped the
page breaks on both APIs.

**What promoting either one involves**, beyond `promote:page`:
- Remove the entry from `COMING_SOON_CATEGORY` in `navigation/utils.tsx` and
  restore `userLevels: ["*"]`.
- Add it to the **flat list** at the top of that file — the one feeding the
  Settings nav editor. Easy to miss; LP Actions and Sales Tracker are both
  absent from it today.
- Delete the dev-API gate in the page switcher (`pages/<page>/<Name>.tsx`),
  which currently returns `DevOnlyNotice` unless `apiEnv === "dev"` **and** the
  URL is really `DEV_API_URL`.
- Replace `ComingSoonHelp` with real help, or accept the placeholder. Neither
  page has a `help/content` module and neither is in `HELP_PAGES`.
- `salesTracker` also needs `charts/TrendLine` copied into `components/`.

---

## Component library

`components-dev/` has 32 files `components/` doesn't. Only these are needed by
non-Coming-Soon pages:

| Component | Needed by |
|---|---|
| `help/` — `HelpPanel`, `helpTypes`, `useHelpHighlight`, 16 content modules | every page with a "?" |
| `PageInfoButton`, `InfoModal` | the same |
| `Checkbox` | admin, organization |
| `AssignPanel` | organization |
| `mobile/perf/PerfChange`, `mobile/perf/PerfDelta` | sales, shared perf |
| `charts/TrendLine` | salesTracker (if promoted) |

23 components exist in both libraries and differ. The ones worth knowing about:
`filters/MultiSelectFilter` (150), `filters/SelectFilter` (133),
`mobile/perf/perfColors` (98), `mobile/MobilePerfHeader` (52),
`mobile/perf/PairedBars` (40), `mobile/perf/PerfDayChart` (24),
`mobile/MobilePerfCard` (22), `filters/ThresholdFilter` (18),
`SearchCard` (16), `storePicker/SearchType` (16),
`mobile/perf/PerfCardHeader` (16), `SingleStoreSearchCard` (13),
`filters/FilterBar` (12), `storePicker/SelectGroup` (11).

I read the two big filter diffs: both are **additive and
backward-compatible** — new optional props (`plain`, `searchable`) that default
to current behaviour, plus dropdowns that open upward when there's no room
below. Low risk. But they're shared, so promoting one page's panel can pull a
filter change onto every page using it. Promote library components
deliberately, not as a side effect of a page.

---

## Backend

`goliath-platform` `dev` is **37 commits ahead of `prod`**. Already verified
safe for the current prod frontend (every prod-called endpoint present, request
models byte-identical, response envelopes identical, the `sale_id` concat alias
preserved). Two documented behaviour changes ride along: the trend
`average_qty` divisor correction and `ILIKE` description matching in place of
pandas `str.contains`. `CORS_ORIGINS` is the only non-code risk.

Dev-only endpoint clusters, and who needs them: `users/user_group_picks` /
`stores/store_users` / the two store-assign routes → **organization**; the four
`sub_department_exclusion` routes → **admin**; `subs/daily` → not used by
anything being promoted; `help/page_url` → not needed, help is on the public
bucket.

**Land the backend first, or simultaneously.** Frontend ahead of backend means
organization and admin 404 in the gap.

---

## Order

1. **Backend dev → prod.**
2. **Library**: `help/` + `PageInfoButton` + `InfoModal` into `components/`.
   Hold the shared filter and perf-card changes for their own step.
3. **The five cosmetic pages** — lossPrevention, receivers, categories,
   coupons, forecast. Smallest publish that proves the help panel works for
   clients.
4. **The two shared perf units**, then the pages depending on them —
   couponSales, cashiers, vendors, subDepts.
5. **Decide UPC List `fixes`**, then promote upc.
6. **Item Lookup** (Option A) on its own.
7. **Orders** on its own.
8. **Item Actions** and **Sales Tracker** — both clean, both frontend-only.
   Don't touch `useTrackerEndpoint`.
9. **organization** and **admin**, once the backend is live and the access
   decisions are settled. **groups** with them, not before.
10. **Sales** last, after the call on the investigation and Top 200 work.

## Limits of this audit

`check-split.mjs` compares normalized text, so it finds every textual
difference in the mirrored files — but a 20-line help swap and a 20-line logic
change look identical in the counts. The classifications above come from
reading the diffs. Sales is a moving target: Top 200 has uncommitted changes
and a deleted `GhostFlames.tsx` in the working tree as of this audit.
