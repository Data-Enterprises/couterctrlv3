# Backend plan — stores on a ticket, and who sees which tickets

**Date:** 27 Oct 2026
**For:** a session working in `C:\backend\goliath-platform`.
**From:** the frontend session working on the dev tree
(`C:\JSDev\couterctrlv3`, `src/pages/tickets/dev`).

Two linked asks. A ticket gets a list of the stores it is about (item 1), and
the scope rule changes from "your company" to three tiers by level, where the
middle tier reads that list (item 2). Item 3 lets a tech correct the list after
filing. Item 4 is small and optional.

Everything below was read against `api/routers/tickets.py` as it stands, not
from memory. Line numbers are approximate.

## How to work this

- One commit per item.
- Don't deploy. Steve deploys.
- When an item lands, record the **exact** request and response shape in the
  Handback table at the bottom. The frontend will be built to what is written
  there.

## The existing tickets are test data

Every ticket on the system now is a test ticket, and Steve is clearing them out
(probably today). So **no backfill and no compatibility path for old rows** —
don't spend time on either. The only "no stores" tickets after this ships are
ones filed as "Not about a store", and item 2 says who sees those.

---

## 1. Stores on a ticket

### What exists now

A ticket stores its company (`tickets.company`, stamped at creation by
`_derived_company`, ~line 380) and who opened it (`created_by_userid`). There
is **no store anywhere in the table**. The frontend writes the store into two
places the server cannot query:

- a line at the bottom of the description (`— IGA Irvington KY · #1 · storeid 805`)
- an attached `scope.json`

A tech can read both. Nothing can filter on them, so a store-based visibility
rule has nothing to read.

### The table

A ticket can be about several stores ("the scale is off at 361 and 364"), so a
link table rather than a column:

```sql
create table if not exists ticket_store_link (
    ticket_id bigint not null references tickets(id) on delete cascade,
    storeid   integer not null references stores(storeid),
    primary key (ticket_id, storeid)
);
create index if not exists ticket_store_link_storeid on ticket_store_link (storeid);
```

Match the types to what `tickets.id` and `stores.storeid` actually are. Add it
as a new section in `db/ticket_workflow.sql`, re-runnable like the rest of that
file.

Zero rows is valid and means **"Not about a store"** (a sign-in problem, a
question about setting up a user). It is not a missing value.

### Create

`CreateTicket` gains:

```python
storeids: List[int] = Field(default_factory=list)
```

**Optional on the wire, defaulting to empty.** The frontend will require an
answer in the form ("these stores" or "Not about a store"), but the rule that
an answer is required lives in the form. A caller that omits the field, such as
an older build, files a store-less ticket rather than getting a 400.

**Guard: every store sent must be one the opener has.** "Has" means the same
thing it means for the store search: a row in `assigned (userid, storeid)`.
That is the list the frontend's picker is built from (`user.assignedStores`,
which comes from `GET /stores/unassigned_stores`, whose `assigned_stores`
section reads `assigned`). Anything else is a 400 that names the offending store numbers:

> `"You don't have access to store 412, so a ticket can't be filed against it."`

De-duplicate the list. Insert the link rows in the **same transaction** as the
ticket (the `async with db.transaction()` block in `create_ticket`, ~line 610),
so a ticket never exists without the stores it was filed with.

**No company check on the stores.** A ticket's company is the opener's lowest
company id. A multi-company user, such as DCR staff or the Houchens family, can
legitimately tick a store from one of their other companies. The store guard
above is the real limit, and item 2's Owner rule allows for this case.

### Return it

Add the stores to `_TICKET_SELECT` (~line 303) so every shape a ticket comes
back in carries them, list and detail alike, the same way `labels` is done:

```json
"stores": [
  { "storeid": 805, "store_number": "1", "store_name": "IGA Irvington KY" }
]
```

Ordered by `store_number` numerically. An empty array, not null, when there are
none. `_row` already parses `labels` from JSON; `stores` needs the same.

---

## 2. Who sees which tickets

### The rule Steve wants

