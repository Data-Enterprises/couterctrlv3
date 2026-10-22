# Dev → prod gameplan

The working checklist for the push. Page deltas and reasoning live in
[dev-to-prod-plan.md](dev-to-prod-plan.md); this file is the order of
operations and the component moves each step needs.

Baseline: **2026-10-19**, working tree on `sales_top_items`. Update as edits
land.

---

## Three things that force pages to move together

These are not preferences. Each is a prop that was renamed, so the component
and every caller have to change in the same commit or the build breaks.

### 1. `MobilePerfHeader`: `info={X_INFO}` → `helpPage="x"`

Promoting `components-dev/mobile/MobilePerfHeader.tsx` breaks any prod file
still passing `info=`. Seven prod files do:

| File | Passes |
|---|---|
| `cashiers/prod/mobile/SignalListMobile.tsx:74` | `info={CASHIERS_INFO}` |
| `coupons/prod/mobile/CpnOverview.tsx:118` | `info={COUPONS_INFO}` |
| `coupons/prod/mobile/CpnSectionDetail.tsx:216` | `info={COUPONS_INFO}` |
| `coupons/prod/mobile/CpnStoreList.tsx:97` | `info={COUPONS_INFO}` |
| `orders/prod/mobile/OrdersAvailableScreen.tsx:103` | `info={ORDERS_INFO}` |
| `orders/prod/mobile/OrdersListScreen.tsx:117` | `info={ORDERS_INFO}` |
| `receivers/prod/mobile/RcvReceiverList.tsx:182` | `info={RECEIVERS_INFO}` |

The dev versions of coupons, orders and receivers pass `helpPage=` instead.
**Cashiers is the catch**: its dev tree dropped `MobilePerfHeader` altogether
during the mobile rebuild, so there's no dev file to swap in — promoting the
component means cashiers has to be promoted at the same time or that call site
has to be fixed by hand.

**→ Bundle A (atomic): `MobilePerfHeader` + coupons + orders + receivers + cashiers.**

### 2. `EventPerfMobile`: same rename

`shared/eventPerf/EventPerfMobile` took the same `info` → `helpPage` change.
Callers are `couponSales/dev/CouponSales.tsx:243` and
`lossPrevention/dev/LossPrevention.tsx:115`.

**→ Bundle B (atomic): `shared/eventPerf` + couponSales + lossPrevention.**

### 3. `storePicker/SearchType` + `SelectGroup`: Shared groups appear

Dev adds a `{ id: 4, name: "Shared", type: "Shared" }` option and reworks the
dropdown to show one side or the other. The prod comment says it plainly:
"Prod has no shared groups". These two feed `SearchCard` and
`SingleStoreSearchCard`, so they ride along with almost every page.

**Do not promote these two with an early page.** Pin them to the
organization / Shared Groups work. If a page promote needs `SearchCard`,
promote `SearchCard` on its own and leave `SearchType`/`SelectGroup` at the
prod version until Shared Groups ships.

`shared/itemPerf/ItemPerfMobile` is **not** in this category — it resolves help
internally by dimension, so categories / vendors / subDepts need no change for
it. It can move on its own.

---

## Component moves

32 files exist in `components-dev/` and not in `components/`. 22 exist in both
and differ. 34 are identical.

### New files to create in `components/`

Needed by non-Coming-Soon pages:

- [ ] `help/HelpPanel.tsx`
- [ ] `help/helpTypes.ts`
- [ ] `help/useHelpHighlight.ts`
- [ ] `help/content/index.ts` + 16 content modules (admin, cashiers,
      categories, couponSales, coupons, forecasting, itemLookup,
      lossPrevention, orders, receivers, sales, salesExport, storeGroups,
      subDeptMargins, upcList, vendors)
- [ ] `PageInfoButton.tsx`
- [ ] `InfoModal.tsx`
- [ ] `Checkbox.tsx` — admin, organization
- [ ] `AssignPanel.tsx` — organization
- [ ] `mobile/perf/PerfChange.tsx` — sales, shared/itemPerf
- [ ] `mobile/perf/PerfDelta.tsx` — sales, shared/itemPerf, shared/eventPerf
- [ ] `charts/TrendLine.tsx` — salesTracker only

Also needed once the Coming Soon releases go (Step 8):

- [ ] `ComingSoonHelp.tsx` — Item Actions, Sales Tracker
- [ ] `inputs/TextField.tsx` — Tickets

