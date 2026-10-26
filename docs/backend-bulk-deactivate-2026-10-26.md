# Backend plan — bulk deactivate, and the access-mode rollup

**Date:** 26 Oct 2026
**For:** a session working in `C:\backend\goliath-platform`.
**From:** the frontend session rebuilding User Management in the dev tree
(`C:\JSDev\couterctrlv3`, `src/pages/organization/dev/users`).

Two asks. The first is the real one — the frontend cannot do it safely today.
The second is a small addition to a query that already exists, and it is
optional; say so if you would rather not.

Everything below was read against the code as it stands, not from memory.
Line numbers are approximate.

## How to work this

- One commit per item.
- Don't deploy. Steve deploys.
- When an item lands, record the **exact** response shape in the Handback
  table at the bottom. The frontend will be built to what is written there, so
  a renamed field or a changed unit has to appear in that table.

---

## 1. Bulk deactivate

### What exists now

`DELETE /users/delete_user` (`api/routers/users.py`, ~line 297) does not
delete anything. It is a deactivate:

```python
query = """update  users set active=0 WHERE lower(username)=lower(:username)"""
await db.execute(query, {"username": request.username})
```

`PUT /users/reactivate_user` (~line 312) is the same statement with `active=1`.
Both take **one** `username`. There is no bulk form of either, so the frontend
would have to fire N requests and reconcile N results — which is exactly how a
half-finished bulk action happens.

### Three things wrong with the single-user version

These matter more once it is bulk, because one request will carry a list.

**a. No scope check at all.** `GET /users/` is carefully scoped — a caller
below `USERS_SEE_ALL_LEVEL` who is not a support address only sees users whose
company is in the same *family* as theirs (`api/routers/users.py`, ~line 110).
`delete_user` has none of that. Any signed-in caller can deactivate any
username on the system, including users in companies they cannot see and have
never been shown.

**b. No level check, and no self check.** A level 1 can deactivate a level 9.
A caller can deactivate themselves and be locked out mid-session.

**c. Deactivation does not end the session.** `get_current_user`
(`api/auth.py`, line 30) decodes the JWT and returns the username. It never
looks at the `users` row, so it never sees `active = 0`. With
`JWT_EXPIRE_MINUTES=900`, a deactivated user keeps full access for up to
**15 hours**. Deactivating somebody who is signed in right now does nothing
until their token expires.

(c) is arguably its own item and can ship separately — but it is worth knowing
before anyone calls bulk deactivate finished.

### The endpoint

```
POST /users/set_active
{ "usernames": ["jdoe", "asmith"], "active": 0 }
```

**POST, not DELETE**, and **one endpoint for both directions**: a body on a
DELETE is already awkward, and bulk reactivate is the same operation with the
flag flipped. `delete_user` and `reactivate_user` stay as they are — the
legacy pages call them — but the dev frontend will use only this.

**`active` is `0` or `1`, not a verb.** It names the column, which is the one
thing that cannot drift.

### Guards, in the order they should run

1. **Scope.** Reuse the reach rule from `GET /users/` rather than writing a
   second one. Please pull that `scope` SQL out of `get_users` into a shared
   helper — e.g. `_users_in_reach(db, caller) -> set[int]`, or a predicate
   fragment both call — so the list and the bulk action can never disagree
   about who a caller administers. If they drift, the frontend shows a user it
   is then refused on.
2. **Never the caller.** Refuse the caller's own username outright, whatever
   their level.
3. **Level.** A caller may not act on a user whose `user_level` is above their
   own. **Steve to confirm**: above, or above-or-equal? Above-or-equal stops
   two level 9s from locking each other out but also stops support from
   cleaning up peers. I'd take strictly-above unless you say otherwise.

### Partial success is the normal case, not the error case

**Do not wrap the whole list in one transaction.** One out-of-reach username
should not stop the other nine from being deactivated — that turns a tidy-up
into a guessing game. Apply the allowed set in one statement, and report every
username individually:

```json
{
  "error": 0,
  "success": true,
  "changed":   ["jdoe", "asmith"],
  "unchanged": ["bwilson"],
  "refused":   [{ "username": "bossman", "reason": "above your level" }],
  "not_found": ["jdoeee"]
}
```

