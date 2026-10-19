# Since the last publish

Every edit made after a publish goes here as it happens, in the words the
release notes will want. When we reach a stopping point this is what the dated
HTML in `Documents\ccc-release-notes` gets written from, so nobody has to walk
back through the log to work out what changed.

Wipe this file at the next publish and start again.

**Last publish:** 2026-10-12 &middot; `current_10_12_2026` merged to master as
PR #50, published from master.

---

## Sales investigation

### The items grid goes back to one click

`0eebeac4` &middot; `sales_investigate_v2`

Clicking a row opens that item's evidence again, and clicking it a second time
closes it. Double-click is gone.

Copying a selection is out — the ctrl-C and ctrl-A keys, the "copy selected
rows" menu item, and the hint in the strip under the grid that advertised them.

Shift and ctrl selecting stayed. They build a set without opening anything, so
choosing nine items does not throw the panel open nine times, and the set is
what "Find in orders and deliveries" works from.

The evidence panel now opens with its cause strip **closed**. The strip lays
over the sections beneath it, so opening with it down covered the first thing
the panel had to show, and anybody who just clicked an item already knows which
item they clicked. "View details" brings it back.

### Level is not ahead

`sales_top_items`

**We're ahead** was counting every item the two stores agreed on. An item that
rang $19.17 at both stores has a gap of nothing, and the pile was reading as
224 wins worth $3,071.99 when most of it was the same week rung twice.

An item now has to be ahead by more than the $5 floor to count as ahead.
Anything inside that floor either way is level.

**No cause found** is now **Streamlined** -- the items where the two stores
are level, or where nothing in the data separates them. It is the department's
quiet majority, not a list of mysteries, and the hand-off says so: "items level
with the other store. Nothing to chase."

---

### The investigation gets a header and a help panel

`sales_top_items`

The header is three zones. The way out, the department and the week it reads
on the left; the two stores in the middle, in bold, because that is the only
part that differs between two open investigations; the lamps, the export and
the **?** on the right.

The week is written **10/12/2026 – 10/18/2026** rather than "week ending",
and Export CSV is a download icon. Disabled, it says why: nothing to export
yet.

The **?** opens help written for this report rather than borrowed from Sales:
how the four tabs are meant to be worked, every cause including the two new
ones, the difference between Ordered and Received, and why the supply window
is longer than the sales week. It can point at the tabs, the cause chips, the
date range and the export button on the screen itself.

---

### A department nobody orders

`sales_top_items`

Some departments arrive without a purchase order ever being raised — the
vendor's driver turns up and writes the invoice. Beer at 369 and 365 is one:
31 deliveries over the window, no orders at all.

The investigation was reading that as a buying failure. **Never ordered**
rests on an item having no order behind it, and when the whole window has no
orders every item qualifies, so fifty-one items went to the buyer as missed
orders on the strength of no evidence either way.

Those items now read **Not carried here** — the other store sells it, nothing
here says we ever had it, and nothing says whether it was asked for. It is
still the buyer's list and still worth working; it just no longer claims
somebody missed an order. Where orders DO come back for the window, **Never
ordered** means what it always meant.

The Supply tab says which of three things happened rather than printing the
most confident one: the orders could not be read, nothing was ordered over
the window, or orders came back and none of them touch this department.
Orders also find the department by product code now, the same way deliveries
always have.

---

---

## Tickets

### The ticket desk keeps its own roster

`fc5b1b1f` &middot; `sales_top_items`

Who tickets can be assigned to is now something the desk can see and a
programmer can change, from the Tickets page itself. A **Techs** button in the
queue header opens it.

With the programmer level it is the roster: a switch per tech, the stood-down
ones listed so they can be brought back, and an **Add a tech** that picks from
the support staff who are not on it yet. Without it the same list is read-only
and titled **On the desk** — who else is on today and what they are carrying is
a real question before picking up an unassigned ticket, and nothing in the app
answered it.

Standing somebody down asks first, because it decides what happens to their
open work. It says how many tickets they are holding, offers to hand them to
another active tech, and says plainly that anything left behind stops moving —
a stood-down tech cannot see the queue. Standing down the **last** active tech
warns that a new ticket will then notify nobody; it still arrives and still
waits. Bringing somebody back does not ask: it reactivates the row they
already had, so every ticket pointing at it keeps pointing at it.

A tech whose login has been disabled is flagged **no sign-in** rather than
dropped from the list. Tickets still route to them, so hiding the row would
hide the problem.

Rows lead with the **username**, with the display name and tech code on the
second line.

### Tickets stops hiding from the people who work it

Same commit.

The page gates on membership of the ticket desk, which the server computes on
every call. The nav knew nothing about that and still gated the entry on user
level, so a support person below level 7 had `canViewAll` and no way to reach
the page except by typing the route. The nav now opens for anybody with an
active ticket_techs row, at any level.

That is a door, not a key: every call the page makes is still answered against
the row server-side.