Leave behind: `ConfirmDelete` (exportBuilder only, staying in Coming Soon).

`scanner/` already exists in both libraries and is identical — nothing to do,
and `lookup/prod/DevUpcScanner.tsx` already imports the prod one.

### Changed files, with blast radius

The prod pages in the right column break or change behaviour when the
component is updated. Verified **additive / backward-compatible** unless
flagged.

| Component | Δ | Prod pages affected |
|---|---|---|
| `filters/SelectFilter` | 133 | admin, cashiers, coupons, lossPrevention, orders, organization, receivers, sales, subDepts |
| `filters/MultiSelectFilter` | 150 | subDepts, vendors |
| `filters/ThresholdFilter` | 18 | categories, couponSales, coupons, lossPrevention, sales, subDepts, vendors |
| `filters/FilterBar` | 12 | orders, receivers |
| `SortHeader` | 6 | categories, couponSales, forecast, lossPrevention, sales, subDepts, vendors |
| `SearchCard` | 16 | cashiers, couponSales, coupons, lossPrevention, orders, sales, shared/eventPerf |
| `SingleStoreSearchCard` | 13 | categories, lookup, receivers, shared/itemPerf, subDepts, vendors |
| `Modal` | 6 | subDepts, (library) |
| `modals/ExportModal` | 2 | orders, subDepts |
| `transactions/Transaction` | 2 | cashiers, lossPrevention |
| `datePickers/Calendar` | 2 | — (via library) |
| **`storePicker/SearchType`** | 16 | **⚠ adds Shared groups — hold** |
| **`storePicker/SelectGroup`** | 11 | **⚠ adds Shared groups — hold** |
| **`mobile/MobilePerfHeader`** | 52 | **⚠ breaking — Bundle A** |
| `mobile/MobilePerfCard` | 22 | sales, shared perf — `change: string` → `ReactNode`, a widening, so existing callers compile |
| `mobile/MobilePerfDetail` | 2 | sales, shared perf |
| `mobile/MobileSortChips` | 6 | sales, shared perf |
| `mobile/perf/perfColors` | 98 | sales, shared perf |
| `mobile/perf/PairedBars` | 40 | sales, shared perf |
| `mobile/perf/PerfDayChart` | 24 | sales, shared perf — drops the `loser` dimming |
| `mobile/perf/PerfCardHeader` | 16 | sales, shared perf |

The six `mobile/perf/*` + three `mobile/Mobile*` entries are one cluster used
only by sales and the two shared perf units — they move with those, not with a
desktop page.

`npm run audit:theme` is clean for everything being promoted (the only hits are
in exportBuilder, lpActions and one `DeltaPill` helper in sales).

---

## Step order

Each step should end with `npx tsc -b` green and `node scripts/check-split.mjs <page>` clean.

### Step 0 — backend
- [ ] `goliath-platform` `dev` → `prod` (37 commits). Already verified safe for
      the current prod frontend.
- [ ] Confirm `CORS_ORIGINS` on the prod stage.

Land this first or simultaneously. Frontend ahead of backend means
organization and admin 404 in the gap.

### Step 1 — help library
- [ ] Copy `help/` (panel, types, highlight hook, all 17 content modules) into
      `components/`.
- [ ] Copy `PageInfoButton.tsx` and `InfoModal.tsx`.
- [ ] Nothing imports them from prod yet, so this step is inert on its own —
      which is the point.

### Step 2 — Bundle B: shared/eventPerf + couponSales + lossPrevention
- [ ] `promote:page couponSales`, `promote:page lossPrevention`
- [ ] Promote `shared/eventPerf` (3 files, 155 lines)
- [ ] Components: `SearchCard`, `SortHeader`, `filters/SelectFilter`,
      `filters/ThresholdFilter`, `transactions/Transaction`,
      `mobile/perf/PerfDelta` (new)
- [ ] Delete `lpInfo.ts`, `couponSalesInfo.ts`
- [ ] Carries the couponSales mobile receipt fix (lines moved off a `useRef`)

### Step 3 — the two cheap desktop pages
- [ ] `categories` — 27 lines, delete `categoriesInfo.ts`. Components:
      `SingleStoreSearchCard`, `SortHeader`, `filters/ThresholdFilter`
- [ ] `forecast` — 27 lines, delete `forecastInfo.ts`. Components: `SortHeader`
- [ ] Promote `shared/itemPerf` with categories (409 lines, no caller changes)

