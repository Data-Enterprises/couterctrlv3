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

### Who is picking up the slack, below the day cards

`bbc2cd8a` `e6c56ec8` &middot; `sales_top_items`

The group view gets a **share of group sales** panel under the day-of-week
cards. Shares always total 100%, so a store can only gain ground by taking it
from the others: the panel names the stores that gave ground, the stores that
took it, and says how much money changed hands between them.

Each store is measured against the slice it **usually** takes, not an even
split, so a store that is always 8% of its group is not marked down for it.
Last year is the yardstick when it covers the whole week; last week otherwise.
Movement under half a percent of the group reads as **Consistent** -- real
money, but the rounding of a normal week rather than a finding.

The old by-store grid and the By department tab are gone. They were two more
readings of the same group, and this is the reading that answers the question.
The group total tile now rounds to a whole percent, and falls back to vs LW for
groups with no last year on file.

The explanation lives in the `?` panel: five new Sales terms cover share of
group sales, why it balances, the three standings, why a store can lose share
in a week its sales grew, and what the "does not cancel" figure means.

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

