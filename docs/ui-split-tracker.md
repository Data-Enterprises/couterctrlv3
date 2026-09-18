# Dev/prod UI split — page tracker

Per page: `npm run split:page -- <page> --dry` → split → cut tablet/legacy →
trash dead files → `tsc -b` + `npm run check:split -- <page>` → commit.
Promote later with `npm run promote:page -- <page>` once dev is signed off.
**Coming Soon pages are dev-only**: they get a `dev/` tree and no `prod/` tree until greenlit for production; then they are copied over and set up for prod. They are handled last. For safety they must **hit the dev API only** — pinned with `useDevApi()` (dev URL + dev token from the environment), never `app.url`, and render nothing prod-side. Coming Soon: Item Actions, LP Actions, Sales Tracker, Price Opt Sub Dept, Price Opt Vendor, Invoices, Suggested Weight (route commented out), Tickets.
A page with `mobile: false` in the nav (`components/navigation/utils.tsx`) has no mobile version: its mobile code goes to trash in the split.
Every page gets its own dev Redux state, as Sales has (split-page forks each page slice; `npm run fork:slice -- <page> <key>` for one added later).

Status: **done** · **next** · blank = not started

## Shared units — split these before the pages that use them

| Unit | Used by | Status | Notes |
|---|---|---|---|
| `shared/itemPerf` | Categories, Vendors, Sub Dept Margins (mobile) | **done** | own dev Redux state (`devItemPerfSlice`); dev library gained the scanner, `SingleStoreSearchCard`, `SingleSelect` |
| `shared/eventPerf` | Loss Prevention, Coupon Sales (mobile) | **done** | LP/coupon adapters moved to `src/api/eventPerf/`, `clockOf` to `utils/dates` |

## Pages