| Who | Sees |
|---|---|
| Below Manager (level < 5) | Only tickets they opened |
| Manager (level 5–6) | Tickets they opened, **plus** any ticket with at least one store they have, **plus** store-less tickets opened by staff at one of their stores (the roll-up, below) |
| Owner (level 7–8) | Tickets they opened, **plus** every ticket filed under a company they are in |
| Tech on the roster, or level 9 | Everything (unchanged: `_can_view_all`) |

Levels in this system: 1 basic, 2 user, 5 manager, 7 owner, 9 programmer.

A ticket whose stores are all gone from a Manager's access drops out of their
list. That's intended: visibility follows current access, like everything else
in the app.

Each tier sees everything the tier below it sees. An Owner does not need the
Manager clause spelled out, because a store they hold is in a company they are
in. See the edge case below, though.

### What exists now

`_SCOPE` (~line 291) is one rule for every non-tech:

```sql
and (
    t.created_by_userid = :userid
    or t.company in (select company from company_link where userid = :userid)
)
```

That is today's Owner rule applied to everyone, so a level 1 at one store reads
every ticket in their company, including coworkers' tickets about other stores.

### The change

Make the scope depend on the caller. `_SCOPE` becomes a function of the caller
rather than a constant, e.g. `_scope_for(caller) -> str` returning the clause
for their tier. Both places that use it, `list_tickets` (~line 515) and
`_ticket_or_404` (~line 428), call the function. Because detail, comments and
attachments all go through `_ticket_or_404`, they follow automatically, and a
ticket outside the caller's scope keeps answering 404, not 403.

```sql
-- below Manager
and t.created_by_userid = :userid

-- Manager
and (
    t.created_by_userid = :userid
    or exists (
        select 1 from ticket_store_link tsl
        join assigned a on a.storeid = tsl.storeid and a.userid = :userid
        where tsl.ticket_id = t.id
    )
    -- the roll-up: a store-less ticket from staff counts the opener's stores
    or (
        not exists (select 1 from ticket_store_link tsl where tsl.ticket_id = t.id)
        and opener.user_level < :manager_level
        and exists (
            select 1 from assigned mine
            join assigned theirs on theirs.storeid = mine.storeid
            where mine.userid = :userid
              and theirs.userid = t.created_by_userid
        )
    )
)

-- Owner
and (
    t.created_by_userid = :userid
    or t.company in (select company from company_link where userid = :userid)
    or exists (
        select 1 from ticket_store_link tsl
        join stores s on s.storeid = tsl.storeid
        where tsl.ticket_id = t.id
          and s.company in (select company from company_link where userid = :userid)
    )
)
```

**The roll-up, and why it stops at staff.** A ticket filed as "Not about a
store" has no store for the Manager clause to match. Without the roll-up, a
cashier's "I can't sign in" would reach the Owners but never their own store
manager, the person most likely to fix it. So for a store-less ticket, the
opener's stores stand in, **but only when the opener is below Manager**:

- Staff ticket with no store → the managers of the opener's stores, plus Owners.
- Manager's or corporate user's ticket with no store → Owners only. Otherwise a
  corporate user with 40 stores filing "Not about a store" would land in 40
  managers' inboxes.

Tickets roll up one level: staff to their store's manager, managers to the
Owner. In practice, store-less tickets from User Management, User Groups and
Shared Groups always go to Owners. Only Managers and up can open those pages,
so the opener is never staff.

`opener` is the `users` alias `_TICKET_SELECT` already joins
(`left join users opener on opener.id = t.created_by_userid`). The opener's
level is read **at query time**, not stamped on the ticket. That's fine: if the
cashier is promoted, their old store-less tickets leave the managers' view,
which matches who they now report to. Say so in the Handback if you'd rather
stamp it.

**Why the Owner rule has a third clause.** A ticket is filed under its opener's
lowest company. When a multi-company opener ticks a store from another of their
companies, the ticket's `company` is not that store's company. Without the
third clause, the Owner of the store's company would not see a ticket about
their own store. With it, they do. Drop it if Steve says Owners should see
strictly `t.company` and nothing else.

Put the two level thresholds next to `TICKET_PROGRAMMER_USER_LEVEL`, read from
the environment the same way:

