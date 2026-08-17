# Promar — Estimated vs. Actual Price Points (Item Analysis) Spec

> **Purpose.** Hand this to the production project so it can rebuild the "price points"
> feature inside the Promar → Product Summary → **Item Analysis** view. It captures the
> user flow, the two data sources, the exact request/response contracts, and the
> client-side math that turns raw rows into the two price-point tables.
>
> Source of truth in the sandbox: `src/components/promar/components/PromarProductSummary.tsx`.

---

## 1. The user flow (what triggers what)

1. In Promar, on a **Sub-Department tile**, the user clicks **Products**. This expands the
   `PromarProductSummary` modal (the "Product Summary" page).
2. The Products table lists every UPC in that sub-department (grouped from the already-loaded
   sub-dept **detail** rows — no new fetch).
3. The user **clicks a product row (a UPC)**. That selects the UPC and switches to the
   **Item Analysis** view.
4. Item Analysis immediately renders **Estimated Price Points** — computed *synchronously* from
   the detail rows already in memory. No network call.
5. In parallel, selecting the UPC fires a **2-step background fetch** to build the
   **Actual Price Points** table (register-level truth). While it runs, the Actual panel shows a
   loading/placeholder state; when it resolves, the exact/averaged price tables fill in.

So: **Estimated = derived from aggregated sub-dept sales rows we already have. Actual = fetched
per-transaction from the register/cashier endpoints.**

---

## 2. The two concepts

### Estimated Price Points
- **Where from:** the sub-department **detail rows** (`SubDeptDetailRow`, from `POST /subs/subs`)
  already loaded for the whole sub-dept. Filtered to `product_code === selectedUpc` and
  `sale_type === 'Sale'`.
- **What it is:** an *inferred* unit price per row = `net_sales / qty` (or `net_sales / weight`
  for weighted items), bucketed by (price, price_type). It's an **estimate** because these rows
  are daily roll-ups, not individual register lines — a "price point" is reconstructed by dividing
  dollars by units, not read directly off a receipt.
- **Cost:** free/instant, computed in a `useMemo`.

### Actual Price Points
- **Where from:** a **2-step live fetch** against the register/cashier data:
  1. `POST /cashiers/cashier_table` → the `sale_id`s (transaction ids) where this item appears.
  2. `POST /cashiers/transaction_list` → the individual line items for those transactions.
  Then filter client-side to `product_code === selectedUpc`.
- **What it is:** the *real* per-transaction register price. Single-unit transactions give the
  **exact** price a customer paid; multi-unit transactions are **averaged** (`net_sales / qty`);
  weighted items are treated as exact **$/lb** (`net_sales / weight`).
- **Cost:** two paginated network round-trips; runs in the background after UPC selection.

---

## 3. Data source & config (the URL you were missing)

The endpoints are **not gone** — they resolve through `getApiBase()`:

```
src/config/apiConfig.ts
  getApiBase() → API_URLS[mode].newApi → "https://api.counterctrlcloud.com/backend"
```

So the two calls are:

| Step | Full URL | Method |
|---|---|---|
| 1 | `https://api.counterctrlcloud.com/backend/cashiers/cashier_table` | POST |
| 2 | `https://api.counterctrlcloud.com/backend/cashiers/transaction_list` | POST |

(The old `https://api.counterctrlcloud.com/backend/cashiers/cashier_table` you had is exactly this
step-1 endpoint.)

**Auth:** every request sends
`Authorization: Bearer <accessToken>` (from Redux `auth.accessToken`), plus
`Content-Type: application/json` and `Accept: application/json`.

---

## 4. The 2-step fetch — request/response contract

Reference implementation: `loadTransactionDetail()` in `PromarProductSummary.tsx` (~L314).

### Inputs it needs before it can run
- `selectedUpc` — the clicked product's `product_code`.
- `itemAnalysis.desc` — the product **description** (this is the search key, *not* the UPC — see note).
- `accessToken`.
- Store selection → `storeIds: number[]` via `getStoreIds(storeMode, selectedStore, selectedGroup)`.
- Date window `[startDate, endDate]`:
  - `endDate = queryDate` (the toolbar anchor date).
  - `startDate` = `queryDate` minus the interval:
    - `unit === 'days'` → `-dateIntervalN` days
    - `unit === 'weeks'` → `-dateIntervalN * 7` days
    - otherwise (periods) → `-dateIntervalN * 6` days

