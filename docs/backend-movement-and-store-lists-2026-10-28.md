# Backend plan: UPC movement, faster UPC queries, and searching a list of stores

**Date:** 28 Oct 2026
**For:** a session working in `C:\backend\goliath-platform`.
**From:** the frontend session (`C:\JSDev\couterctrlv3`).

Three pieces, from one client request. Each stands alone, so they can land in
any order. B changes figures on screen, so it waits for Steve's go-ahead.

| | What | Endpoints touched |
|---|---|---|
| **A** | `POST /marketing/upc_movement`: units or weight per store per week ending | one new one |
| **B** | Make the existing UPC List queries use the indexes | `upload_upcs_daily_sales` and the other `marketing` UPC endpoints |
| **C** | Let any search name an explicit list of stores | the 18 endpoints that go through `get_storeids()` |

Plus two access checks found on the way (**D**), which Steve should hear about
whichever of the above is taken.

Everything below was read against the code at `703fa01`. Line numbers are
approximate.

## How to work this

- One commit per letter. In C, the helper change and the model fields can be one
  commit; the guard cleanup (C3) is its own.
- Don't deploy. Steve deploys.
- When something lands, fill in its row of the **Handback** table at the bottom
  with the exact request and response. The frontend is built to what is written
  there, not to this plan.

---

## Why

Houchens' IT lead (Amanda) forwarded a request from a store user:

> Movement for stores 20, 21, 442, 449, 450, 452, 453, 460, 461, 463, 464, 445,
> 447, 465 for UPC 28617700000, for weeks ending 9/19, 9/26, 10/3, 10/10,
> 10/17, 10/24. One total for each store each week.

CounterCtrl can't answer it. UPC List searches a group, but every UPC endpoint
adds the stores together. In `Processor.daily()` (`api/processor.py` ~367) the
query reads `store_number`, then groups by `product_code, description, week,
weekday` and drops it. It also returns dollars only, and buckets weeks
Monday–Sunday, while those weeks end on Saturdays.

She also asked to pick several stores on the fly without building a group
first, on every page. That is C.

---

## A. `POST /marketing/upc_movement`

On the `marketing` router, beside the other UPC endpoints. A JSON body, not a
form: there is no file upload here.

### Request

```json
{
  "storeids": [101, 102, 140],
  "upcs": ["28617700000", "1200000088"],
  "weekEnding": "2026-10-24",
  "weeks": 6
}
```

- `storeids`: explicit, as the other marketing endpoints take them. UPC List
  already turns a group into store ids before it calls. **Check them against
  the user's stores** (the `_export_storeids` rule in `sales.py` ~1272: 403
  naming the stores refused). The existing marketing endpoints don't do this;
  see D.
- `upcs`: digits only, without the `.0` suffix. Cap it at whatever the other
  marketing endpoints allow, and answer 400 above that.
- `weekEnding`: the last week ending in the window. **Weeks end on that
  weekday.** A Saturday gives Sunday–Saturday weeks, which is what Houchens
  uses. The frontend picks the date, so no per-company setting is needed.
- `weeks`: 1–26. 400 outside that.

The window is `weekEnding - 7*weeks + 1` through `weekEnding`, both whole days.
Mind `sale_date` being a timestamp: use `>= start and < weekEnding + 1 day`.

### What it counts

Movement is **units, or pounds for a weighed item**. No dollars. That is
deliberate: it is what the covering index holds (below).

- **Lines:** Sale and Refunded item lines only, which is exactly the
  `idx_sales_report_covering` predicate.
- **Refunds subtract.** They are stored positive (the comment on
  `SalesExportRequest` says so). Please use the same netting the shared
  line-sales shape in `subs.py` uses, so a store's movement here agrees with
  its qty on Sub Dept Margins.
- **Weight:** in pounds via `WEIGHT_LBS` (`processor.py` ~54), which divides by
  the store's divisor. Raw `s.weight` is not pounds for every store.
- **Week ending:** `weekEnding - 7 * floor((weekEnding - sale_date::date) / 7)`.

Return both qty and weight. The frontend shows pounds for an item with weight
and units otherwise, as UPC List's export already does.

### The query has to hit the covering index

```
idx_sales_report_covering ON sales (storeid, sale_date)
  INCLUDE (product_code, product_description, qty, weight)
  WHERE sale_type IN ('Refunded','Sale') AND item_ring_type = 'ITEM'
```