### Step 4 — Bundle A: coupons + orders + receivers + cashiers
Biggest mandatory bundle. ~3,800 lines across four pages.
- [ ] `mobile/MobilePerfHeader` **and** all four pages in one commit
- [ ] Components: `filters/SelectFilter`, `filters/ThresholdFilter`,
      `filters/FilterBar`, `SearchCard`, `SortHeader`, `modals/ExportModal`,
      `transactions/Transaction`, `mobile/MobilePerfDetail`,
      `mobile/MobileSortChips`, `mobile/perf/PerfCardHeader`,
      `mobile/perf/perfColors`
- [ ] Delete `couponsInfo.ts`, `ordersInfo.ts`, `receiversInfo.ts`,
      `cashiersInfo.ts`
- [ ] Orders: `AvailableOrdersPanel` out; `OrdersConfigPanel`, `ordersRows`,
      `ordersExportColumns` in
- [ ] Cashiers: `lensUtils` gains `lensListLabel` + `transactionLabel`

Splitting this is possible but means hand-editing the four prod call sites to
keep `info=` working — more work than promoting them together.

### Step 5 — vendors + subDepts
- [ ] `vendors` — 146 lines. Components: `SingleStoreSearchCard`, `SortHeader`,
      `filters/MultiSelectFilter`, `filters/ThresholdFilter`
- [ ] `subDepts` — 197 lines. Components: the above plus `Modal`,
      `filters/SelectFilter`, `modals/ExportModal`
- [ ] Delete `vendorsInfo.ts`, `subDeptMarginsInfo.ts`

### Step 6 — upc
- [ ] **Decide `fixes`.** Promoting `hooks/useUpcDevCtx.ts` flips it
      `false` → `true` and turns the UPC List fixes on for clients.
- [ ] 29 lines + delete `moduleInfo.ts` and `ModuleInfoPopover.tsx`
- [ ] Components: `PageInfoButton` only

### Step 7 — Item Lookup (Option A), alone
- [ ] 1,160 lines. `LookupResultScreen` + `DailyBreakdown` out;
      `LookupItemReport`, `LookupDayRows`, `lookupReport.ts`, `ItemDayChart` in
- [ ] Components: `SingleStoreSearchCard`, `mobile/perf/perfColors`
- [ ] Delete `lookupInfo.ts`
- [ ] Alone so it can be reverted alone — it changes what the page returns

### Step 8 — Coming Soon releases

Four page trees, five nav entries. Verified 2026-10-20: all four pass
`check:split` in full (mirror, isolation, state, dev-only gating, imports,
dead code), **96 tests across 7 files pass**, and `npx tsc -b` is clean.

All five are `mobile: false` and none has any mobile code — nothing to trash.
None is in `HELP_PAGES`.

#### 8a. Price Opt Sub Dept + Price Opt Vendor — cleanest, no backend dependency
One tree (`pages/inventory`, 7 files, 1,955 lines), two nav entries, two
switchers.
- [ ] `promote:page inventory`
- [ ] Calls `subs/sub_sales` only — **already on backend prod**. This one can
      ship without waiting for the API deploy.
- [ ] Components: `SingleStoreSearchCard` (39)
- [ ] Both already in the flat nav list — only the Coming Soon entries and
      `userLevels` need changing
- [ ] Delete the `DevOnlyNotice` gate in `InventorySubDept.tsx` and
      `InventoryVendor.tsx` (two switchers, not one)
- [ ] No help of any kind today

#### 8b. Item Actions — the optimized query is real
`pages/itemReport`, 13 files, 6,340 lines.
- [ ] `promote:page itemReport`
- [ ] Endpoints: **`subs/item_actions`** (the optimized query — on backend
      `dev`, **not** prod, so this waits on Step 0), plus `subs/subs`,
      `receivers/`, `receivers/details`, `receivers/item_search`,
      `cashiers/transaction_list`, all already on prod
- [ ] Batches through `ITEM_ACTIONS_MAX_CODES`
- [ ] Components: `ComingSoonHelp` (new), `SingleStoreSearchCard` (39),
      `filters/MultiSelectFilter` (150), `filters/SelectFilter` (133)
- [ ] Already in the flat nav list
- [ ] Uses `ComingSoonHelp` in 2 places — replace or carry the placeholder

