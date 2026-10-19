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
took it, and prices each move against the group's week.

Each store is measured against the slice it **usually** takes, not an even
split, so a store that is always 8% of its group is not marked down for it.
Last year is the yardstick when it covers the whole week; last week otherwise.
Movement under half a percent of the group reads as **Consistent** -- real
money, but the rounding of a normal week rather than a finding.

The old by-store grid and the By department tab are gone. They were two more
readings of the same group, and this is the reading that answers the question.
The group total tile now rounds to a whole percent, and falls back to vs LW for
groups with no last year on file.

The explanation lives in the `?` panel: seven new Sales terms cover share of
group sales, why it balances, the three standings, why a store can lose share
in a week its sales grew, what the "does not cancel" figure means, the day
strip and the store named on the other side of a move.

Clicking a store in the list opens a panel beside it rather than leaving the
page. It says what that store's move was worth against the group's week, names
the store that went the other way by about the same amount, and breaks the
week into days with a dashed line at the share the store usually takes -- so a
store that was level until Thursday and gave the week away on Friday reads
differently from one that was light all week. **View store report** opens the
store's own report from there.

The share figures moved out of the bars and into their own column, under
column headings -- Share, Change and Worth -- so the numbers say what they
are. The tick marking the usual share used to strike through the number
printed on top of it, which made some rows hard to read.

The summary line above the list is gone -- the pills took its place rather
than sitting on top of it, and the **Worth** column already prices every
store's move.

Falling, Consistent and Rising sit beside the panel's title as counted pills,
the way Crit, Watch and OK do on the left, and clicking one narrows the list
to that band. They replaced the headings that used to split the list into
three sections: one list reads better, and the colour of each store's bar
already says which band it is in.

The list is ordered **Falling first, then Consistent, then Rising**, biggest
mover inside each. **Share**, **Change** and **Worth** are sortable column
headings on top of that -- click once for high to low, again for low to high,
a third time to put the Falling-first order back.

The right-hand panel asks the questions somebody asks next, instead of
repeating the row they just clicked. Is this new -- this week's slice against
last week's, so a one-off week reads differently from a slide that has been
running. When did it happen -- the day that carries the move, and whether it
was the group's biggest. Which departments. Who picked it up. Each is a
question, an answer and a small drawing, and the one button in the panel
opens the store report.

The right-hand panel is drawings rather than sentences. The store's shortfall
is one bar -- what it took, the slice it missed beside it, and a tick where
its usual share sits -- and the store on the other side of the move is a pair
of chips. The week is drawn **in money**, each day above or below a line that
is the usual share, so the day that cost the most is simply the tallest bar;
only that day carries a figure. The reasoning behind it all sits in the strip
at the top, closed until asked for.

Store rows are a single line. The second line under each name repeated the
usual share, which the tick on the bar and the Change column already carry.

### Two stores in the title bar

`sales_top_items`

The **Stores** tab in a store's report is now called **Compare**, which is what
it is for. With a store picked there, the title bar says which two stores are
being compared instead of repeating the page name.

The title bar reads **Weekly Performance** and has dropped the small date range
under it -- the week is already written across the day strip and both
comparison tiles below it.

---

## Sub dept investigation

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