| Page | Route | Folder | Status | Notes |
|---|---|---|---|---|
| Sales | `/sales` | `sales` | **done** | legacy Sales + `salesLegacy`/`salesMobile` state removed; prod `Sales.tsx` still has commented legacy (a promote cleans it) |
| Categories | `/categories` | `categories` | **done** | no legacy or tablet to cut; own dev Redux state (`devCategoriesSlice`); mobile on its own side of `shared/itemPerf` |
| Vendors | `/vendors` | `vendors` | **done** | no legacy or tablet to cut; own dev Redux state (`devVendorsSlice`); last `shared/itemPerf` user, so its switcher went to trash |
| Sub Dept Margins | `/sub-dept-margins` | `subDepts` | **done** | legacy page + `subMarginLegacy` state, tablet and old mobile stack removed (49 files to trash); `SubDeptMarginsDev` is now the `SubDeptMargins` entry; `display/dev` renamed `display/perf`; helpers imported from `src/utils` directly; own dev Redux state (`devSubMarginSlice`). `subMarginSlice` still carries tablet/old-mobile fields (e.g. `viewTabletCards`) |
| Coupon Sales | `/coupon-sales` | `couponSales` | **done** | own dev Redux state (`devCouponSalesSlice`); open receipt moved off LP's `transactionDrillDown` into `couponSales.receiptLines`, so it uses no LP state; dead `mobile/` trashed with LP |
| Loss Prevention | `/loss-prevention` | `lossPrevention` | **done** | legacy page + `lossPreventionLegacy` state and tablet removed (35 files to trash); own dev Redux state (`state.dev.lossPrevention`, `devLossPreventionSlice`); `TransactionModal` moved to `pages/coupons` (only Coupons opened it; reads prod state)
| Coupons | `/coupons` | `coupons` | **done** | legacy page + `couponLegacy` state, the old grid/filters/kpi and old mobile view removed (14 files incl. `TransactionModal`); phone view is `mobile/CouponsMobile` (was `devMobile/CouponsMobileDev`); open receipt moved off LP's `transactionDrillDown` into `coupons.receiptLines`, so no LP state; own dev Redux state (`devCouponSlice`) |
| LP Actions | `/lp-actions` | `lpActions` | **done (dev-only)** | Coming Soon: `dev/` tree, empty `prod/` until greenlight; own dev Redux state (`devLpActionsSlice`) |
| Cashiers | `/cashiers` | `cashiers` | **done** | legacy page + `cashierLegacy` state and the pre-Explorer desktop UI removed (43 files to trash); own dev Redux state (`devCashiersSlice`); `src/api/cashiers.ts` now unused but left (api layer) |
| Orders | `/orders` | `orders` | **done** | legacy page + `ordersLegacy` state, kpis/ and tablet removed (12 files, incl. `sales/mobile/index.ts`); own dev Redux state (`devOrdersSlice`) |
| Receivers | `/receivers` | `receivers` | **done** | legacy page + `receiversLegacy` state, tablet and the old mobile view removed (16 files); phone view is `mobile/ReceiversMobile` (was `devMobile/ReceiversMobileDev`); own dev Redux state (`devReceiversSlice`). `receiversSlice` still carries the old mobile view's fields (`reducedVendors`, `recMobileStage`) |
| Item Lookup | `/item-lookup` | `lookup` | **done** | Option A (d4e66553) cherry-picked in first; legacy page, tablet and old desktop views removed (19 files, incl. the legacy `UpcScanner`); page moved up out of `lookup/dev/`, mobile page renamed `ItemLookupMobile`; own dev Redux state (`devItemLookupSlice`). Option A is dev-tree only now (prod keeps `LookupResultScreen`); `lookupDevView.ts` gone; promoting ships Option A |
| UPC List | `/upc-upload` | `upc` | **done** | old `UpcList` (devMode off) + 48 dead files removed; current page moved up out of `upc/dev/` as the `UpcList` entry; `ColFilter` → `components/filters/ColFilterPopover`; own dev Redux state (`devUpcDevSlice`). Fixes flag is per tree now (dev on, prod off; promoting turns it on for prod); the per-environment stash is gone — each tree has its own slice and queue |
| Forecasting | `/forecasting` | `forecast` | **done** | old `Forecasting` page (devMode off, and the tablet/phone fallback) + tablet removed; every device gets the current page; no mobile (not on the mobile nav); `ForecastDev` is now the `Forecasting` entry; own dev Redux state (`devForecastSlice`, `devForecastDevSlice`); `src/api/forecast.ts` unused but left |
| Item Report | `/item-report` | `itemReport` | | |
| Invoices | `/invoices` | `invoices` | | |
| Price Opt (Sub Dept + Vendor) | `/inventory-sub-department`, `/inventory-vendor` | `inventory` | **done (dev-only)** | Coming Soon: `dev/` tree, empty `prod/` (README) until greenlight; two guarded switchers; no page slice (session state only) |
| Sales Tracker | `/sales-tracker` | `salesTracker` | **done (dev-only)** | Coming Soon: `dev/` tree, empty `prod/` until greenlight; dead `WeekLine.tsx` trashed; own dev Redux state (`devSalesTrackerSlice`); `TrendLine` joins the dev library |
| Admin | `/admin` | `admin` | **done** | legacy page + its forms/ and the `admin` slice removed (9 files); page moved up out of `admin/dev/`; desktop only; own dev Redux state (`devAdminPageSlice`) |
| Store Groups | `/groups` | `groups` | **done** | legacy page, old forms/ and tablet removed (7 files); page moved up out of `groups/dev/`; the phone view's create/update/delete forms moved from `tablet/` to `mobile/`. page-only fields moved out of the session `group` slice into `groupsPageSlice`, forked for dev (`devGroupsPageSlice`); `groups` and `selectedGroup` stay in the shared session slice (the store picker reads them) |
| User Management | `/user-management` | `organization` | **done** | legacy Team page + `TeamTablet` removed — the whole `team/` folder (83 files) is trashed; desktop only (no tablet, not on mobile nav); own dev Redux state (`devUsersSlice`, `devBaseGroupSlice`, `devOrganizationSlice`). Settings' `TextInput` and Tickets still read prod `users` — fine until those pages split |
| Home | `/` | `home` | **skip** | login and portal only — stays as is, not split |
| Settings | `/settings` | `settings` | **skip (limbo)** | not split until it has a clear purpose; its `TextInput` reads the prod `users` slice |
| QuickSight | `/quicksight` | `quicksight` | **done** | being phased out (one user left) — split so it stays consistent until it goes; own dev Redux state (`devQsSlice`) |
| Tickets | `/tickets` | `tickets` | | **Coming Soon** (experiment on hold; nav entry, programmer-only). Own Redux state only (`ticketsSlice`, incl. its own `userLevels`) |

## Not routed — decide: split, or trash

| Folder | Notes |
|---|---|
| `team` | **trashed** with User Management's split (only its legacy page and tablet used it) |
| `priceSimulator` | **trashed** (dead, per Steve) with its slice; `utils/priceSimCalc` and `api/priceSim` stay (Forecast uses them) |
| `suggested` | route commented out in `main.tsx` |

## Leftovers to clean as pages come up

- Unused page slices (nothing live reads or dispatches them): `reportBuilder` (`suggested` is Suggested Weight's — Coming Soon, keep)

- Dead components: `SevBadge`, `SevChips`, `MobileDayStrip`, `MobileKpiStrip`, `MobileSignalRow`
- `LoadingIndicator`: dev library drops the legacy spinner — answer `--keep-lib` on promote until legacy is gone
