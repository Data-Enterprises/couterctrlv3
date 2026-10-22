# Backend game plan — dev board review, 22 Oct 2026

**For:** a session working in `C:\backend\goliath-platform`, branch `branch_10_20_2026`.
**From:** the frontend session that worked the dev board review (`docs/dev-board-response-2026-10-22.html` in `C:\JSDev\couterctrlv3`).

The frontend side of the review is done. What's left needs the API. Every item
below was checked against the code on `branch_10_20_2026`; line numbers are
approximate and the quoted code is what to look for.

## How to work this

- One commit per item, so any one can be reverted.
- Don't deploy. Steve deploys.
- When an item lands, record it in the **Handback** table at the bottom: the
  commit, and the response shape exactly as it now comes back. The frontend
  follow-ups are written against these contracts. If you change a field name
  or unit, say so there, because the frontend will be built to what's written.
- Items are in priority order. Tier 1 should go first and alone.

---

## Tier 1 — security, before anything else

### 1. `/auth/login` signs anyone in as anyone when `ov` is set

**Where:** `api/routers/auth.py`, the login handler (around line 53).

**Now:**
```python
if data.ov == 0:
    hashed_bytes = hashlib.sha1(data.password.encode("utf-8")).digest()
    ...
    if not verify_password(user["password"], hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

access_token = create_access_token({"sub": user["username"]})
```
Any request with `"ov": 1` skips the password check and gets a token for the
username it names, any level, including 9. The frontend's only gate is a
username/password compared in the browser bundle (`Login.tsx`), so the secret
is public, and a request can set `ov` without the frontend at all. This has
been on `origin/prod` since the initial commit (50a3b28, May 2026).

**Change:**
- Remove the `ov` branch. `/auth/login` always checks the password.
- Remove `logger.info(f"access_token: {access_token}")` in the same function.
  It writes every session token to the log.
- Support still needs "sign in as". Add it as its own endpoint that requires
  an existing session:
  `POST /auth/impersonate` with body `{ "username": "<target>" }` and the
  caller's bearer token. Allowed only when the caller is level 9. Returns exactly what `/auth/login` returns, for the
  target user. Logs who impersonated whom, without the token.

**Decided (Steve, 22 Oct): level 9 only.** DCR support does not get
impersonation, even though the frontend lets them see every company. A caller
below level 9 gets 403.

**Ship both changes together.** Removing `ov` alone takes away support's
sign-in-as with nothing to replace it.

**Check:**
- `POST /auth/login` with a real username, a wrong password and `"ov": 1`
  returns 401.
- `POST /auth/impersonate` without a token returns 401, and with a level-5
  token returns 403.
- No access token appears in the log after a sign-in.

**Frontend follow-up:** take the hardcoded check and the impersonate
checkbox out of the sign-in page. Add "Sign in as…" for level 9 after
sign-in, calling the new endpoint.

### 2. `users/` sends every user's password hash and security answer

**Where:** `api/routers/users.py`, `get_users` (around line 17).

**Now:** `SELECT u.*, …` returns every column of every user to any signed-in
caller, including `password` (the SHA-1 hash) and `security_answer`.

**Change:** name the columns. The frontend reads these and nothing else:
`id, username, email, first_name, last_name, user_level, active, last_visit,
join_date, role, template, security, company, password_change_needed,
logged_in`, plus the `companies` aggregate as it is now. Drop `password`,
`security_answer` and `security_question_id`. The frontend never reads them
from this list; sign-in gets the question id from `/auth/login`.

Leave scoping (who sees which users) to item 9. This item is only about
columns.

**Check:** the `users/` response has no `password`, `security_answer` or
`security_question_id` keys. User Management lists, opens and edits users as
before.

**Frontend follow-up:** none required. The frontend `User` type will drop the
three fields to match.

---

## Tier 2 — small, and each unblocks a frontend follow-up

### 3. Tickets: a customer sees other companies' tickets (finding AN)

**Where:** `api/routers/tickets.py`: `_SCOPE` (around line 299),
`_TICKET_COMPANY` (around line 286), `_derived_company` (around line 370), the
create handler (around line 600); `db/ticket_workflow.sql` section 1.

**Now:** tickets have no company of their own. `_SCOPE` lets a non-tech see a
ticket when its **opener shares any company with them**, so a ticket opened by
DCR staff who hold both Houchens (1) and Bruces (3) appears for Bruces
customers. The review saw 15 company-1 tickets on user 649 (company 3) with
`canViewAll: false`.

**Change, in two steps:**