- `changed` — the row moved.
- `unchanged` — the user was found and allowed, but was already in that state.
  Not a failure, and the frontend will say so rather than claiming a change.
- `refused` — found, but a guard said no. **`reason` is shown to the user**,
  so it should be a short phrase a person can act on: `"above your level"`,
  `"outside your companies"`, `"that's you"`.
- `not_found` — no such username.

`error` stays `0` as long as the request itself was well formed. A list where
every entry was refused is still a successful request with four refusals, and
the frontend reads the arrays, not the flag.

### What must NOT happen on deactivate

Nothing touches `company_link`, `user_base_group_link`, `assigned`, or
`assigned_via`. `active = 0` and nothing else. Reactivating has to give the
person back exactly the access they had, and the frontend's confirmation modal
will say so. If any cleanup of those tables ever looks tempting on deactivate,
it is a different feature with a different confirmation.

### What the frontend will do with it

A confirmation modal listing the users by name before anything is sent, then
one call, then a result line naming what changed and what did not. That is why
per-username reporting matters: the modal promised a specific list, so the
result has to answer for that same list.

---

## 2. Optional — access mode on the users list

### Why

User Management is moving to **one access mode per user**: "By group" (they
get every store in their base groups, including ones added later) or
"By store" (only the stores picked). The frontend can already read this for a
**selected** user — `groups/base_groups_assigned_to_user_split` returns
`active[]` with `mode` on every row — so **edit and duplicate need nothing
from you.**

What it cannot do is show the mode as a **column in the users grid**, because
that would be one call per row.

### The change

`GET /users/` (`api/routers/users.py`, line 40) already groups by `u.id` and
aggregates companies with `jsonb_agg`. Add one more aggregate over
`user_base_group_link`:

- every held row `mode = 'all'` → `"all"`
- every held row `mode = 'selected'` → `"selected"`
- a mix → `"mixed"`
- no held groups at all → `null`

Returned as `access_mode` on each user, in both `active_users` and
`inactive_users`.

**Mixing is not a supported state.** The mode is one choice per user: every
group they hold is written in the same mode, and Steve confirms no user on the
system currently holds a mix. `"mixed"` is in the list only as a tell-tale —
the column is per link, so a hand-edited or legacy row could still produce one,
and it should be visible rather than averaged into a wrong answer. Nothing
creates it.

### This is a nice-to-have

It buys a sortable column. Nothing in the edit, duplicate or create flows is
blocked on it. If item 1 is the only thing you have time for, that is the
right call.

---

## 3. Not an ask — confirming something you already got right

For the record, so nobody "fixes" it: `assign_base_group_to_user`
(`api/routers/groups.py`) filters the incoming `storeids` per group against
`store_base_group_link`:

```sql
where exists (select 1 from store_base_group_link sbgl
               where sbgl.groupid = CAST(:groupid AS integer)
                 and sbgl.storeid = s.storeid)
```

That means a single call carrying **several group ids, one mode, and one flat
store list** distributes the stores correctly — each group takes only its own.
With one mode per user, the frontend collapses its current one-call-per-group
loop into a single call. No change needed. Please leave that filter alone.

One stale note on our side, not yours: our code comments claim the endpoint
answers 400 for `mode = "selected"` with no storeids. Your comment says it is
allowed and means "holds the group, picked nothing yet", which is the better
behaviour. We'll fix our comment.

---

## Handback

| # | Item | Commit | Response shape as shipped | Notes |
|---|------|--------|---------------------------|-------|
| 1 | `POST /users/set_active` | `c63b686` | `{ error, success, changed[], unchanged[], refused[{username, reason}], not_found[] }` — as planned | Strictly-above level. Also refuses a username shared by several accounts ("more than one account has that name"); max 500 names. Reach rule lifted into `_IN_REACH`, shared with `GET /users/`. |
| 1c | Deactivation ends the session | `efd4cd6` | 401 `"This account is no longer active"` | Checked on every request; an impersonation token also needs its impersonator active. **Frontend has no global 401 handler yet** — a deactivated user sees failing calls, not a sign-out. |
| 2 | `access_mode` on `GET /users/` | `59bb6cf` | `access_mode: "all" \| "selected" \| "mixed" \| null` on each user | Shown as the Access column in the dev users grid. |