### Step 1 — `POST /cashiers/cashier_table`

Request body (`baseBody` + page):
```json
{
  "startDate": "2026-08-04",
  "endDate": "2026-08-10",
  "useGroups": false,
  "searchValue": [1, 2, 3],          // storeIds array
  "singleStore": true,
  "saleTypes": ["description"],       // tells the API to match on description
  "searchString": "<itemAnalysis.desc>",  // e.g. "BAG ICE 7 LB" — the product description
  "page": 1
}
```

Response envelope:
```json
{
  "success": true,
  "total_pages": 3,
  "transactions": [ { "sale_id": "STORE-123456", ... }, ... ]
}
```

Handling:
- If `success === false` → bail (stop, no data).
- Collect `transactions[].sale_id`. **Paginate**: if `total_pages > 1`, fire pages `2..total_pages`
  in parallel (`Promise.all`) and concat all `transactions`.
- Dedupe into `saleIds = [...new Set(all sale_id)]`.
- If `saleIds` is empty → set actual price points to empty (`[]`) and stop.

> **Note / gotcha:** step 1 searches by **product description** (`saleTypes: ['description']`,
> `searchString: desc`), not by UPC. That can over-match (other items sharing words in the
> description), which is why **step 3 re-filters strictly by `product_code`**. If the prod API can
> search by UPC directly, that's a cleaner contract — but preserve the step-3 UPC filter regardless.

### Step 2 — `POST /cashiers/transaction_list`

Request body:
```json
{
  "transaction_ids": ["STORE-123456", "STORE-123457"],  // the deduped saleIds
  "sale_type": "Sale",
  "page": 1,
  "search_string": ""
}
```

Response envelope (same shape):
```json
{
  "success": true,
  "total_pages": 2,
  "transactions": [
    {
      "product_code": "0007700100000",
      "qty": 1,
      "weight": 0,
      "total_sales": 4.99,
      "net_sales": 4.99,
      "sale_id": "STORE-123456",
      "sale_date": "2026-08-08T00:00:00",
      "price_type": "REG",
      "storeid": 1,
      "is_discounted": 0,
      "is_coupon": 0
    }
  ]
}
```

Handling:
- If `success === false` → bail.
- Paginate the same way (pages `2..total_pages` in parallel, concat).

### Step 3 — client-side filter & normalize
Filter `transactions` to `product_code === selectedUpc`, then map to the internal `txnDetail` shape:
```ts
{ qty, weight, sales: total_sales, netSales: net_sales, saleId: sale_id,
  date: sale_date.slice(0,10), priceType: price_type, storeid,
  isDiscounted: is_discounted, isCoupon: is_coupon }
```
Store as `txnDetail`, tagged with `txnUpc = selectedUpc` so stale results for a previously-selected
UPC are ignored.

---

## 5. The math

### 5.1 Estimated Price Points (`itemAnalysis.pricePoints`, ~L227)

```
rows       = detail.filter(product_code === UPC && sale_type === 'Sale')
salesRows  = rows.filter(total_sales >= 0)      // negatives are coupons/discounts, excluded
isWeighted = salesRows.some(weight > 0)

for each salesRow:
  unitPrice = isWeighted && weight>0 ? round2(net_sales / weight)
            : qty>0                  ? round2(net_sales / qty)
            : net_sales
  bucket key = `${unitPrice}|${price_type||'REG'}`
  accumulate into bucket: qty, weight, sales(total_sales), netSales, costTotal(lineCost), dates(set of sale_date)

pricePoint = { price, priceType, qty, weight, sales, netSales, daysSeen: dates.size,
               margin: netSales>0 ? (netSales - costTotal)/netSales*100 : 0 }
sort by sales desc
```
- `lineCost(r)` is the canonical COGS from `utils/costCalc.ts` (weight/case-size aware).
- Displayed columns: **Price / Type / Qty / GM% / Days**.