#### 8c. Sales Tracker — endpoint exists, but it is uncommitted
`pages/salesTracker`, 13 files, 2,352 lines.
- [ ] **Backend: commit it.** `/subs/sales_tracker` is in the working tree of
      `branch_10_20_2026` — 454 uncommitted lines in `api/routers/subs.py`. It
      is on no ref, so it is not on `dev` and not on `prod`. Commit → merge to
      `dev` → it rides Step 0.
- [ ] **Frontend: flip the flag.** `useTrackerEndpoint` in
      `SalesTracker.tsx:114` is a hard `false` (commit `cb3e3236`, "sub_sales
      again: the tracker endpoint is not on dev"). Until it is `true` the page
      ships on the old two-paged-read path no matter what the API has. The
      measured difference was ~52s → ~7s for 5 stores over 12 weeks.
- [x] **Functional parity with `sub_sales` checked line by line — it holds.**
      The tracker reads only six fields (`sale_date`, `sub_department`,
      `sub_department_description`, `total_sales`, `total_tax`,
      `transaction_count`) and all six come out the same on both paths:
      - `total_sales` = `SUM(total_sales x sign) + swap_store - swap_instore
        + tax`, and `net_sales` the same minus tax — identical formulas
      - same row filters: sale_type allow-list
        `('sale','refunded','modified','refund')`, `void_flag = 0`, the ring
        filter with the company-6 carve-out, dept-transfer exclusion, and the
        untendered-modified-basket rule. The `candidate`/`excluded` CTE rewrite
        is logically equivalent to `sub_sales`' `bool_or(...) OVER basket`: a
        basket absent from `excluded` is provably either tendered or free of
        modified rows, which is what the `COALESCE(x.tendered, true)` default
        asserts.
      - same company-4 weight scaling, same coupon re-pointing gated to
        `CPN_REALLOCATE_COMPANIES`, same `COUPON_SWAP_SCOPE`
      - `transaction_count`: `sub_sales` counts
        `DISTINCT storeid-sale_id-terminal-date`; the new one counts `COUNT(*)`
        over `per_basket`, which groups by the basket key inside the same
        output dimensions. Equivalent.
      - group mode drops `storeid` / `store_name` / `store_number` in **both**
        — `get_sub_sales` does the same `if not useGroups` — so it is not a new
        behaviour, and the tracker reads none of them
- [x] Request/response contract:
      - frontend sends `{dates, useGroups, searchValue, singleStore}`;
        `SalesTrackerRequest` takes exactly those, `singleStore` defaulted
      - dates are ISO `YYYY-MM-DD` from `toISOString().split("T")[0]`;
        Pydantic `list[date]` parses them
      - success returns `{error: 0, success, store_count, date_count,
        total_records, subs}`; `trackerCall` checks `error !== 0` then reads
        `subs`. The extra keys are ignored.
      - 400s carry a structured detail (`store_days_exceeded` or
        `group_too_large`); `trackerError` reads `response.data.detail` and
        handles both a bare string and an object with `msg`
      - an unexpected exception returns 200 `{error: 1, msg}`; `trackerCall`
        throws on it
- [x] Harmless differences: `qty` rounds to 3dp here vs 2dp in `sub_sales`
      (the tracker never reads `qty`), and `sale_date` may serialize as
      `"2026-10-14"` rather than pandas' timestamp — `trackerTotals.ts:132`
      already does `.split("T")[0]`, so both parse
- [ ] Not a blocker, worth knowing: the endpoint is built to take TY and LY
      days in one call ("the response is keyed by `sale_date`, so the caller
      pairs them"), but `fetchTrackerWindow` still queues `ty` and `ly` as
      separate jobs. 12 calls where 6 would do. Works either way.
- [ ] `MAX_TRACKER_STORE_DAYS` env var, default 1200. Requests batch 2 weeks at
      a time, so a 5-store search is 5 × 14 = 70 store-days per call — far
      under. Nothing to set unless a very large group needs headroom.
- [ ] `subs/sub_sales` (the fallback path) is already on prod
- [ ] Components: `ComingSoonHelp` (new), `charts/TrendLine` (new),
      `SearchCard` (16), `SortHeader` (6)
- [ ] **Missing from the flat nav list** — add it
- [ ] Uses `ComingSoonHelp` in 1 place

#### 8d. Tickets — most prerequisites, and they are not all code
`pages/tickets`, 12 files (+5 test files), 3,405 lines.
- [ ] `promote:page tickets`
- [ ] Backend: the whole `/tickets` router is **dev-only** (routes `/`,
      `/assignees`, `/lookups`, `/techs`, `/techs/candidates`,
      `/techs/{id}`, `/{id}`, `/{id}/comments`). Ships with Step 0.
      `groups/stores_assigned_to_user_group` is already on prod.
- [x] **Database: nothing to do.** Dev and prod are the same database, so
      `db/ticket_workflow.sql` is already applied.
- [ ] **Env on the prod stage** (`api/ticket_notify.py`):
      - `TICKET_EMAIL_ENABLED` — unset means mail silently never sends
      - `TICKET_APP_URL` — blank means notification mails carry no link
      - `TICKET_EMAIL_REDIRECT_TO` — **must be unset on prod.** If the prod
        stage inherits dev's value, every client's ticket mail goes to that
        one address.
- [ ] **`src/App.tsx:152`** renders `ReportIssueModal` behind
      `context.apiEnv === "dev"`. That is outside the page tree, so
      `check:split` does not see it. Decide whether "Report an issue" goes
      live with Tickets, and change that line deliberately.
- [ ] Components: `Checkbox` (new), `inputs/TextField` (new), `Modal` (6),
      `filters/MultiSelectFilter` (150), `filters/SelectFilter` (133)
- [ ] **Missing from the flat nav list** — add it
- [ ] No help of any kind today

#### Common to all four
- [ ] Remove each entry from `COMING_SOON_CATEGORY` in `navigation/utils.tsx`
      and restore `userLevels: ["*"]` (all five sit at `COMING_SOON_LEVELS`
      today)
- [ ] Delete the `apiEnv !== "dev" || url !== DEV_API_URL → DevOnlyNotice`
      gate in each switcher
- [ ] `inputs/TextField` and `ComingSoonHelp` were on the "leave behind" list
      in the component section — Tickets and Item Actions/Sales Tracker pull
      them into prod. Update that list.

#### Staying in Coming Soon
LP Actions, Sales Export, AWG Invoices, Upc Scanner (all
`PROGRAMMER_ONLY_LEVELS`), and Suggested Weight (commented out).

### Step 9 — organization + admin + groups
Backend must be live first.
- [ ] `organization` — 7,255 lines, 20 new files, 7 deleted
- [ ] `admin` — 1,815 lines, 5 new files, `NewStoreName` deleted
- [ ] `groups` — 373 lines
- [ ] Components: `AssignPanel` (new), `Checkbox` (new),
      `filters/SelectFilter`, `help/helpTypes`
- [ ] **Now** promote `storePicker/SearchType` + `storePicker/SelectGroup` —
      Shared groups belong with this step
- [ ] Settle the Groups-own-Config-page question before promoting groups, or it
      ships a shape that changes again

### Step 10 — sales, last
- [ ] Decide what stays in dev. Promotable now: `Sales.tsx` (395),
      `SalesExportModal` (340), `SalesLedger` (251), `StoreDetailPopup` (180),
      `PopupSubDeptList` (92), `LedgerRow` (73), `LedgerHeader` (21), mobile
      perf set (460)
- [ ] Staying behind (unless you say otherwise): `DeptInvestigation` (2850),
      `deptInvestigation` (856), `PopupTopItems` (842), `DeptReport` (824),
      `ItemEvidence` (730), `investigationSteps` (549), `deptReport` (474),
      `storeComparison` (470), `HourlySideBySide` (419), `DeptMatrixPanel`
      (348), `investigationData` (345), `topItems` (327), `deptMatrix` (263),
      `PopupComparisonList` (241), `DeltaPill`, `StoreColFilter`, the two hooks,
      `treemapLayout`
- [ ] Components: the full `mobile/perf/*` + `mobile/Mobile*` cluster,
      `PerfChange` and `PerfDelta` (new)
- [ ] Delete `salesInfo.ts`
- [ ] Top 200 is being actively edited — 3 uncommitted files as of this
      baseline, including a deleted `GhostFlames.tsx`

---

## After the push

- [ ] Wipe `docs/since-last-publish.md` and start it again
- [ ] Write the dated HTML into `Documents\ccc-release-notes` — DEV flavour
      (everything) and PROD flavour (prod pages only)
- [ ] Update `docs/ui-split-tracker.md` for every page that changed trees
- [ ] Mobile help still comes from S3: confirm the `prod/` folder holds the 12
      `-mobile` documents. Desktop no longer needs S3 at all.