**3a. Today, no migration.** The list query already joins `comp` (the
opener's lowest company id, the one the row reports as `company`). Scope on
that instead of on overlap:
```sql
and (
    t.created_by_userid = :userid
    or comp.company in (select company from company_link where userid = :userid)
)
```
A multi-company opener's ticket then belongs to one company, the one it shows
under, instead of all of them. Apply the same rule wherever `_SCOPE` gates a
single ticket (detail, comments, attachments), so a ticket can't be opened by
its address either.

**3b. Properly.** `db/ticket_workflow.sql` already adds `tickets.company` and
its foreign key, and was left unfinished on purpose: it asks for a backfill
choice before `SET NOT NULL`. Finish it:
- Backfill with the company each ticket shows today, so nothing visibly moves:
  ```sql
  update tickets t set company = (
    select cl.company from company_link cl
    where cl.userid = t.created_by_userid order by cl.company limit 1)
  where t.company is null;
  ```
  Neither option (a) nor (b) in the file fits any more. Dev holds real test
  tickets now (TCK-35 and others), not only the original samples.
- Then `alter table tickets alter column company set not null`.
- Stamp `company` at create from `_derived_company` (the function exists).
- Read `t.company` in place of the `_TICKET_COMPANY` lateral join, and scope
  on `t.company in (…caller's companies…)`.
- Update the router's header comment, which still says there is no column.

**Contract:** the ticket shape is unchanged: `company` (int) and
`company_name` stay. The frontend reads `company` to scope its list.

**Check:** as user 649, `GET tickets/` returns TCK-35 and no company-1
tickets. A tech still sees all of them. `GET tickets/{id}` for a company-1
ticket as user 649 returns 404.

**Frontend follow-up:** none required. The page's own filter stays as a
backstop and agrees with this rule.

### 4. Ticket timestamps arrive without a time zone (finding AO)

**Where:** `api/routers/tickets.py`, `_row`, and wherever comments, work logs
and attachments are returned.

**Now:** `created_at` is UTC with no zone, e.g. `2026-10-21T22:32:10.299190`.

**Change:** send UTC with a `Z` (or `+00:00`) on every ticket timestamp:
`created_at, updated_at, closed_at, due_at`, and the same fields on comments.

**Check:** a new ticket's `created_at` ends in `Z` or `+00:00`.

**Frontend follow-up:** none. The page already reads both forms correctly.

### 5. Receipt lines: weight without Food Giant's scaling (finding A)

**Where:** `api/routers/cashiers.py`, `POST /cashiers/transaction_list`, the
`lines` CTE (around line 850).

**Now:** the query already returns `coalesce(s.weight, 0) as weight`, but
raw. Company 4 (Food Giant) sends weight with no decimal point (15330 means
15.33 lb). `topitems`, `COGS_EXPR` and `items/itemlookup` all divide it by
1,000; this endpoint doesn't, and has no join to `stores` to tell.

**Change:** join `stores st on st.storeid = s.storeid` and return weight the
way `topitems` does:
```sql
CASE WHEN COALESCE(s.weight, 0) > 0
     THEN s.weight / CASE WHEN st.company = 4 THEN 1000.0 ELSE 1 END
     ELSE 0 END AS weight
```

**Contract:** every line carries `weight` in pounds, as a decimal, and `0` on
an item that isn't weighed.

**Check:** Ground Beef Fam Pak (20000300000) at store 695, 10/14–10/20: each
line's `weight` is a few pounds (a pack), not 0 and not thousands. A Food
Giant weighed line reads in pounds, not thousandths.

**Frontend follow-up:** price weighed lines per pound (`net_sales ÷ weight`)
on Price Opt's right-hand table, and remove the "no suggested price for
random-weight packs" notice.

### 6. Deploy the Top 200 ranking already on this branch (finding 3)

**Where:** `api/routers/sales.py`, `POST /sales/topitems` (around line 2453):
`ORDER BY total_sales DESC LIMIT :top_n` on both branches. **No code change.**
It's already written; it needs deploying with the rest.

**Check:** on dev, `topitems` with `topN: 200` returns the top 200 by
`total_sales`, the same 200 the frontend currently picks out of 500.

**Frontend follow-up:** ask for 200 instead of 500 (`TOP_ITEMS_FETCH` in
`src/api/topItems.ts`), about 1 MB less per store opened.

### 7. Check: does `categories/cat_sales` return a store number per location?

**No change expected, one query.** Storeid 685 covers two physical stores,
369 and 370. Categories now splits co-located stores by each row's
`store_number`, the way Sub Dept Margins and Vendors do.

**Check:** `cat_sales` for storeid 685, any week: do rows come back with both
`369` and `370` in `store_number`? If every row says the same number, the
column isn't populated per location. Add it the way `subs/subs` does it,
because the frontend split only shows when the rows carry it.

---

## Tier 3 — new endpoints, larger, after the above

### 8. Price points for one item, aggregated on the server (finding D)

**Why:** Price Opt downloads every receipt for an item when it's picked (1.7 MB
in 7 pages for Ground Beef, one store-week) only to group them by price in the
browser.