```python
TICKET_MANAGER_USER_LEVEL = int(os.getenv("TICKET_MANAGER_USER_LEVEL", "5"))
TICKET_OWNER_USER_LEVEL = int(os.getenv("TICKET_OWNER_USER_LEVEL", "7"))
```

### "A store they have" means `assigned`, same as on create

Both the create guard (item 1) and the Manager rule read `assigned`. They
**must** read the same source. Otherwise a manager files a ticket against a
store and then can't see it, or sees tickets for a store they can't pick.

If store access ever moves from `assigned` to a computed view (the
`effective_access` idea from the 15 Oct access handoff), switch both places in
the same commit. A shared helper, e.g. a `_HAS_STORE` SQL fragment used by
both, makes that one edit.

### Tell the frontend which tier it got

The list response already returns `canViewAll`, `canManage` and
`canManageTechs`. Add one:

```json
"scope": "own" | "stores" | "company" | "all"
```

The page will use it to say what the inbox is showing, e.g. "Tickets you
opened, and tickets about your stores". Then nobody wonders why a coworker's
ticket isn't there. The frontend will not derive this from the level itself:
the page's own comment says the rule lives server-side, and two copies would
drift.

---

## 3. A tech corrects a ticket's stores

People tick too few stores or too many. If only the reporter could fix that,
the Manager rule would be wrong until the client refiled.

```
PUT /tickets/{ticket_id}/stores
{ "storeids": [805, 812] }
```

- **Who:** `_can_manage(caller)`, the same as status and assignment. Not the
  opener. A client who wants to change it says so in the thread.
- **Replaces the whole list** (an empty list means "Not about a store"), in one
  transaction: delete the ticket's rows, insert the new ones.
- **Guard:** every store must exist and be active, and must belong to the
  ticket's company **or** to a company the opener is in. A tech is not
  restricted to their own `assigned` stores (techs have none to speak of), but
  should not be able to attach a ticket to an unrelated client's store.
- **Returns** the full ticket, in the same shape as detail, so the frontend
  replaces it in place.
- **Optional trace:** I couldn't find a thread entry written for status or
  assignment changes, so there's no pattern to follow. If one is cheap, an
  internal note such as "Stores changed to #1, #4 by Wayne" would explain why a
  ticket appeared in or vanished from someone's list. Otherwise skip it and say
  so in the Handback.

This deliberately does not go through `PATCH /tickets/{id}` (`UpdateTicket`):
changing the stores changes who can see the ticket, which is a consequence of
the kind that file already keeps out of plain field edits.

---

## 4. Optional — filter the queue by store

`GET /tickets/` takes an optional `storeid` (repeatable, or a comma list,
whichever matches the existing filters there), narrowing to tickets linked to
any of them. It only narrows *within* the caller's scope and never widens it.
It is useful to techs ("everything about store 361") and costs one `exists`
clause. Skip it if time is short; nothing else depends on it.

---

## What the frontend will do

Not for you to build. It's here so the API shape makes sense:

- **Both forms ask "Which stores"** (New Ticket on the Tickets page, and Report
  an issue from any other page). The list is the person's own stores, with
  **"Not about a store"** as the explicit alternative. One of the two is
  required.
- **Pre-filled from where they are:** from a store search, that store is ticked
  already. From a group search, the group's stores are listed with none ticked.
  From a page with no search, or the Tickets page, their own stores are listed
  with none ticked. Someone with exactly one store gets it ticked and is not
  asked.
- The store line in the description and the `scope.json` attachment stay. They
  carry the page and the dates, which the link table does not.
- A tech gets an edit control on the ticket's stores (item 3), and the inbox
  shows the caller's `scope` in words (item 2).

---

## Handback

| # | Item | Commit | Request / response shape as shipped | Notes |
|---|------|--------|-------------------------------------|-------|
| 1 | `ticket_store_link`, `storeids` on create, `stores[]` on every ticket | | | |
| 2 | Three-tier scope, `scope` on the list response | | | |
| 3 | `PUT /tickets/{id}/stores` | | | |
| 4 | `storeid` filter on `GET /tickets/` (optional) | | | |
