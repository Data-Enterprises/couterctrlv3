# Backend plan: an optional `storeids` list on every store-scoped request

**Date:** 28 Oct 2026
**For:** a session working in `C:\backend\goliath-platform`.
**From:** the frontend session (`C:\JSDev\couterctrlv3`).

This takes `8250b38` ("item_actions: accept an explicit list of store ids") from
one endpoint to all of them, so a page can search "these 14 stores" without
anyone building a group first. It replaces **part C** of
`backend-movement-and-store-lists-2026-10-28.md`. The rule below makes that
part's C3 (rewriting the inline guards) unnecessary.

Read against the code at `8250b38`. Line numbers are approximate.

## How to work this

- Commit 1: the rule in `get_storeids()` (section 2). Commit 2: the field on
  the models (section 3). Commit 3: Sales Tracker (section 4). Leave
  `_export_storeids` alone (section 5).
- Don't deploy. Steve deploys.
- Fill in the Handback table at the bottom with what landed and anything that
  differs from this plan.

---

## 1. The rule: a store list is sent as a group search

```json
{ "singleStore": 0, "useGroups": 1, "searchValue": 0, "storeids": [101, 102, 140] }
```

A list is an unsaved group, so it travels as one. Everything follows from that.

**Why it has to be a group search, not a third mode.** In these endpoints the
two flags don't only choose stores; they also choose the **shape** of the
answer:

| Where | What the flag decides |
|---|---|
| `cats.py` ~93, ~98 | `useGroups` drops the store columns: the group comes back as one total |
| `cats.py` ~179–210 | `singleStore` adds `storeid` to the hourly grouping, and store name/number to the output |
| `hourly.py` ~123–134, ~227–256 | the same two decisions, consolidated and not |
| `subs.py` ~442, ~448 | `useGroups` drops the store columns from `/subs` |
| `subs.py` ~580–616 | `singleStore` keeps them on the hourly path |
| `subs.py` ~1178 | `singleStore` runs `has_nonstandard_ring_type(db, payload.searchValue)`, which only makes sense for one store id |
| `subs.py` ~1759 | `useGroups` picks the rolled-up select |

A list sent with `useGroups: 1` takes every one of those branches exactly as a
group does today. The result is the shape the pages already draw for a group,
with no change to any of them. A list sent with `singleStore: 1` would get
per-store shapes, and a ring-type check run on store id 0, in some places but
not others.

**What this means for `singleStore` and `useGroups`: nothing changes.** A
request with no `storeids` reaches the same branches it reaches today. The
existing inline guards ("cannot specify both", "must specify either") pass a
list search as-is, because it carries `useGroups: 1`.

---

## 2. Enforce the rule in `get_storeids()` (`api/utils.py` ~159)

The list branch is already there from `8250b38`. Add one check at its top:

```python
if getattr(payload, "storeids", None):
    if not getattr(payload, "useGroups", 0) or getattr(payload, "singleStore", 0):
        raise HTTPException(
            400,
            "Send storeids as a group search: useGroups 1, singleStore 0",
        )
    ...  # the existing assigned check and return
```

The reason is that `singleStore` defaults to **1** on every one of these
models. A caller that sends only `storeids` would otherwise get a group's
stores with single-store shapes. A 400 that names the fix beats a response
that is quietly wrong.

**Order matters for UPC List's Movement tab.** It calls
`/subs/item_actions` with `singleStore: 0, useGroups: 0` plus the list, which
`8250b38` accepts. It now sends `useGroups: 1` (frontend commit after this
plan), so it passes the new check. Deploy this check only once that frontend
change is on the dev UI. Until then it would turn Movement into a 400.

Keep `getattr` for all three fields: not every model will carry `storeids`
when this lands.

---

## 3. The field, on 17 more models

Add `storeids: list[int] | None = None` (the form `8250b38` used) to each model
whose endpoint calls `get_storeids()`:

| Router | Models |
|---|---|
| `cashier_anomalies.py` | `CashierRequest` (~22), `CashierRequestPaged` (~32), `ProductLookupRequest` (~50) |
| `cashiers.py` | `CashierRequest` (~66), `CashierRequestPaged` (~76), `ProductLookupRequest` (~94), `ExceptionLinesRequest` (~105) |
| `cats.py` | `CatsRequest` (~20), `CategoryRequest` (~281) |
| `coupons.py` | `CouponRequest` (~15) |
| `hourly.py` | `HourlySalesRequest` (~39) |
| `sales.py` | `WeeklyRequest` (~106; also `/daily`), `SalesExportPreviewRequest` (~254) |
| `subs.py` | `SubsRequest` (~147), `SubDepartmentRequest` (~154), `SubsDailyRequest` (~1004), `RollupRequest` (~1324) |

`ItemActionsRequest` has it already. Copy its comment, or point to it, rather
than writing a new one each time.

Nothing else in those handlers needs touching. I checked every read of
`payload.singleStore`, `payload.useGroups` and `payload.searchValue` outside
the guards (the table in section 1): each one is a shape decision that a group
search already handles. There are no caches keyed on `searchValue` in these
routers, so two different lists can't be served each other's results.

`SalesExportPreviewRequest` is worth calling out: `/sales/export` takes a list
today but its preview doesn't, so the preview can describe different stores
than the file. This closes that.

**Please verify** on one endpoint per router: send a group's stores as a list
(`useGroups: 1, searchValue: 0, storeids: […]`) and the same group by id. The
responses should be identical, apart from inactive stores, which a group
resolves and a list from the frontend won't include. Note any difference in
the Handback.

---

## 4. Sales Tracker resolves its own stores (`subs.py` ~1495)

`SalesTrackerRequest` doesn't go through `get_storeids()`. It joins `users` in
to save a round trip (the comment explains: 52 requests per load). Give it the
list inline, keeping that saving:

- The same rule and 400 as section 2.
- One query: `select storeid from assigned a join users u on u.id = a.userid
  where lower(u.username) = lower(:user) and a.storeid = any(:storeids)`, with
  the same 403 naming refused stores.

**An access difference to note while you're there.** Its group branch reads
`user_group_link` with no check against `assigned`, unlike `GROUP_STOREIDS`
(`utils.py` ~55), which has one. So a store that left the user's assignments
but is still in their group is still tracked here. If that isn't deliberate,
add the same `exists (select 1 from assigned …)`, in its own commit.

---

## 5. Leave `_export_storeids` as it is

`_export_storeids` (`sales.py` ~1272) does what the list branch of
`get_storeids()` does, without the section 2 check, and it should stay that
way.

The frontend's Sales Export sends `storeids` **on its own**, with no
`singleStore` or `useGroups` (`pages/exportBuilder/dev/hooks.ts` ~500).
`SalesExportRequest` then defaults it to `singleStore: 1`. Run through the
section 2 check, every export would 400. And the rule exists to protect
response shapes that an export doesn't have: `/sales/export` is a line extract
whose grouping is the caller's own `groupBy`, never the scope flags.

So: don't fold it in, and add one line to its docstring saying why. That stops
the next person tidying the two together. `SalesExportPreviewRequest` is
different: it goes through `get_storeids()` (section 3), and the frontend will
send it the group form.

---

## What the frontend does with this

Nothing changes until a page offers a multi-store pick. When one does:

1. A shared helper builds every request's scope, sending the section 1 form
   for a list.
2. The "Stores" search type (commented out in
   `components-dev/storePicker/SearchType.tsx`) comes back, page by page, only
   on pages whose endpoints have the field.
3. Those pages draw a list exactly as they draw a group, because that is what
   the backend returns.

---

## Handback

| Item | Commit | What landed / differs from the plan | Verified |
|---|---|---|---|
| 2. rule in `get_storeids()` | | | |
| 3. field on 17 models | | | |
| 4. Sales Tracker | | | |
| 4. Sales Tracker `assigned` check (if taken) | | | |
| 5. `_export_storeids` docstring | | | |
