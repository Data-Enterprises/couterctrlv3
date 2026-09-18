# Dev/prod UI split — page tracker

Per page: `npm run split:page -- <page> --dry` → split → cut tablet/legacy →
trash dead files → `tsc -b` + `npm run check:split -- <page>` → commit.
Promote later with `npm run promote:page -- <page>` once dev is signed off.

Status: **done** · **next** · blank = not started

## Shared units — split these before the pages that use them

| Unit | Used by | Status | Notes |
|---|---|---|---|
| `shared/itemPerf` | Categories, Vendors, Sub Dept Margins (mobile) | next | dry run clean; tested in a worktree |
| `shared/eventPerf` | Loss Prevention, Coupon Sales (mobile) | **done** | LP/coupon adapters moved to `src/api/eventPerf/`, `clockOf` to `utils/dates` |

## Pages

| Page | Route | Folder | Status | Notes |
|---|---|---|---|---|
| Sales | `/sales` | `sales` | **done** | legacy Sales + `salesLegacy`/`salesMobile` state removed; prod `Sales.tsx` still has commented legacy (a promote cleans it) |
| Categories | `/categories` | `categories` | | after itemPerf; dry run clean |
| Vendors | `/vendors` | `vendors` | | after itemPerf |
| Sub Dept Margins | `/sub-dept-margins` | `subDepts` | | after itemPerf; has tablet + old `dev/`; `subDepts/index.ts` re-exports cogs/dates helpers until split |
| Coupon Sales | `/coupon-sales` | `couponSales` | | after eventPerf (done); dead `mobile/` folder already trashed with LP |
| Loss Prevention | `/loss-prevention` | `lossPrevention` | **done** | legacy page + `lossPreventionLegacy` state and tablet removed (35 files to trash); `lossPrevention` slice stays shared (Coupons, Coupon Sales, `Transaction` read it); `TransactionModal` is a switcher Coupons still uses
| Coupons | `/coupons` | `coupons` | | legacy branch; imports LP's `TransactionModal` |
| LP Actions | `/lp-actions` | `lpActions` | | |
| Cashiers | `/cashiers` | `cashiers` | | legacy branch |
| Orders | `/orders` | `orders` | | legacy branch; tablet |
| Receivers | `/receivers` | `receivers` | | legacy branch; tablet |
| Item Lookup | `/item-lookup` | `lookup` | | legacy branch; tablet; has old `dev/` (mobile Option A) |
| UPC List | `/upc-upload` | `upc` | | picks `UpcListDev`/`UpcList` by devMode; apiEnv stopgap flag to remove |
| Forecasting | `/forecasting` | `forecast` | | picks `ForecastDev`/`Forecasting` by devMode; tablet |
| Item Report | `/item-report` | `itemReport` | | |
| Invoices | `/invoices` | `invoices` | | |
| Inventory (Sub Dept + Vendor) | `/inventory-sub-department`, `/inventory-vendor` | `inventory` | | two entries, one folder |
| Sales Tracker | `/sales-tracker` | `salesTracker` | | |
| Admin | `/admin` | `admin` | | legacy branch; already routes to `admin/dev` |
| Groups | `/groups` | `groups` | | legacy branch; tablet; already routes to `groups/dev` |
| User Management | `/user-management` | `organization` | | legacy branch is `team/TeamLegacy`; imports tablet `TeamTablet` |
| Home | `/` | `home` | | |
| Settings | `/settings` | `settings` | | |
| QuickSight | `/quicksight` | `quicksight` | | |
| Tickets | `/tickets` | `tickets` | | prototype; slice + mock data live in the page |

## Not routed — decide: split, or trash

| Folder | Notes |
|---|---|
| `team` | only reached through Organization (legacy + `TeamTablet`) |
| `priceSimulator` | no route; calc now in `utils/priceSimCalc` |
| `suggested` | route commented out in `main.tsx` |

## Leftovers to clean as pages come up

- Dead components: `SevBadge`, `SevChips`, `MobileDayStrip`, `MobileKpiStrip`, `MobileSignalRow`
- `sales/mobile/index.ts` (`PieData`, legacy Orders only)
- `LoadingIndicator`: dev library drops the legacy spinner — answer `--keep-lib` on promote until legacy is gone
