# Dev board review — plan, 22 Oct 2026

Response plan for `dev-board-review-2026-10-21.md` (Tommy's agent, DEV mode,
store 695 / #361, week ending 10/20). Every numbered and lettered finding is
placed below exactly once. Each was checked against the code on
`next_publish_10_20_2026`; where the review's diagnosis or suggested fix is
wrong, this says so.

**Where things live.** Price Opt Sub Dept / Vendor = `src/pages/inventory/dev/`
(the actual-price maths is `src/utils/pricePoints.ts`). Item Actions =
`src/pages/itemReport/dev/`. Not to be confused with the UPC List's Price Opt
module in `upc/*/modules/priceOpt`.

**The dev build they tested is dated 10/12.** Several findings are already
moved by commits not yet deployed to dev. Redeploy before the next run.

---

## 0. Already settled — no work

| # | Finding | Why it is settled |
|---|---|---|
| — | Hourly fetched twice | Reviewer confirms fixed on dev; `8fefe4d8` brings prod level |
| AC, AH | Store scope (issue 4) | Withdrawn by the reviewer — confirms our response doc |
| AA | SDM headline LW −5.29 (prod) vs −5.50 (dev) | Dev already skipped departments with no comparison; prod did not. **Both move again** with `b5595d61` (weighted margin) and then agree with Vendors to the cent. Release-note it |
| Z | Vendors Crit 4 (prod) → 1 (dev) | Prod is wrong (SMR "−30.30 pts" should be +3.58); dev is the fix. Release-note: the Crit count drops |
| AJ | `users/` returns 261 KB | Frontend half done in `31690c22` — the page hides users outside your companies. The endpoint still over-returns (B6) |
| 3 | Top 200 asks for 500 to show 200 | Deliberate, documented in `src/api/topItems.ts`: the endpoint doesn't rank by sales, so the first 200 it returns aren't the top 200 by sales, and LW/LY rank history needs the wider pool. Real fix is server-side (B4) |
| V | Item Lookup handles by-weight items correctly | Not a fault — the reference for A: $4.34/lb sold, $2.90/lb cost, 31.96%. It reads `items/itemlookup`, which carries weight |
| AM, AR | What works well | — |

---

## 1. Blockers

### AN — Tickets: customers see other companies' tickets  **(data leak)**
User 649 (company 3, `canViewAll: false`) was sent 15 company-1 tickets.
- **Server (the real fix):** `GET tickets/` ignores `canViewAll` when it
  filters (B2).
- **Frontend, belt and braces:** `visibleTickets` in
  `tickets/dev/ticketsUtils.ts` filters by tab, search and filters — **no
  company check at all**, so it renders whatever arrives. When `canViewAll`
  is false, keep only the viewer's own company. Small.
- Re-test with a level-5 account.

### AG — Add user autofills the admin's own login  **(raise first)**
Confirmed, and slightly bigger than "add an attribute": neither
`components-dev/inputs/Input.tsx` nor `PasswordInput.tsx` forwards
`autoComplete`. So:
1. Add an optional `autoComplete` prop to both, passed to the `<input>`.
2. In `organization/dev/users/create/UserFields.tsx`: `"off"` on username and
   email, `"new-password"` on password and confirm.
3. Same on `users/view/SecurityTab.tsx`, the only other `PasswordInput` user.

`Input` is used widely, so the prop defaults to nothing and changes no other page.

### A — By-weight items: per-pound prices on the left, package totals on the right  **(Crit for Price Opt)**
The review's diagnosis is right in effect but not in cause, and the cause
decides the fix.

`src/utils/pricePoints.ts` decides an item is weighed **differently on each
side**:
- **Estimated** (`estimatedPricePoints`): weighed if any `subs/subs` row has
  `weight > 0`. Ground Beef Fam Pak does, so its prices are per pound — $3.49,
  $6.49.
- **Actual** (`actualPricePoints`): weighed if any register line has a
  **fractional qty**, because `transaction_list` returns no weight column.
  That catches scale-at-register items. It **misses prepacked random-weight
  items** — UPC prefix 2, price embedded in the barcode — which scan as qty 1
  per package with the package total as the amount. So every package total
  becomes its own "price": 146 of them, "moves fastest at $11.94", and a 75%
  margin against a per-pound cost.

The fix has two halves:
- **Now (frontend):** take the weighed flag from the `subs/subs` rows, which
  know, and pass it into `actualPricePoints` instead of inferring it. Then,
  when an item is weighed but its register lines carry no weight, **hide the
  recommendation strip and say why**: "Sold in random-weight packs; receipts
  don't carry the weight, so actual prices can't be compared per pound." That
  stops anyone acting on a wrong number.
- **Properly (backend, B3):** per-pound actual prices need each line's weight.
  `transaction_list` has to return it. Nothing in the browser can recover it —
  a price-embedded barcode encodes price, not weight.

---

## 2. Root causes behind several findings

### Sales basis — E, X  (very likely a one-line fix)
Same item, same week: Price Opt $5,295.84 / $927.98; Top 200 and Item Lookup
agree at $4,980.58 / $868.66. Price Opt is 6–7% high.

`groupProducts` in `inventory/dev/inventoryData.ts` sums **`total_sales`**.
Sub Dept Margins and Vendors read the **same `subs/subs` rows** and use
**`total_sales − total_tax`** — the house rule. 6–7% is the size of a tax
line. Its own comment says it is meant to agree with Sub Dept Margins; it
doesn't, because of this.
- Confirm with one query (UPC 20000300000, 10/14–10/20: sum `total_sales` and
  `total_tax` from `subs/subs`), then net the sum. One line.

### Cost basis — O, W
COKE 6PK: Item Actions uses the invoice cost, $3.13; Price Opt and Item
Lookup use the item-file cost, $4.91, which Item Lookup shows is stale ($4.50
until 10/12, $4.91 after, against a $3.13 invoice on 10/16). So Price Opt
calls a $3.33 sale "below cost" when it isn't.
- **Decision (Steve):** which cost a pricing page uses — item file, latest
  invoice, or invoice with item file as fallback. Item Actions' choice is
  the defensible one.
- The stale item file itself is the store's data, not code.

### Over-fetching — D, I, K
- **I — frontend fix available.** `fetchVendors` in `inventoryData.ts` fires
  one `subs/subs` per department through `Promise.all` — 26 at once. The
  Vendors performance page already reads every department in one paged call
  with `sub_department: 0` (`vendors/dev/vendorsData.ts`). Do the same here:
  26 calls become a handful of pages. **Bytes stay about the same** — the
  real cut is the server rollup (B1).
- **D — the review's fix won't work.** It suggests fetching receipts only on
  "Show transactions". But the receipts **build the right-hand price table**
  (`actualPricePoints(lines, …)` in `ItemAnalysisPanel.tsx`), which is on
  screen as soon as an item is picked. Deferring them empties that table.
  The real fix is a server-side price-point aggregate (B3 covers the same
  endpoint); until then, accept the cost.
- **K:** Price Opt doesn't keep its result; leaving and returning refetches.
  The page holds results in component state (`useState` in `InventoryVendor` /
  `InventorySubDept`). Move them into a slice, like the older pages.

---

## 3. Frontend, by page

### Top 200
| # | Fix |
|---|---|
| 1 | "+13.1%" beside last week's share is **points**. Label it "+13.1 pts" |
| 2 | Item name and sub-dept line truncate once the item panel opens. Same family as `03844b4d`: give the name a floor, let the unit count drop first |

### Price Opt (Sub Department and Vendor)
| # | Fix |
|---|---|
| H | **Confirmed.** `toggleVendor` in `InventoryVendor.tsx` changes the open vendor but never clears `selected` or the actual-price state. Clear both when a different vendor opens. Two lines |
| B | "Moves fastest" rests on one day. Require a minimum of days and sales behind it, else say "not enough history". $3.33/$3.34 count as two prices — merge sub-cent neighbours from the same multi-buy |
| C | TRANS counts item lines, not receipts (`trans += 1` per line in `pricePoints.ts`). Count distinct receipt ids |
| J | "Filter vendors and items" doesn't search items. Everything is loaded after Load vendors; search item names and UPCs too |
| G | Mixed amount formats in the tree ($25.1K / $758.3 / $674) — one formatter. "Heath and Beauty Aids" is the store's own data |
| F | Training: the action is the "› 26" number in the Trans column. Board wording, no code |

### Item Actions
| # | Fix |
|---|---|
| L | **Board check fails.** Yesterday's deliveries are called Investigate. Don't judge a delivery before its usual interval (the panel knows "usually every 4"), minimum two days. Body Armor may still deserve Investigate — but for its seven flat days before, so give that reason |
| M | Banner says Reorder can't be judged without an invoice, then shows T-Bone as Reorder (from a sales gap, a good signal). Reword the banner, or label those "possible out of stock" |
| N | "Nothing left of the last delivery" ignores stock from before it (White Wheat Round Top, NET +7). Use the running net |
| P | **Not the same bug as A.** Item Actions is weight-aware: its margin uses `calculateCogs(…, weight)` and its units are pounds. 65.9% on Fam Pak Breast Tenders needs a look at that item's rows — if they carry weight 0 with a per-pound cost, cogs is understated. Check before fixing anything |
| Q | "VS LW" is units here, dollars on Top 200. Label it "VS LW (units)" |
| R | "Insufficient" sits in no pile, so it can't be filtered to — give it one. "1 days ago" → "1 day ago". Show cases beside units so it matches Receivers |
| S | Build adds to the previous UPC list. Add a Clear, or replace by default |
| T | No last-year data for 695, so seasonality can't apply. Say so when LY is absent |

### Item Lookup
| # | Fix |
|---|---|
| U | Desktop is unchanged in DEV because the update is the phone flow. **Tell Tommy**; review on a phone sign-in. Not a bug |
| Y | Unknown UPC: "No item with that UPC at this store". Enter in the UPC box should search, not add a line — scanners send Enter |

### Groups and User Management
| # | Fix |
|---|---|
| AB | Groups is a renamed page with two new tabs and a new idea. **Board card and training, not code** |
| AK | Store ticked with its base group unticked: Continue enabled, review contradicts itself. Ticking a store should tick its group; counter and summary must agree. Check what Create would save in that state |
| AL | Review shows role "1" — show the role name |
| AI | Button says **New**, board says **Add user**. Rename the button to "Add user", matching the form title |

### Help
| # | Fix |
|---|---|
| AE | Item Actions and Price Opt still open the old Coming Soon modal. Move them to the new help panel. Correct the Coming Soon doc too: the suggested price is the blue strip at the **top**, and "a left price with no right counterpart never existed" is false for weighted items (finding A) |
| AD | Guide steps that need the closed search card should open it, or start with "Click the magnifying glass" |
| AF | Eight glossary terms with no Show me — confirm each has nothing to point at |

### Tickets (besides AN)
| # | Fix |
|---|---|
| AO | **Confirmed.** `whenText` and `stampText` in `ticketsUtils.ts` do `new Date(iso)` on a zone-less UTC string, which JavaScript reads as local time. And `whenText` turns any negative age into "just now" — why recent tickets show "just now". One `parseServerTime` helper that treats a zone-less stamp as UTC, used by both. Ask the API for a `Z` too (B7) |
| AQ | `tickets/assignees` 403s on every customer load. `tickets/dev/hooks.ts` skips the `canManage` gate on purpose so the call doesn't wait on the list; the cost is a console error for every customer. Gate it on `canManage` once the list has landed |

---

## 4. Backend asks (Dylan)

| # | Ask | From |
|---|---|---|
| B1 | Aggregate companion to `subs/subs`: one read per window grouped by vendor and by sub dept | I, issue 3 |
| B2 | `GET tickets/` must honour `canViewAll` | **AN — blocker** |
| B3 | `transaction_list` returns each line's weight, so prepacked random-weight items can be priced per pound. Better still, a server-side actual-price aggregate, which also fixes D | A, D |
| B4 | `sales/topitems` ordered by `total_sales` | 3 |
| B5 | New-ticket notification — `notified: 0`. Who should hear about an unassigned ticket? | AP |
| B6 | `users/` scoped to the caller's companies | AJ |
| B7 | Ticket timestamps with a zone (`…Z`) | AO |
| B8 | `items/itemlookup` returns `vendor_id` (and `case_size`). Order editing adds lines, `vendor_id` is `NOT NULL` on the order, and the lookup returns neither — so the vendor is picked by hand from the ones already on that store's orders, and `casesize` defaults to 0 while it drives the cost recompute. Sub department is **not** wanted: the column is nullable and the import and POS classify the line | Order editing |

---

## 5. Decisions for Steve

1. **Cost basis for pricing pages** — item file, latest invoice, or invoice
   with fallback (O, W).
2. **AN blocks teaching the help desk** until B2 lands. Agree?
3. **Vendor switch (H)** — clear the panel (recommended) or keep it and reword
   the board.

---

## 6. Order of work

1. **AG** — `autoComplete` through `Input` / `PasswordInput`, then the two
   forms. Small; raise first.
2. **AN** — frontend company filter, and B2 to Dylan. Re-test at level 5.
3. **A (now)** — weighed flag from the rows, hide the strip and explain. Then
   B3 to Dylan.
4. **E** — run the query; net the sum in `groupProducts`.
5. **H, AO, AQ, 1, AI, AL, Y** — small and independent; an afternoon together.
6. **I** — `sub_department: 0` on Price Opt Vendor.
7. **K, J, C, B, G** — Price Opt behaviour.
8. **L, M, N, Q, R, S, T** — Item Actions rules. Each rule needs thinking
   through, not just coding. **P** checked first.
9. **AK, 2** — the form gap and the truncation.
10. **O** — once the cost decision is made.
11. **AE, AD, AF** — help content, last, once the screens stop moving.
12. **Redeploy dev** and send Tommy the list of what moved.

Board and training wording only, no code: **F, AB, U**, plus release notes
for **Z** and **AA**. **D** waits on B3.