Everything this endpoint reads is in that index, so Postgres can answer it
with an index-only scan and never touch the table, as long as:

1. The `WHERE` repeats the index predicate **exactly**:
   `sale_type IN ('Refunded','Sale') AND item_ring_type = 'ITEM'`. A partial
   index is only considered when the query implies its predicate.
2. Codes are matched with `product_code = ANY(:codes)`, where `:codes` holds
   each UPC **both bare and with `.0`** (`28617700000`, `28617700000.0`).
   **Not** `replace(s.product_code, '.0', '') = ANY(...)`, which the other
   marketing queries use: wrapping the column in a function stops any index on
   it being used.
3. The totals are done in SQL (`GROUP BY storeid, product_code, week_ending`).
   Nothing goes through pandas.
4. It reads `sales` (or `sales_partitioned`, which is a plain `SELECT *` view
   over it).

`WEIGHT_LBS` needs `stores` joined for the divisor. That is a lookup per store,
not per line, so it doesn't spoil the scan.

**Please check it:** run `EXPLAIN (ANALYZE, BUFFERS)` on the Houchens example
(14 stores, 1 UPC, 6 weeks) and on 26 weeks. Paste both plans' top lines and
timings into the Handback. We expect `Index Only Scan using
idx_sales_report_covering`. If it isn't, say so rather than tuning around it.

### Response

```json
{
  "error": 0,
  "success": true,
  "weekEndings": ["2026-09-19", "2026-09-26", "2026-10-03", "2026-10-10", "2026-10-17", "2026-10-24"],
  "stores": [{ "storeid": 101, "store_number": "20", "store_name": "…" }],
  "rows": [
    { "storeid": 101, "product_code": "28617700000", "description": "…",
      "week_ending": "2026-10-24", "qty": 31, "weight": 84.62 }
  ]
}
```

- `weekEndings`: every week in the window, oldest first, **including weeks with
  no sales**. The grid needs its columns even when a cell is empty.
- `stores`: every requested store the user may see, including ones with no
  rows, so an empty row still shows in the grid.
- `rows`: only combinations that sold. `product_code` is returned without
  `.0`. `description` is `max(product_description)` for the code.
- No rows at all: `success: true` with an empty `rows`. Please don't use the
  `error: 1, "No data was returned."` shape the other marketing endpoints use:
  "nothing sold" is an answer here, not a failure.

---

## B. Make the existing UPC List queries use the indexes

Separate commits. **The first changes figures that are on screen**, so tell
Steve what moves before it ships.

### B1. Sales Comp: `Processor.daily()` (~367)

It reads **every line of every store** in the range into pandas (no product
filter, no sale-type filter), then keeps the UPCs (`ds[ds['product_code'].isin(...)]`,
~434) and totals by week and weekday. The cost grows with the stores' whole
trade, not with the size of the UPC list.

- Filter and total in SQL. Match codes with `= ANY(:codes)` plus the `.0`
  variants, as in A.
- **It has no sale-type filter**, so voided and refunded lines are counted as
  sales, and refunds are stored positive. Adding the
  `sale_type IN ('Refunded','Sale') AND item_ring_type = 'ITEM'` predicate (with
  refunds netted) is what lets it use `idx_sales_report`. **That changes the
  numbers Sales Comp shows.** Please check a store and week against Sub Dept
  Margins before and after, and put the difference in the Handback.
- It sums `total_sales`, which isn't in the covering index, so expect
  `idx_sales_report (storeid, sale_date, product_code, price)` followed by a
  heap fetch. That's fine: it is the UPCs' rows only, not the whole store's.
- Keep the response shape. The frontend reads `product_code, description,
  week, Monday…Sunday`.

### B2. The `replace()` matches

These match with `replace(s.product_code, '.0', '') = ANY (:upcs)`:
`processor.py` ~340, ~514, ~579 and ~642. Same fix: `s.product_code =
ANY(:codes)` with both forms of each code.

Before relying on the index, check whether each query also carries the
sale-type predicate. If one deliberately counts other line types, leave its
filter alone and just fix the code match. No figure should move in B2; if one
does, stop and say which.

---

## C. Search a list of stores

**Superseded** by `backend-storeids-everywhere-2026-10-28.md`, which sends a
list as a group search and so needs no guard rewrite (C3). Kept for the
record.

Today a search is one store (`singleStore=1, searchValue=<storeid>`) or one
group (`useGroups=1, searchValue=<groupid>`). This adds a third: an explicit
list.