**Add:** `POST /cashiers/price_points`
```json
{ "storeid": 695, "productCode": "20000300000",
  "startDate": "2026-10-14", "endDate": "2026-10-20" }
```
Group the item's `Sale` lines in the window by:
- `price_type`
- `multi`: whether the line rang more than one unit (`qty > 1` on a
  non-weighed line)
- `unit_price`: `net_sales ÷ weight` when weight > 0 (per lb, after item 5's
  scaling), otherwise `net_sales ÷ qty`, rounded to the cent

**Contract, one row per group:**
```json
{ "price_type": "REG", "multi": false, "unit_price": 3.13,
  "receipts": 26, "units": 26, "weight": 0, "sales": 81.38,
  "days_seen": 1, "last_seen": "2026-10-16", "weighed": false }
```
`receipts` is **distinct receipts** (`storeid-sale_id-terminal-date`, the same
key `transaction_list` builds), not lines.

Leave the penny-twin merge and the suggestion in the frontend; it already does
both and they're tested there.

**Frontend follow-up:** build the right-hand table from this, and fetch
`transaction_list` only when someone opens one price's transactions, for that
price.

### 9. A parent company, then `users/` scoped to the caller (finding AJ)

**Why:** Houchens is five companies (1, 4, 6, 17, 21) under one owner. The
frontend hardcodes that list. Nothing else knows it, and a sixth company would
silently be left out.

**Add:**
```sql
alter table companies add column if not exists parent_company_id int
  references companies(id);
update companies set parent_company_id = 1 where id in (4, 6, 17, 21);
```
Return `parent_company_id` wherever company records are returned
(the companies list in `api/routers/company.py`, and each user's `companies`
list from `/auth/login` and `users/`).

**Then scope `users/`:** level 9 sees everyone. Everyone else sees users who
share a company *or a family* with them (same company, or same parent, or one
is the other's parent), plus users with **no company at all**. Those are the
~300 accounts migrated from the old CounterCtrl, which managers are
assigning, so they must stay visible.

**Contract:** `parent_company_id` (int or null) on company records. `users/`
keeps its shape; only who's in it changes.

**Frontend follow-up:** read the family from `parent_company_id` and delete
the hardcoded `COMPANY_FAMILIES` in `src/pages/organization/dev/scoping.ts`.

### 10. One small read for the vendor and department lists (finding I, Tommy's issue 3)

**Why:** Sub Dept Margins, Vendors and Price Opt Vendor all download every
item row in the window (13 MB for one store-week) to show a list of 30 or so
rows. A group of stores multiplies that, which is the 60-store failure.

**Add:** `POST /subs/rollup`, taking the same body as `subs/subs` plus
`"by": "vendor"` or `"by": "sub_department"`.

**Contract, one row per key per day.** The frontend grades by matching each
day to last week's and last year's, so it needs the day:
```json
{ "key": "00123", "name": "COKE", "store_number": "361",
  "sale_date": "2026-10-14", "net_sales": 812.40, "cogs": 590.12,
  "qty": 254, "weight": 0, "item_count": 6 }
```
- `net_sales` is `total_sales − total_tax`, the basis every page reconciles on.
- `cogs` uses `COGS_EXPR`, so it agrees with item-level cost.
- `store_number` is there so co-located stores still split.
- Rows with no vendor use `key: ""`. The frontend files those under "No vendor".

**Frontend follow-up:** the three pages land on the rollup and fetch item rows
only for the vendor or department someone opens.

---

## Not in this plan

- **AP, "nobody notified":** no change. Email is on and works. `notified`
  counts active ticket techs with an email address, minus the opener, so the
  0 on TCK-35 meant dev had no such tech at that moment. Make sure dev's
  `ticket_techs` has one if notifications are being tested.
- **Passwords stored as unsalted SHA-1:** real, but separate from this review.
  Worth its own plan, because it touches every account.
- **Board wording, training, release notes (F, AB, U, Z, AA):** no code.

---

## Handback

Fill one row per item as it lands. The frontend follow-ups start from this
table.

| # | Item | Commit | On dev? | Response shape / notes |
|---|---|---|---|---|
| 1 | Login override removed, `/auth/impersonate` added | | | Level 9 only (decided) |
| 2 | `users/` without password, security answer, question id | | | |
| 3a | Ticket scope by shown company | | | |
| 3b | `tickets.company` finished and used | | | |
| 4 | Ticket timestamps with zone | | | |
| 5 | `transaction_list` weight scaled | | | |
| 6 | `topitems` ranking deployed | | | |
| 7 | `cat_sales` store number per location | | | Result of the 685 check: |
| 8 | `cashiers/price_points` | | | |
| 9 | `parent_company_id`, `users/` scoped | | | |
| 10 | `subs/rollup` | | | |