### 5.2 Actual Price Points (`actualPricePoints`, ~L390)

```
txnIsWeighted = txnDetail.some(weight > 0)

if weighted:
  singleUnit = txnDetail.filter(netSales > 0)         // every row → exact, using $/lb
  multiUnit  = []                                     // no averaged bucket for weighted
else:
  singleUnit = txnDetail.filter(netSales > 0 && qty === 1)   // exact register price
  multiUnit  = txnDetail.filter(netSales > 0 && qty > 1)     // needs averaging

EXACT (from singleUnit), bucket by (price, priceType):
  price = weighted ? round2(netSales / weight) : round2(netSales)
  accumulate trans(count), qty, weight, sales
  sort by trans desc

AVERAGED (from multiUnit), bucket by (avgPrice, priceType):
  avgPrice = round2(netSales / qty)
  accumulate trans, qty, weight, sales
  sort by trans desc

return { exact, averaged, singleCount, multiCount, isWeighted }
```
- **Exact table** columns: Price (or $/lb) / Type / Trans / Qty / Total$ (or Wt). Badge:
  `Exact · N trans` (or `$/lb · N trans`).
- **Averaged table** columns shown when `multiCount > 0`. Badge: `Avg · N trans`.

### 5.3 Pricing-pattern classification (optional, but part of the feature)
Once both `actualPricePoints` and `mixedPriceInsight` exist, the view classifies the item's pricing
behavior (each is a collapsible callout). Thresholds (~L836):

- `priceVolatilityPct = distinctPrices / totalTrans * 100`
- `mixedPct = mixedTxns / uniqueTxns * 100` (same item, different prices, same receipt)
- `multiQtyPct = multiCount / totalTrans * 100`
- **Package Deal** — `mixedPct >= 30 && multiItemTxns > 0`
- **Multi-Buy** — not package && `topPricePct >= 50 && multiQtyPct >= 50`
- **Multiple/Variable Prices** — `priceVolatilityPct > 50 && mixedPct < 30`
  - `> 90%` variation **with** weight data → *By-the-pound* (expected, not a problem)
  - `> 90%` variation **without** weight → *Verify pricing method* (scale/PLU issue)
  - else → *Highly Subjective Pricing* (genuinely inconsistent, needs review)
- **Promotion / Package split** — mixed prices within 5% / < $0.50 spread on the same receipt

`mixedPriceInsight` (~L430) groups `txnDetail` by `saleId`, computes per-line `unitPrice`, and flags
sale_ids that contain the same item at **more than one distinct price**.

---

## 6. State machine & guards (don't skip these)

- `txnUpc` tracks which UPC the fetched `txnDetail` belongs to. Every derived memo checks
  `txnUpc === selectedUpc` before using the data — this prevents showing stale actuals when the user
  clicks a different product before the fetch resolves.
- Auto-load effect (~L367): fires `loadTransactionDetail()` when
  `selectedUpc && itemAnalysis && !txnDetail && !txnLoading && txnUpc !== selectedUpc`.
- Empty results are stored as `[]` (not `null`) so the UI shows "no actual data" rather than a
  perpetual spinner.
- The Actual panel **always reserves layout space** so estimated/actual sit side-by-side without
  the modal jumping as data streams in.

---

## 7. Minimum contract the prod backend must provide

To rebuild this you need an endpoint pair equivalent to:

1. **"Find transactions for an item"** — given `{ store ids, date range, item identifier }`, return
   the set of `sale_id`s (paginated, with `success` + `total_pages`).
2. **"Get line items for transactions"** — given `{ transaction_ids, sale_type: 'Sale' }`, return the
   per-line rows with **at minimum**: `product_code, qty, weight, total_sales, net_sales, sale_id,
   sale_date, price_type, storeid, is_discounted, is_coupon`.

Everything else (both price-point tables, margins, and the pattern classification) is **pure
client-side math** on those rows — no additional endpoints required.

If the prod API can match step 1 by **UPC** instead of description, take it; otherwise pass the
product **description** as `searchString` with `saleTypes: ['description']` and keep the step-3
`product_code` filter.