### C1. One helper: `get_storeids()` (`api/utils.py` ~159)

Every endpoint below turns the search into stores through this one function.
Fold `_export_storeids` (`sales.py` ~1272) into it:

```python
async def get_storeids(payload, userid, db):
    if getattr(payload, "storeids", None):
        # the _export_storeids rule: only stores this user holds; 403 naming
        # the ones refused rather than quietly dropping them
        ...
    if payload.singleStore:
        ...
    elif payload.useGroups:
        ...
```

Then `_export_storeids` becomes a plain call to it, or goes. `getattr`,
because not every payload model will have the field.

**Use the same access rule the group path uses.** `GROUP_STOREIDS` checks
`assigned`. If the access work in the User & Store Access handoff has changed
what "may see" means, use that instead, and use it on all three paths.

### C2. The field, on 18 request models

Add `storeids: Optional[List[int]] = None` to each model whose endpoint calls
`get_storeids()`:

| Router | Models |
|---|---|
| `cashier_anomalies.py` | `CashierRequest`, `CashierRequestPaged`, `ProductLookupRequest` |
| `cashiers.py` | `CashierRequest`, `CashierRequestPaged`, `ProductLookupRequest`, `ExceptionLinesRequest` |
| `cats.py` | `CatsRequest`, `CategoryRequest` |
| `coupons.py` | `CouponRequest` |
| `hourly.py` | `HourlySalesRequest` |
| `sales.py` | `WeeklyRequest` (`/weekly`, `/daily`), `SalesExportPreviewRequest` (`SalesExportRequest` has it already) |
| `subs.py` | `SubsRequest`, `ItemActionsRequest`, `SubDepartmentRequest`, `SubsDailyRequest`, `RollupRequest` |

All of these are POST bodies, so the list is plain JSON.

Not in scope: `SalesTrackerRequest` (`subs.py` ~1456) resolves its own stores
inline, and `SalesTwoDatesRequest` / `ItemsAndPricesRequest` carry `useGroups`,
but I couldn't find an endpoint that takes them. Leave all three; the frontend
won't offer a store list on those pages yet.

### C3. The guards

About 23 endpoints repeat the same two checks inline (47 lines in all):

```python
if payload.singleStore and payload.useGroups: raise HTTPException(400, "You cannot specify both useGroups and singleStore")
if not (payload.singleStore or payload.useGroups): raise HTTPException(400, "You must specify either singleStore or useGroups")
```

The second one would reject a store-list search. Please replace the pair with
one helper beside `get_storeids` that accepts exactly one of the three ways,
and call it in each endpoint. It's a separate commit because it touches every
endpoint and should change nothing else.

### C4. What must not change

A caller that sends no `storeids` gets exactly what it gets today. Every
current page works unchanged until it starts sending the list. The frontend
turns the list on page by page.

---

## D. Two access checks (for Steve)

From reading only the code named here. If something upstream (middleware, a
dependency) covers these, say so and close them.

1. **A single store isn't checked against the user.** `get_storeids()` returns
   `[payload.searchValue]` for `singleStore` as-is, and `/sales/weekly` (~440)
   goes straight from there to the query. The group path checks `assigned`; the
   single-store path doesn't. C1 is the natural place to make all three
   consistent.
2. **The marketing UPC endpoints take a raw `storeids` string**
   (`Processor._convert_storeids`, ~116) and nothing in `marketing.py`
   mentions `assigned`.

Either would let a signed-in user read sales for a store that isn't theirs by
sending its id. Fix them in a separate commit from A–C, so the fix can ship on
its own.

---

## Handback

Fill in as each lands.

| Item | Commit | Exact request / response, or what changed | Notes (EXPLAIN, figures that moved) |
|---|---|---|---|
| A. `upc_movement` | | | |
| B1. Sales Comp in SQL | | | |
| B2. `replace()` matches | | | |
| C1–C2. `storeids` | `8250b38` (item_actions only) | `get_storeids()` takes an explicit list first, checked against `assigned` (403 naming refused stores); `ItemActionsRequest.storeids: list[int] \| None`. Other models not yet given the field. | 14 Houchens stores, 9/13–10/24, UPC 28617700000: one call 72 rows in 2.11s, identical to 14 single-store calls (5.81s). Movement sends this list. |
| C3. guards | | | |
| D. access checks | | | |
