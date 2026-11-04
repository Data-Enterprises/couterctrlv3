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

### A ticket names the store the page was about

Filing a ticket from a page with its own store picker (Item Actions, Item
Lookup, Categories, Vendors, Sub Dept Margins, both Price Optimization pages
and Receivers) showed whichever store was last searched on Sales in the box at
the top of the form, ticked that store in the store list, and sent it with the
ticket. Found in testing: a ticket from Item Actions read "002 - IGA IRVINGTON
KY 2" because that store was open on Sales. The form now reads the store the
page itself picked, and where the page ran a date range, that range goes with
the ticket too. With nothing picked on the page, the box names no store rather
than a wrong one. Made after the `f251f251` publish commit.

## From the test-user agent run

Tommy's test-user agent ran the deployed 10/12 build against store 361 and
filed five issues and seven observations (`issue-drafts-2026-10-21.html`). The
four that were ours to fix are below; the response that went back is
`docs/issue-response-2026-10-21.html`.

### The sub-department names stop being the column that gives way

`03844b4d`

On a window under about 1200px every sub-department name in the Sales drill
shrank to nothing. The amounts and percentages stayed, and which department
they belonged to did not.

Three nested widths caused it: the report panel is 52% of the content area, the
signal list 39.5% of that, and inside the row the numbers are fixed at 246px.
The name cell was the only item in the row that could shrink, so it absorbed
every missing pixel.

The name cell and the signal list both have a floor now, and **vs LY hides
under 1200px** -- the weaker of the two comparisons, and a dash on every row
anyway on a store with no history on file.

### The ledger stops fetching an hour it never shows

`8fefe4d8`

Sales fetched `hourly/hourly` for three windows on every search, and per store
on a group of more than 30. Nothing read a row of it: the ledger shows no hour,
and the drill's Hourly tab fetches the same three windows scoped to the store
you clicked and dispatches them over the top.

On the 60-store group behind the 11 Sep performance report that was 180
requests whose results were written to Redux, read by nobody, and replaced. The
dev ledger had already dropped them; this brings prod level.

### The store's margin is weighted, not averaged

`b5595d61`

Sub Dept Margins built its header margin by averaging the departments'
percentages, so a $1,000 floral counter at 70% counted as much as a $90,000
grocery department at 25% and the figure read about five points high. The run
found it by loading this screen and Vendors for the same store-week: 31.91%
against 27.04%, from the same `subs/subs` rows. Vendors has always weighted and
was right.

Net and COGS now come out of the day-matching as `MarginDollars` instead of
being discarded after the division, so the store figure sums them and divides
once. Both points deltas are weighted the same way, each side scoped to the
days it matched, and read as a dash rather than 0.00 where a side has no sales.

`marginPct` had three private copies and now has one, in `utils/grading`.

**The number on screen will drop**, about 31.9% to about 27.0% on that
store-week. It will look like a regression and it is the opposite.

### A hidden Search button stops being in the page

`c0a5a5e7`

`DatePickers` rendered its Search control with `display: none` whenever
`showBtn` was false, which is nearly every caller -- both SearchCards,
Cashiers, Coupons, Inventory, Admin and Receivers all own their own search
button. An element in the markup that is never painted reads as a real control
to a screen reader or a test agent, which is why the run reported Receivers as
having two search controls. It is no longer rendered when it is off.

### Co-located stores split on Vendors and Categories

`f157e3bb` `98ab447a`

A handful of storeids cover two physical stores, and these pages fetch by
storeid, so their responses arrive with both locations added together. Sales,
Sub Dept Margins, Receivers and Item Lookup have always split them; Vendors and
Categories never did. On 685 -- store numbers 369 and 370 -- every vendor and
category figure on those two pages was two stores at once, with nothing on
screen saying so.

Both pages now take the locations from the rows, land on the first rather than
the combined view, and offer the same **LocationTabs** the others do. The raw
rows stay whole so switching is a rebuild, not another paginated read, and the
header names the location you are on rather than whichever number the
assignedStores record happened to embed.

Categories narrows its per-category drills as well -- items and hourly are
fetched by storeid too -- and switching location closes the open category,
since its rows belong to the one before it.

**The split also got stricter, which fixes a quieter bug in Sub Dept Margins.**
Scoping went through `scopeToStoreNumber`, which leaves an array alone when it
holds fewer than two numbers. That guard answers "does this response need
splitting"; the question when a reader has picked a location is "which location
is this", and a co-located store can easily have a period only one of its
locations traded in -- a last year 370 has no history for and 369 does. The
guarded form handed 369's rows to somebody on the 370 tab. `onlyStoreNumber`
joins it in `utils/storeIdentity`, strict and documented against its sibling,
and Sub Dept Margins moves to it.

Mobile already scoped by store number, so this is desktop only.

Whether Categories shows tabs at all depends on `cat_sales` returning a
per-location `store_number`. If every row carries the same number the tabs
render nothing and the page behaves as it does today -- inert until the rows
support it, correct the moment they do.

## User Management

### A manager is only offered their own people to assign

`31690c22`

The Companies tab built its candidate column from every user the server
returns, which is every user on the system. A Bruces manager was offered 391
people to add to Bruces, Houchens staff among them -- and
`assign_user_to_company` takes a bare userid with no ownership check, so the
offer was real.

Three ways into that column now: you see everything (level 9 or DCR support),
the person holds **no company at all**, or the person is inside your **reach**.

Reach is your own companies plus the rest of any family one of them belongs to.
**Houchens is five companies on the books** -- Houchens 1, Food Giant 4, Sonic
6, Ace 17, Brooks 21 -- and one organisation in practice, so a manager at any
of them administers staff across all five. Bruces, Grocery Basket, S&C Foods
and B and T each stand alone.

**DCR (5) is deliberately not in the family.** It sits beside those ids in the
Orders edit gate, which is Houchens plus ourselves -- a different question with
a coincidentally similar list.

Somebody holding no company stays available to anyone: a new account belongs to
nobody, and putting it somewhere is the whole of onboarding.

Only the left column narrows. Anyone already in the company on screen holds it,
so they are in your reach by definition. A line under the heading says what the
narrowing is, so a short list does not read as a broken search.

**The hardcoded family wants to be a `parent_company_id` on the company
record.** Add a sixth Houchens company and this file has to be edited before
anybody can administer it, and nothing will say so.

**Still open:** the Stores and Base Groups tabs take their candidate lists from
the server rather than building them here, so whether those are company-scoped
is a question for the endpoints, not for this fix.

### The company filter offers what you hold, and Assign all obeys it

`0917a0af`

Two faults in the same dropdown.

**It listed companies outside the viewer's reach.** The candidates were gated,
but the options were still built from every company each candidate holds -- and
somebody can hold two. A person in both Houchens and B and T is yours to work
with through Houchens; listing "B and T (1)" offered a filter for a company you
have no business in and named its headcount while doing it. Options now drop
anything outside reach. **No company** never drops. A viewer who sees
everything keeps the whole list.

**Assign all ignored the filter entirely.** The Companies and Stores tabs pass
`assignAllScope="global"`, which read the raw unfiltered array -- so the
heading said "1 of 372" and the button beside it would have assigned 372
people, on a tab whose whole job is company membership, through a write that
takes a bare userid.

"global" now means it steps over the **search box**, which is the parity it was
added for and still right: somebody typing to find one person has not decided
to narrow the write. It does not step over the caller's scope. The button
disables when that scope leaves nobody, rather than staying lit and lying.

Five tests on `AssignPanel` hold the distinction.

---

## Store comparison, for Brooks

Two faults on the same screen, each owning a different part of it. Reconciled
to the cent against the store's own JSON before anything was changed.

### The comparison pairs departments by name, because the numbers are per store

`a95a4cf8`

Sub-department numbers are assigned per store. Chapel Hill's 5 is Fresh Meat
and Tupelo's 5 is Tobacco, and there is no department master anywhere to say
otherwise. Pairing the two stores on the number compared Chapel Hill's Tobacco
($243.72) against Tupelo's Deli/Bakery ($66,072.57) and called the difference a
tobacco gap of $65,828.85.

Pairing is on the description now, case-folded and tolerant of a trailing s. A
department only one store has is listed on its own side rather than silently
matched to whatever shares its number.

**This moved every row on the page.** It is the fix, not a regression.

### The comparison headline leaves out what the store leaves out

`f2587121`

`sales/weekly` drops a store's hash sub departments -- fuel, lottery, cash
accounts -- and the sub-department endpoints return them. The headline was
summed from the endpoints that keep them, so it carried $82,277.95 the store's
own figures never counted: $79,943.00 of Tupelo fuel and $2,334.95 of Chapel
Hill lottery, cash accounts and RSA. That is exactly the distance between the
$136,036.51 the page showed and the $53,758.56 the Compare tab did.

The new `is_hash` flag is the whole rule, read through `src/utils/hashSubs.ts`
so there is one place it lives.

### The drill asks each store for its own department number

`22aef959`

Following a department into the item list narrowed on the department first and
the store second, so a drill on Fresh Meat fetched whatever each store happened
to number 5. Narrowed to the store first now, then that store's department.

---

## Responding to the 23 Oct re-check

Everything below is **DEV tree only** -- this round is about getting dev ready
to move to prod, so the prod UI is deliberately untouched.

### The combined tab names both stores, and the two margin headers agree

`81fa1f3e`

**AV.** With no location selected, the combined tab fell through to the stored
store name, which has one of the two numbers baked in -- so "Both $424.4K" sat
under "Bruces Foodland 369". It reads "369 + 370" now, swapped in place so the
rest of the name survives.

**AU.** Sub Dept Margins summed each department's matched days and Vendors
summed each vendor's, so the same store and week came out 0.03 points apart. A
Tuesday one vendor missed is still a Tuesday its department worked. Both now
match days once, store-wide, through `src/utils/storeMarginDelta.ts`.

### Item Actions reads its prices from the server, not from receipts

`582e452e`

**AS and D are one change.** The price table was built by downloading every
receipt and walking it -- 700 KB on opening a row, 1.8 MB on the first Trans
click -- and the walk is also what produced the wrong prices. Pointing the
table at `price_points` deletes the walk rather than optimising it. The hook
moved to `src/hooks/usePricePoints.ts`, shared with Price Opt.

### One promotion is one price, and one count says so

`d7eb5c45`

**AT and G.** A 2-for-$6.67 rings $3.34 as a single and averages to $3.33 as a
pair, so one promotion appeared once in Exact and once in Avg, a penny apart,
reading as two prices. They fold within a price type -- REG $3.34 and SALE
$3.34 stay two prices, because they are. The tile and the pattern note also
counted differently (5 against 4 on COKE 6PK); there is one count now.

### Four more pages count what the store counts

`8ee9b005`

Categories, Sales Tracker, Vendors and Sub Dept Margins put their store headers
beside figures from `sales/weekly`, which leaves hash departments out. Those
headers now drop them too.

**Store margin and sales headers move on any store with fuel, lottery or cash
accounts.** The lists are untouched -- a department is still listed, graded and
drillable, it just no longer moves the store's own number.

### Keeping this round in the dev tree

`7f783a76`

Phases 1 and 4 had edited prod alongside dev. Reverted in five files across
Categories, Vendors and Sub Dept Margins. The shared utils stay shared and are
safe as they are: `storeIdentity` only gained an export, `csvExport` only
widened a type, and `src/utils/pricePoints.ts` has no prod importer at all.

### P and O close: the chicken margin was right

`c40d53a6`

No code change. The rows for 20016900000 say the item is priced per pound --
net sales over weight is $3.99 on all seven days -- and `calculateCogs` already
multiplies by weight, so 66.1% is the honest figure. The theory that we were
dividing a package cost by a package count was wrong: `case_size` is 1.

Documented the `margin` field on `SubDeptMargin`, which reports ~99% because
the server computes `(total_sales - cost) / total_sales`: one unit's cost
against a whole tax-inclusive day. Nothing consumes it. Comment only.

### The Categories pill says which two figures it compared

`2779e4b2`

**5a.** Categories pairs per category per day and drops a category-day with no
counterpart from both sides, so the percentage's base is not the headline --
$96.8K against $90.3K behind a header reading $100.4K and +7.15%. Hovering the
LW or LY pill now names both figures and repeats the headline. Said only when
they differ.

### The price table counts pounds, like the rest of the panel

`f2b8b2f7`

**AS, a second pass.** Fam Pak Breast Tenders had three figures for the same
week in one panel: the header 180.7, the transactions table 180.68, and the
price points table 97 under a column headed "Units". 97 is the ring count.

`erasFromPoints` read `units` off the price point while `weight` -- 180.674 --
sat on the same row, and `src/utils/pricedUnits` already holds the
weight-before-rings rule the header and `calculateCogs` follow. It follows it
too now, and the columns read "Price / lb" and "Lb" so the figure carries its
unit. A packaged item is unchanged. The export prints the same eras and
follows.

### Price Opt remembers the departments it already read

`f2f6ea8a`

Opening a department fetched its items, and the slice held one list for
whichever was open -- so walking a store and coming back to a department read
it from the server again. Items cannot change inside a fixed store and date
range, so the second read never said anything new.

Kept per department for the life of the search window now. Reopening one is a
render: no request, no spinner. Cleared when a new search is committed from the
popup card, which is the only thing that can invalidate it. A failed load is
left out so reopening retries; a department that really is empty keeps its
entry, or it would re-ask forever.

Vendors needs none of this -- its item lists come from rows the page has
already read.

### Package deal reads the server's receipt counts

`fc0daa04`

**D, closed.** The pattern is "the same receipt rang this item at two prices",
and it had not fired since the receipt walk was deleted -- the panel called
`classifyPattern` with an empty placeholder because there was no count to give
it. The backend added one on the same query; the browser reads it.

Three optional fields on `cashiers/price_points`: `receipts_total`,
`multi_price_receipts`, `max_price_spread`. Optional on purpose, so the order
the two halves deploy in does not matter -- without them the pattern stays
quiet, which is the current behaviour.

`receipts_total` is not the sum of `receipts` across the price points. One
receipt can sit in two of those rows, so that sum over-counts by exactly the
receipts this is about: 84 against a true 73 on COKE 6PK.

**Two prices means more than a cent apart** -- a rule the backend added and the
right one. A 3-for-$10 rings $3.33, $3.33, $3.34; on raw distinct prices 64 of
85 two-price receipts at store 695 were that rounding. `foldPennyTwins` already
applies it to the price list, so the two sides share one rule and have to move
together.

**Weighed items return null**, and null reads as "not answerable" rather than
"none found" -- two packs of chicken in one basket compute to different prices
per pound from rounding alone, and a BOGO is rung on packages.

`mixedPriceInsight` is deleted. It walked receipt lines and divided by qty,
which is 1 on a random-weight pack -- the arithmetic findings AS and D were
both about.

---

## Readability

### Price Opt reads easier

`2bacd309`

Type up one point across the whole Price Opt screen -- the department tree, the
item panel, both price tables and the page shells. 9 to 10 through 15 to 16, so
the hierarchy that was there survives and only the floor moves.

`ACT_COLS`, `TXN_COLS` and `EST_COLS` widened with it. Those columns are fixed
px sized to their widest real value, so a point of font has to be paid for in
px or `$1,332.63` clips its own column. The `1fr` price column absorbs it.

Text opacity floored at 85%: `/40`, `/50`, `/60` and `/70` all to `/85`. The
dimmest were captions and column heads -- the text that was hardest to read at
9 and 10 px.

### The gap split's three sentences become one CTA strip

`a6aead0e`

On the store comparison, the bar was followed by three stacked sentences: where
the gap concentrates, which departments only one store carries, and what sits
outside net sales at both. Four lines of 11.5px type, and they pushed the list
and the evidence panel down the screen -- so the thing a reader came to scan
started lower the more there was to explain.

It is a `CtaStrip` now. It lays over the panels instead of moving them, which
is the house rule, and the sentences get 13px because the room is no longer
rationed. Closed by default: the bar carries the finding, this is the working
behind it. Neutral tone -- nothing in it is a verdict on the store.

The label **counts** the unmatched departments rather than totalling them. A
first draft read "$160,124.21 sits outside this comparison", which added one
store's unmatched sales to the other's -- a figure that is nobody's sales and
no kind of gap, and under "Behind by $53,758.56" it read as money missing from
that. It also left out the hash departments, which are equally outside the
comparison. Both figures are still in the detail with their stores attached.

### The strip says Show, the back button says Back

`16af1f07`

The CTA strip takes a theme border instead of raw grays -- `brand_navy/25` over
`bkg` with a `brand_navy/5` hover, the same token as the rule under the header
beside it -- so it reads as a thing you can open.

The chevron is labelled **Show / Hide**, in `CtaStrip` itself rather than at one
call site: a chevron alone says there is more without saying it can be opened.
**This also changes the group share rail**, the component's other caller.

The back button on the comparison drill-down carries the word **Back** beside
its chevron.

### Every not-compared department is named

`a60b12fb`

The strip listed three department names and "and others", and only ever named
the counterpart store's -- so on the biggest unexplained figure on the screen a
reader was told there was something they were not being shown, and never saw
this store's side at all.

Both sides are named in full now, one line per store: "Only here: ..." and
"Only at <store>: ...". The hash departments are listed in full too, where it
was the same three-and-others.

The overlay caps at 45vh and scrolls, since naming every department can run
long on a pair of stores that share little and it must not reach past the panel
it is laid over.

## User Management

Dev tree only. Asked for by Amanda, who needs to edit people's access this way
rather than blow out every Houchens user and start again.

### One access type per person, and Edit is Add filled in

`1f3a39d5`

A person is now **By group** or **By store**, one answer for everything they
hold. Each base group used to carry its own Auto / Pick stores toggle, so the
question had no single answer and nothing on a finished screen showed it. The
toggle is gone; the AUTO / FIXED chip stays and reports the person's type.

Edit user is the same four steps as Add user, filled in: every step reachable
straight away, the username fixed, no password section (the key icon in the
list does that). Save sends only what changed.

The access type can now be changed on an existing person. Switching to By store
starts with **every store they currently have ticked**, so nothing is lost until
somebody unticks. The review step warns that saving rewrites all of their base
groups.

For the single store role, By group is shown greyed with the reason on the
card. It had never actually been greyed for anyone -- the check compared the
role against the word "singlestore", and the role is stored as the number 1.

Duplicate copies the access type, and copies exactly the stores the source
picked and through which group. It used to fetch every group's store list and
guess, which could give the copy more than the original had.

### Deactivate several users at once

`a079d912`

Users get a checkbox, and the header a select-all for what is on screen. While
anything is ticked a bar offers **Deactivate N** (or **Reactivate N** under
Inactive). The confirmation lists every person by name, then becomes the
result: deactivated, already inactive, refused with the reason, or not found.

Refused: anyone outside your companies, yourself, anyone above your level, and
a username shared by more than one account. Your own row and rows above you
have no checkbox.

The single trash icon now says **Deactivate** and goes through the same
confirmation. It always only deactivated -- the old confirmation said "This
can't be undone" -- and reactivating gives back the companies, groups and
stores the person had.

A deactivated person is signed out on their next click rather than up to
fifteen hours later (backend, `efd4cd6`).

The grid has an **Access** column: By group, By store, or Mixed for a stray
older account whose groups disagree.

### Users with no access type can have one set

`7a2c1cf5`

Users made through the prod wizard, or before access types existed, show
**Not set** in the Access column, and the Access filter can narrow to them.
Editing one says no access type is set yet; picking By group or By store and
saving sets it for every base group they hold.

### A deactivated user is signed out on their next click

`ddc979e2` &middot; dev mode only until prod is promoted

When the server refuses a session -- the account was deactivated, or the
session ran out -- the app signs the person out and the sign-in screen says
why, instead of every click failing with an error. A wrong password still
just says so on the form.

### Filter users by access type

`cb7ee37b`

An **All access** filter beside the role filter narrows the grid to By group or
By store. It is remembered with the other filters when you open someone and
come back.

## Orders, for Ben

### Fix cost becomes a Problems tab in Edit

`76374f03`

Edit's left panel has two tabs under its filters: **Orders**, as before, and
**Problems**. Problems lists every item with a cost that looks wrong, one row
per UPC: missing cost first, then high margin from the worst down, then no case
size.

Pick one and it opens on the right across every order the filters show. Each
store's row has its case size and unit cost, and its case cost, Ext cost and
margin now and at the new unit cost. Type the unit cost once and every store's
case cost follows from its own case size. Where at least two stores already pay
the same unit cost, it is offered with "use it".

Every store starts ticked; untick one that pays something else on purpose.
**Stage** writes the cost into each order and opens the next item; **Skip** sets
it aside for this session. A fixed item stays in the list, marked staged.
Nothing is sent until Submit.

The high-margin cutoff can be changed in the tab, and it is the same setting
Browse uses. An item with no case size is treated as ordered by the unit, so
the unit cost goes into the case cost column as it is, and the item says so.

After Submit, the sent costs show straight away: in Browse, in the Problems
list, and when an order is opened again. Before, they went back to the old
figures until the import ran.

### The Unit cost column shows what you typed

Case cost, Ext cost and margin each read `now → after` as soon as a unit
cost is typed. Unit cost — the one column the box above it feeds — showed only
the loaded figure, so on an item ordered by the unit the screen said $0.00
under Unit cost while the arrow appeared under Case cost. It now moves with
the rest.

## Tickets

### A ticket from a page with no store search names no store

`f9c981f0` &middot; TCK-44

A ticket filed from User Management, Admin, Groups, Tickets, QuickSight or
Settings printed whatever store was last searched on another page, as if the
problem were about it. Erica's ticket about a B&T user read Grocery Basket.
Those pages now record no store, group or dates on the ticket.

### Tickets name their stores, and who sees them follows the stores

dev mode only &middot; needs the goliath-platform ticket-store API (and
`db/ticket_workflow.sql` run first) -- see
`docs/backend-ticket-stores-2026-10-27.md`

New Ticket and Report an issue now ask which stores a ticket is about, from the
person's own stores, or "Not about a store". One of the two is required, and
someone with only one store is not asked. From a store search that store is
ticked already; from a group search the group's stores are listed first. A
store they can only search through a shared group is never pre-ticked, since
the ticket could not be filed against it. From User Management and Groups a
hint says to tick the store of the person the access problem is about.

Who sees a ticket now follows the stores: below Manager, your own; a Manager,
also tickets about their stores and store-less ones from their stores' staff;
an Owner, also everything for their companies. The inbox says which, rows show
the store numbers, and the ticket header lists them in full. A store filter
appears when the list spans more than one store.

Techs get **Edit stores** under a ticket's title; the change is noted in the
thread for the desk only. A ticket that leaves your view while it is open (its
stores changed, or yours did) closes with "That ticket is no longer in your
view" instead of failing on every poll.

The Tickets entry in Coming Soon is open to every level now, not 7 and up:
the server's tiers decide what each reader sees, and a level gate only hid the
tickets someone had just filed through Report an issue. Coming Soon is still
dev-only, so clients on prod do not see it.

## Release Notes

### Release Notes leaves the dev menu, parked for production

dev mode only

The avatar menu's Release Notes row is gone from dev. The weekly meeting doc
is dev's release notes, written for the support team. The row was also broken:
its route had been unmounted, so it landed on Sales. The page and the notes
themselves are kept for clients, for when production makes the shift.
TitleBar's parked block lists the three steps to open it on prod.

### Release Notes come back as a window, in dev, with sample notes

dev mode only, level 9 only

**Release Notes** in the avatar menu opens a window over the page you are on,
not a separate page. On the left is a list of release dates. On the right is
that release's notes in up to four sections: Platform Updates, Now available,
Updates and Fixes. Each section is a list of bullets under page headings, and
empty sections are left out.

It opens on the page you came from, with that page marked in every section
it appears in. When the latest release does not touch the page, the window
says so and links to the release that last did.

The notes are a sample for trying the window, and the window says so. The real
notes are prod-only and get written at the dev-to-prod migration, when this
moves over like any other page. The old 20 October set is gone: it described
pages that never reached prod. The old Release Notes page is in `trash/`.

## AWG Invoices

### A send says which invoices the server would not save

dev mode only

The server now reports invoices it read but would not save, each with a
reason, beside each file it parsed (goliath-platform `8098e1e`). Send used to
toast "Sent 5 invoices" even when one was dropped. It now says "Sent 4 of 5
invoices", names the invoice that was not saved and the server's reason, and
keeps a red line under the Send control instead of the green "Sent". The
leftover references to Textract, an engine the server removed, are gone from
the invoice API types.

### Coupon Sales on a phone: receipt lines no longer outlive sign-out

dev mode only

A week's coupon lines, which the phone's receipt sheet reads from, were kept in
a variable outside the store. That was so they would survive leaving the page,
but it meant they also survived signing out. They are in the Coupon Sales slice
now: leaving the page and coming back still opens receipts, and sign-out clears
them with everything else. Nothing on screen changes.

### Picking users to deactivate starts from the action

dev mode only

The users grid used to have a checkbox column with no heading, which only said
what it was for once something was ticked. Now there are no checkboxes until
you press **Deactivate users** in the toolbar (**Reactivate users** on the
Inactive list). Pressing it shows a bar that says "Choose who to deactivate"
before anything is ticked, with a count, "Select all N shown", Cancel, and the
action button. Clicking anywhere on a row ticks it, and the row's own icons
are hidden while picking. Escape or Cancel backs out. The single-row trash icon
works as before.

## Item Actions

### See item actions from Sales includes items that stopped selling

dev mode only

The store-wide **See item actions** button on Sales sends a rule (the item
threshold and grading metric on screen), and Item Actions works out which
items are critical. It only looked at items that sold this week, so an item
that sold last week or last year and nothing this week, down 100%, never made
the list. Sales already counts those as critical in its Inactive list. They
come through now, including ones from a department that sold nothing this
week.

### Build actions sits at the bottom of the card

The UPC box and its Add / Upload CSV buttons now come before the navy Build
actions button instead of under it, so the card reads top to bottom: store,
date, UPCs, then build. The button used to say "Add a UPC list" above the box
it was asking for. Made after the `f251f251` publish commit.

## Coupons (Data → Coupons), on a phone

### The phone screens read like the other mobile pages

dev mode only

The sort switch moves out of the navy header into an ordinary row of sort
chips, the same ones every other mobile list uses, with Export at the end of
that row. The store list, the overview and a section's detail share one totals
card. Coupon value leads, and the count, products and average sit beneath it
as tiles, instead of three copies of a four-column strip that gave every
figure equal weight. A grouped row (a store, a sub department, a date, a
cashier) labels its count and shows the average on its second line, instead
of an unlabelled number that read as a second amount.

## Report an issue: the store picker no longer crashes

dev mode only

Opening **Report an issue** as a tech crashed the page ("Cannot read
properties of null (reading 'localeCompare')"). A tech's picker lists every
store, and six stores belong to no company (Crossroads IGA 782 and 785, ACE 316
and 399, Houchens Corp Bowling Green, Sonic 0). The server sends them with no
company name, and sorting the companies by name threw on them. They are listed
now, last, under **No company**.

The picker's companies now fold. A tech's list is 400-odd stores, so each
company starts folded and shows as one line with its store count; a click
opens it. A company with a ticked store starts open and says how many are
ticked, and typing in the search box opens every company with a match.

**Report an issue lists your own stores, and every store for support.** The
picker no longer asks the server for a store list each time it opens: it uses
the stores assigned to the person signed in, which the app already has from
sign-in, so it opens straight away. A tech is the exception (corrected 3 Nov):
they are support, filing for a client who phoned in, so they are still offered
every store, as the server allows. The page still
decides where the list starts: a store search ticks that store, a group search
lists the group's stores first, and pages with no search (User Management,
Groups, the help desk) start on all of yours. Someone with no stores is told,
and the ticket is filed as not about a store. The store names no longer carry
a "#10" in front, since each name already starts with its number.

**Every page now files under a category.** A ticket from any page used to
arrive with the category blank on nine of them (User Management among them).
The categories now follow the nav's page families, decided 29 Oct: Sales,
Margins (Sub Dept Margins, Categories, Vendors), Coupons, Loss Prevention,
Cashiers, Item Lookup, UPC List, Forecasting, Orders & Receiving, Price
Optimization, Users & Access, Analyses, and Other. Chat, Teams and Tickets are
retired. **Needs the database first:** the category rows in
`docs/ticket-categories-2026-10-29.md` must be in place before this publishes.

## User Management: By group means no store boxes

dev mode only

When a user gets their stores **By group**, the Assignments step no longer
offers a checkbox beside each store. A group they hold still lists its stores
ticked and greyed out. A group opened only to look at its stores now shows a
plain list, with a line saying to tick the group to give them all of it, or to
choose **By store** to pick stores one at a time. Before, those stores had live
checkboxes, and ticking one quietly gave the person the whole group.

**Effective stores counts straight away.** Editing a user, the Effective
stores column read "counting…" until a company was clicked, because a group's
stores were only fetched when its company was opened. The groups the person
holds now load as the edit opens, so the count and the list appear without a
click, each store naming the group it comes from.
The summary under the Assignments step names those groups straight away too
("Food Giant: All Stores (all)"), where it used to read "#66 (all)" until the
group's company was opened.

## Sales: comparing two stores on one day

dev mode only

With a day picked in the strip and another store chosen to compare, the Sub
depts comparison set that day at the open store against the **whole week** at
the other one, so a single Friday read as hundreds of thousands behind. Both
stores now show the same day, including the last-week and last-year columns.
The week view was already right. Found by Wayne.
The panel beside the list now names the day too ("Fri, Oct 23 against …"
rather than "This week against …"), and compares the gap with the same day
last week and last year.

## Sales Export fixes

dev mode only

**A refused export says why.** When the server turned an export down, the page
always showed its own generic line ("The endpoint refused this
configuration", "One of these stores is no longer yours to export"), because
it read the server's answer from the wrong place. It now shows what the server
said: the store you no longer hold, the column or sort key it didn't
recognise. The same goes for every other failure on the page (saving,
deleting a build, reading saved work), and an export that comes back marked
as failed now includes the reason the server gave.

**A sort goes when its column does.** Sorting by a column and then unticking
it (or removing a sorted total, or switching between every line and a
summary) left that column in **Sort by**, and the next build was refused
because the file no longer had it. The sort now drops it at once and keeps
the rest in order.

**Applying the query keeps your stores.** With only some stores ticked,
pressing **Apply to configuration** ticked every store again, because the
query never mentioned stores and Apply treats anything unmentioned as "all".
The query now carries the stores you picked (`storeid in (…)`), so Apply
keeps them, and you can narrow stores by typing them there too.

**Taking ORDER BY out of the query takes the sort out.** Deleting the
`order by` line from the query box and pressing Apply left the old sort in
force. It now clears it, and the Apply summary says "Sort removed".

**Rename only renames.** Renaming a saved query also replaced its text with
whatever was in the query box, and giving it a new name saved a second copy
instead of renaming the first. **Rename** now changes the name and
description only, on the same saved query. **Save as new** always makes a
new one.

**The Products and File name boxes show what's in force.** After loading a
saved configuration, reloading a build or applying the query, the product
codes, description terms and file name boxes kept their old text even though
the export was using the new values. They now update to match. Your own
typing is never overwritten while you're still in the middle of it.

**A saved sort on a row count comes back.** A summary sorted by its row count
(`row_count`) lost that sort every time the saved configuration was loaded,
with a note that the sort "named a column this configuration no longer has".
It now loads with the sort intact.

**A saved query's description can be removed.** Emptying the description of
a saved query and saving it (or renaming it) kept the old description. It
now clears.

**No more vendors or cashiers that can't be filtered on.** Some sales lines
carry a vendor or cashier name with no id behind it. Those showed up in the
Vendors and Cashiers lists (a vendor could appear as "null"), and
narrowing Cashiers with one of them in the list made the export fail
outright. They're no longer listed, since a filter can only work on the id.
Their lines still go into the file whenever that list isn't narrowed.

**What a load couldn't carry over is shown on the page.** Loading a saved
configuration or reloading a previous build closes its window, and the notes
about what didn't carry over (a vendor this range doesn't have, a sort on a
column that's gone) were left inside the Saved window, unseen unless you
opened it again. They now appear in a strip above the preview until you
dismiss them, and a new search clears them.

**Personal values show in the sample.** The sample used to hide customer
name, email, phone, address and location as "••••••", while the file always
had the real values. The people exporting need to see that information, so
the sample now shows them as the file does. Those columns are still marked
PERSONAL in the column picker, can still be turned on or off together, and the
export bar still says how many are in the file.

## UPC List: a Movement tab (Amanda's request, 28 Oct)

dev mode only

A new **Movement** tab answers "how much of this item did each store move,
week by week": units, or pounds for an item sold by weight, with refunds taken
off. Each item shows its stores down the side and its weeks across, with a
total for every store and every week. Stores in the search that sold none of it
keep their row of dashes, muted, so the list reads as checked rather than
incomplete. Each week's figure is shaded by how much it moved, on the same blue
scale as Sales Comp's day grid, so the stores carrying an item stand out; the
bottom row is the Total movement for each week.

The strip above the grid describes the one item on screen: the weeks, how many
of the searched stores moved it, **per store per week** (its total over the
stores that sold any, times the weeks) and **last week against the average of
the weeks before it**. The grid scrolls sideways when the weeks run wide, with
the store names pinned on the left and the totals on the right.

The weeks end on the search's end date; pick a Saturday for Sunday-to-Saturday
weeks. It opens on six weeks whatever the search covers, and a **Weeks**
control (1 to 13) sets how far back it goes; changing it
reloads only this tab, never Sales Comp or the others. The download icon
exports it as a CSV with a line per UPC per store and a column per week ending,
the shape a store's movement request asks for.

It reads the Item Actions sales endpoint one week at a time, scoped the way the
search was made -- the group for a group search, the store for a store search
-- through the same one-at-a-time queue as the other tabs, and only when the
tab is opened. That endpoint reports per store, so one call a week covers every
store in the group. A dedicated movement endpoint is planned
(`docs/backend-movement-and-store-lists-2026-10-28.md`, part A); the tab can
switch to it without changing what it shows.

## The date picker names the day

dev mode only

The single date on a search card now shows its weekday, "8/16 · Sun"
instead of "8/16", so you can see a week-ending date lands on the right day
before you load. Every dev page with a single date picker gets it.

## User Management: export a base group's users

dev mode only

The download button on a base group now exports its users as well as its
stores. The window has a Users section with **Assigned users** (people who
hold the group) and **Unassigned users**, each a list of username, first
name, last name and email, alongside the assigned and unassigned stores it
already offered. Tick any mix and they go into one file. It lists only people
at or below your own level, the same people the Users tab shows you.

## UPC List: tabs recover from a re-search, and no sales is an answer

dev mode only

**A search while a tab is loading no longer leaves it empty.** Pressing
Search again while Sales Comp, Price Opt, Trend or Association was still
loading cancelled the call, and if the search didn't change that tab's list of
UPCs -- the same UPCs again, or only new ones added -- the tab never asked
again: last year's figures stayed blank, or the tab read "No sales comparison
data", until you left it and came back. A cancelled call now asks again on its
own, for the search as it is.

**UPCs with no sales are no longer treated as an error.** When the UPCs asked
about sold nothing in the window, Sales Comp, Price Opt and Trend showed a "No
data was returned." warning and asked again on every visit -- for a new item
with no last year, that was the page's heaviest call every time you opened
Sales Comp. No sales is now a real answer: the item shows no figures, and it
isn't asked for again. A real failure still warns and retries on the next
visit.

## UPC List: batch 1 fixes (search and export)

dev mode only

**The tabs stay on the search you ran.** Changing the dates, store or group in
the re-search window and then closing it without searching used to steer the
next tab you opened: it fetched the new dates for the old stores, Sales Comp's
week figures moved to the new end date, and the header showed the new dates
over the old data. The search is now kept as it was when you pressed Search,
and the tabs and the header read that until you search again.

**Adding UPCs to the same group picks up its current stores.** Searching the
same group again with more UPCs looked the group's stores up and then threw
the answer away, so a store deactivated in the group since the first search
kept being searched. If the group's stores have changed, the search now counts
as a new one and every tab reloads for the current stores; if they haven't,
adding UPCs still only fetches the new ones.

**Two group searches can't finish out of order.** A group search waits while
the group's stores are looked up. Pressing Search again during that wait could
let the first search finish last and put its stores under the second one's
header. The Search button now reads "Searching…" and is disabled during the
lookup, and a lookup that returns after a newer search has started is ignored.

**"Selected UPCs" means the ticked ones.** With nothing ticked in the left
list, the screen says "No UPCs selected", but exporting "Selected UPCs"
downloaded every UPC. The option is now greyed out with "(none selected)"
until something is ticked.

**Export waits for the data.** Clicking Download while a tab was still loading,
or after its call failed, saved a file with headers only (or, on Movement, rows
of blanks that read like nothing sold), and the window closed as if it had
worked. Download is now greyed out until the tab has loaded every UPC the file
would hold, with a line saying what it's waiting for ("Sales Comp hasn't loaded
for 3 UPCs yet."). Sales Comp's summary also waits for last year to finish.
Trend and Association, which only export ticked UPCs, say "No UPCs selected."
when nothing is ticked.

## UPC List: batch 2 fixes (Trend)

dev mode only

**Trend compares against the 90 days before your start date.** Trend's data
runs from the start date to today, whatever the end date says, and compares it
with what came before. It used to ask for a flat 90 days ending today, so a
recent search compared against whatever was left of those 90 days, and a
search starting more than 90 days ago had no "before" at all: every item read
"New since pivot". It now always gets the full 90 days before the start date.
The "Since pivot" tile shows the real length of the window, labelled "from 8/1,
to date", so the active rates and the small-sample note are measured against
the right number of days. The window is also kept with the Trend data, so
leaving the page and coming back no longer shows "Since pivot 0d" or "NaN%".

**An item that stopped selling says so.** An item that sold before the start
date and not once since was labelled Growing, in green, with "Sales are up
-100.0%". It now reads **Stopped selling**, in red, with how much it sold a day
before and roughly how many units it would have sold since at that pace. It
counts toward "Declining items" (the tile says "incl. 2 stopped selling") and
goes in the Declining export.

**"Reduced availability" can come up.** The status is meant for an item that
sells as well as ever on the days it's on the shelf, but is on the shelf on
fewer days, so less of it moves overall. Its test compared two figures that
always moved together, so no item ever got it: the tile always read "0 of n"
and that export was always empty. It now compares units per calendar day, so
an item selling faster per selling day on half as many days is flagged, with
roughly how many units the missing days cost. The sentence gives the days as
shares ("sold on 50% of days since, down from 94% before").

**No more false "selling days dropped sharply".** A declining item's sentence
can add that it also sold on far fewer days. That compared raw day counts
across two windows of very different lengths (73 days in 90 against 15 in 16),
so an item selling nearly every day got the note. It now compares the share of
days with a sale in each window, and flags only when that share fell by more
than half ("sold on 30% of days since, down from 81% before").

## UPC List: batch 3 fixes (Association)

dev mode only

**Association never shows one seed's companions under another's name.** When
you ticked a different set of UPCs, the tab kept showing the previous set's
companions, KPIs and export, titled as the new set, until the new answer
landed. If that answer failed, the old companions stayed for good, or the tab
sat on "Navigate here to load associations" with no way to retry. Now the
tab says "Loading associations…" until the answer for the ticked UPCs arrives,
and a failed load shows the reason with a Try again button. The KPI strip and
the export follow the same rule.

**Looking up a companion's own associations no longer claims "No
associations found" by mistake.** Clicking one companion and then another
could show "No associations found" for the second while it was still
loading, and a lookup cut short by a new search or a server error showed it
for good. Now the tab says "Loading …'s associations" until that item's answer
arrives. If it can't load, the tab goes back to the seed view with a line
saying which item failed and why, which you can dismiss.

## UPC List: batch 4 fixes (Sales Comp)

dev mode only

**A part week at the start no longer skews week over week.** Week over week
compares the last full week with the average of the full weeks. Only the end
of the range was checked, so a search starting on a Wednesday counted
Wednesday to Sunday as a full week: an item selling the same every day read
as up 16.7%. A week now counts only when all seven of its days are inside the
searched dates.

**A week with no sales counts as zero.** The server only sends weeks that
sold, and the tab built its weeks from what came back, so a week with no sales
simply wasn't there. An item that stopped selling in the last week compared
its last selling week with its average and read as flat or up. Every week in
the searched dates is now in the week table, a week with no sales shows $0,
and it counts in week over week: that item now reads down 100%.

**The peak day is the real peak.** Each weekday's average was its total
divided by the number of weeks, so a weekday the dates include fewer times
was understated. Over Monday 10/5 to Wednesday 10/14 (two Mondays, one
Saturday), a $100 Saturday averaged $50 and lost the peak to two $60 Mondays.
Each weekday is now divided by how many times it falls in the searched dates,
for this year and last, in the item's figures, the KPI strip's peak day and
the export.

**vs LY compares like for like, and items that stopped selling stay in.** The
strip's vs LY added up every item's sales this year against last year's, so a
new item counted in full with nothing against it: two flat items and one new
one read up 33%. It now compares only items that sold in both years, and when
that's not all of them it says so ("on 4 of 5 items sold both years"). An item
that sold last year and not this year used to vanish from the list, the strip
and the export; it now stays in the list at $0, down 100%, with no peak day.

## UPC List: batch 5 fixes (Price Opt)

dev mode only

**The KPI strip, the item panel and the export agree on price points.** The
strip left out prices that rang but moved nothing (a sale and its refund,
say), while the panel and the export kept them, so one item could read 2
points and elasticity -1.7 in the strip and 3 points and "—" in the panel.
All three now leave those prices out, and the item list's "N price points
tested" follows.

**A weighed item's best-price volume is in pounds everywhere.** For a
by-the-pound item whose best price had no weight on its own row, the tile
showed "0" next to a per-pound price while the export wrote the ring count
as "ea". The volume now adds up every sale at that price and is shown in
pounds in both places, "0.00 lb" if that's what it moved.

## User Management: the ? help follows the real workflow

dev mode only

The help panel described a screen that has not existed for months: an edit
view of two tabs with a "Save access" button, a trash icon that "deletes", and
a user list with no access type in it. Anybody following it was hunting for
controls that are not there.

It now follows the tree as built. Six guides — add a user, change what they
can see, copy a setup, build a base group, switch somebody off or back on,
reset a password — each one walking the four steps of the wizard that is both
Add and Edit. The chips are labels as the screen carries them, so
**Check Availability** is named (nothing is checked as you type, which the old
help implied), and so are **Create user**, **Save changes**, **Deactivate
users** and **Inactive**.

Four diagnostics replace the single one: can't open a user, they can't see a
store they should, a base group isn't in my list, and a save didn't finish.
The second and third are the two that cost the most time on the phone — the
answer to "they can't see it" is almost always their access type, and a base
group you created is invisible until you grant it to yourself.

The glossary gained By group / By store, the Access column's four values,
Effective stores, Direct, Assign all and Check Availability.

Four new `data-help` anchors so the "Show me" button has something to point
at on this page: the tab row, the base groups list, a group's Stores/Users
sub-tabs, and its assign panel.

## Data Export (from Sales Export)

dev mode only

**Data Export, phase 1: Sales Export on the export router.** The page now
talks to the new export router (`export/sales`, `export/sales/preview` and the
`export/sales/builds` routes) instead of the old `sales/export*` ones, which
the router removes. Nothing on screen changes. Every export request is now
built from a fixed list of the fields the router takes, with the filters
nested where it expects them, so a filter can't be sent where the router would
quietly ignore it and export everything. Builds made before and after the
change both reload with their filters. This needs the new router on the dev
API: against today's dev API the page's calls 404, so it ships together with
that backend deploy.

**Data Export, phase 2: Sales rebuilt so other data can follow.** Nothing on
screen changes: the same rows, in the same order, with the same labels, lists,
searches and notes. Underneath, everything that was specific to sales lines
now comes from one description of the Sales data: which filters it has, the
list each is picked from, the column it narrows, and how a row reads. The
Configuration panel, the sample's narrowing, the query box, the export bar,
saved configurations, reloading a build and the request itself all read that
description, so adding Orders, Invoices and Markdowns is adding their
descriptions. Saved configurations now record which data they export; every
configuration saved before this loads exactly as it did, as a Sales one. The
page also checks its filter names against the export router's own list before
a build, so a mismatch is stopped on screen instead of after the wait.

**Data Export, phase 3: Orders, Invoices and Markdowns.** The search card now
asks what to export: Sales, Orders, Invoices or Markdowns, each with a line
saying what a row is. Sales is picked by default. Each source shows its own
filter rows in Configuration: Orders has order types, statuses, vendors, sub
departments and categories; Invoices has vendors, sub departments, categories
and statuses, plus voided lines, refunds and returns under Output (no cashiers);
Markdowns has types (waste included), vendors, sub departments and categories.
Stores, days, products, columns, group by, aggregates, output, the sample, the
query box, Saved and Previous builds work the same for all four. A new Data
line at the top of Configuration names the source, and its Change button goes
back to the search card with the store and dates kept. Each source is fetched
once per search: switch from Sales to Markdowns and back, and Sales comes back
as you left it, without being fetched again. A different store or dates is a
new search and fetches again. The search card's Back button returns to the
source you came from while the search is unchanged. Saved configurations are
listed per source; Sales keeps its existing list. An empty file name now means
the table's own name, so the File name box shows "sales" greyed out instead of
filled in, and the file is still called sales. Needs the new export router on
the dev API, like phases 1 and 2.

**The sample's footer no longer says personal values are hidden.** Since the
masking came out this morning the sample shows them, but the line under it
still said "Personal values are hidden here". It now says the personal columns
are shaded and their values are shown and written to the file.

**Data Export, phase 4: the name, the address and the help.** Sales Export is
now Data Export: in the Coming Soon menu, on the search card and in the help.
Its address is /data-export; the old /sales-export forwards there, so a
bookmark, or a session last left on the page, still lands on it. The "?" help
is rewritten for all four tables: the Data choice on the search card, a new
guide to switching tables with Change and Back, each table's own filter lists
(Invoices has no Cashiers), Output's voids, refunds and returns, saved
configurations and Previous builds per table, and the personal columns as they
are now (shown, not hidden). The Coming Soon overview (the client hand-out)
has its section renamed and rewritten the same way, and no longer says the
sample hides personal values. Tickets filed from the page still
go under Sales.

**Tickets filed from Data Export go under a new Export category.** They went
under Sales, but the page now exports orders, invoices and markdowns too. The
category needs an "Export" row in the help desk's ticket categories before
this reaches anyone (the SQL is in docs/ticket-categories-2026-10-29.md);
until then a ticket from the page arrives with no category rather than a wrong
one.

**The Data Export search card is shorter, so its calendars fit.** With the
four Data choices on it, the card had grown tall enough that the date pickers
opened off the bottom of the window. The description under the title is gone,
and each choice is one line, its description beside the name instead of under
it.

**The Data choices use the app's own checkbox, without a "Data" heading.**
The four choices on the search card were native radio buttons in the
browser's blue; they now use the same checkbox as the rest of the page, and
still pick one of the four. The "Data" heading over them is gone, and the
card's description is back, shorter: "Choose the data, a store or group, and
a date range, then shape the file from what the search finds."

**Data Export: Change opens the search over the page, and the "?" opens the
help panel.** Change on the Data line now opens the search card as a popup
over the loaded page, with the table, store and dates already on it, the way
the other pages search again; clicking outside it closes it and nothing
changes. The magnifier at the top of the configuration is gone: a new search
is a different store or dates on that same card. The "?" in the configuration
opened an old help page that does not exist for Data Export (an "Access
Denied" box); it now opens the help panel the other pages use, rewritten
against the page as it is: searching, shaping and building, switching tables,
summaries, the query box above the sample, saved exports and previous builds,
and what each list, Output and the bottom strip mean. The file is now always
built over the dates that were searched, even if the search card's dates were
changed and left without searching.

**Saved queries are kept per table.** The Queries list above the sample
showed one list for all four tables, so a query written for Sales turned up on
Orders and stopped at its first Sales column. Each table now has its own list,
like saved exports. Every query saved before today was written for Sales and
stays in the Sales list. Switching tables and back keeps each table's list
without reading it again.

**A search from Change that fails no longer throws the page away.** If the
new search failed (a server error, or the connection dropping), the page fell
back to the bare search card, and with new dates everything configured was
gone. Now nothing is let go until the new answer has arrived: if it fails, the
page comes back exactly as it was, every other table kept with it, and the
message says "The page is as it was."

**Deleting a saved export checks that it really went.** When the server
failed the delete but still answered "OK" with an error inside, the export
disappeared from the Saved list and came back the next time the list was
read. It now stays in the list, and the window says "That did not delete."

**Saves and errors stay with the table they were for.** A saved export that
finished saving after you had switched tables showed up in the other table's
Saved list, and a "could not delete" or "could not read" message from one
table could show on another. Each answer now goes only to its own table. A
table left while its saved list was still loading reads it again the next
time Saved is opened.

**A slow build that times out gives the right advice.** When a big build ran
past the usual wait and the connection then gave up with an error code, the
page said "The export failed" and people built again. It now says the
connection gave up before the file was ready and to look in Previous builds
in a minute, because the file is usually still being written.

**Previous builds no longer gets stuck on "Reading your builds...".** Deleting
or labelling a build and switching tables before it answered could leave the
other table's Previous builds saying "Reading your builds..." with Refresh
greyed out. Each table's list now only shows its own loading and its own
errors.

**Load config on the same table and dates reads it again.** Pressing Load
config in the Change popup without changing anything closed the popup and did
nothing, so there was no way to pick up rows that had arrived since (after the
nightly import, say) short of changing the dates and back. It now reads the
table again: Group By, Aggregates, the sort and Output stay, and the lists
start full again from the new answer. The help says so.

**The Data choice works as one choice from the keyboard.** The four Data rows
on the search card look the same, but now act as a single choice: Tab lands
on the picked one, the arrow keys move the pick, and a screen reader announces
it as one of four rather than four separate checkboxes.

**Internal: leftover state from the old query window removed.** Nothing on
screen changes; two unused fields and their two actions came out of the Data
Export page's state.

## User Management fix plan (2 Nov sweep)

dev mode only

**Add user opens blank after a Duplicate.** Duplicating someone filled in the
Add user form, but the copy was never let go: every later Add user, even after
Cancel, opened as a copy of that same person until you signed out. The copy
is now used once, and Add user from the list always opens blank.

**Add user can't create someone with no access.** In Add user, the step bar
let you jump to Review after going back and emptying an earlier step (Clear
all on Assignments, or blanking a field on User info), and Create user then
made the person with nothing. Review is now ready only when User info, Access
type and Assignments all are, the step bar won't jump past a step that isn't,
and a greyed-out Create user says why underneath ("Finish User info first.",
"Give them at least one company or group on Assignments.").

**Duplicate copies every company.** A duplicate only copied the companies its
groups were in, so a company the source held with no group in it was left
behind. It now starts from every company the source holds.

**Choosing Single Store says what it changes, and choosing another role puts
it back.** Picking the Single Store role cut the store picks down to one
without a word, and switching the role back didn't restore them; someone
granted By group came out By store with nothing picked. Now a note says what
Single Store kept ("Single Store keeps only 301 · Food Giant; the other 2
stores are unpicked"), and changing the role back puts the picks back as they
were.

**An Edit save no longer undoes a change made on the Companies tab.** Adding
someone to a company on the Companies tab didn't reach the Users list, and
Edit started from that old list. Its company save sends the whole list, so
saving an Edit afterwards quietly took the new company back off (or put back
one that had just been removed). Edit now reads the person's companies from
the server when it opens, and every change on the Companies, Base Groups and
Stores tabs refreshes the Users list.

**"Press Save changes to try the rest" works after a partial save.** When part
of an Edit's access save failed, the page re-read what had saved and then
replaced your changes with it, so nothing was left to save and Save changes
went grey while the message said to press it. Your changes now stay on
screen, only what saved is re-read, and Save changes sends what's left.

**A name change survives switching tabs.** Changing someone's name in Edit,
clicking another tab and coming back left the new name on screen, but the
page no longer counted it as a change: Save changes stayed grey, or a save of
their access said "saved" and the name went back. The details as they were
opened are now kept with the person, so the change still counts after a tab
switch.

**Edit can save a name or email change for anyone, and says why when it
can't.** Save changes needed every step to be complete, so someone with no
company or group, or with a blank first or last name, couldn't have their
name or email fixed, and the button was just grey. Now a details-only change
needs only valid details, an access change needs Assignments to be complete,
a name that was already blank may stay blank, and a greyed-out Save changes
says why underneath ("Nothing has changed yet.", "Finish User info first.").

**Edit's Review names every group.** Jumping straight to Review in Edit named
groups by number ("Group 66") unless their company had been opened on
Assignments. Review now names the groups the person holds either way.

**Edit shows the right person's stores, and a failed load says so.** Opening
one person after another could briefly show the first person's stores, and
kept them if the second person's stores didn't load. A failed load of
someone's groups, stores or picks also looked like they held nothing. Opening
a person now clears the last one's stores, a failed load shows "Couldn't read
their …" with a Retry button, and Save changes stays off until everything
they hold has loaded.

**Effective stores stops listing removed stores as Direct.** Unticking a group
someone held By group (or switching them to By store and unticking a store)
left that group's stores in Effective stores marked Direct, "no group change
can take it away", and the count didn't drop, though the save did remove
them. Direct now means only stores held with no group behind them, so the
column shows what the save will leave.

**Add and Edit offer only the base groups you hold.** The Base Groups tab
listed only the groups you hold, but the Assignments step of Add and Edit
listed every group in the company, so a manager could hand out groups they
couldn't see or manage. Below level 9 (and outside DCR support), Assignments
now offers only your own groups. A group the person already holds that isn't
yours still shows, marked "not yours to change", and can't be ticked off or
cleared by Clear all.

**Adding someone to a base group no longer makes them Mixed.** On a base
group's Users sub-tab, Assign always granted the group By group, so a person
set up By store came out Mixed, and their next Edit showed the group with no
stores and wouldn't save until stores were picked. People are now given the
group in their own access type: By store people get it with all of its
current stores picked. The lists show each person's type beside their name.

**A group's box shows it's held, and ticking it never counts a store twice.**
On Assignments, a group someone held through one of its picked stores showed
an empty box, and ticking it added its whole store list again, so the count
read "11 of 10 picked" (the save removed the duplicates). The box now shows
the group as held, and ticking a group merges its stores with any already
picked.

**Assign all and Unassign all ask first, and wait for each other.** On the
Companies and Stores tabs and a base group's Stores and Users, Unassign all
took everyone off in one click, the person pressing it included, and a second
click could fire while the first was still saving. Unassign all now always
asks ("Take Food Giant off 38 people, including you?"), Assign all asks when
it's more than five, and the buttons wait while a change is saving. The
Companies tab also re-reads everyone's companies at the moment of the change,
so it can't undo a change made elsewhere since the list was loaded.

**New base group: one click makes one group, and you're told how to fill it.**
Create could be clicked twice and make two groups. And for an owner below
level 9, the new group disappeared from the list (it only lists groups you
hold) with nothing on screen to say why. Create now waits while it's saving,
and after creating, a note says you don't hold the new group yet, with an
"Assign it to me" button that gives it to you By group so you can fill it.

**Add user enforces the password rules it shows.** The form listed the
password rules (12 characters, upper and lower case, a number, a symbol) but
accepted anything, "a" included, and a username or email marked "Not
available" didn't stop you continuing. Continue now waits until every rule
is met and neither is marked Not available. The server still needs the same
rules on its side.

**Export works while adding or editing someone.** The Export button in the
User Management header did nothing while Add user or Edit was open. It now
opens the users export from any screen on the Users tab, with the list's
filters applied as before.

**The users list says when it's loading, or that it failed.** While the users
were still loading, or when loading them failed, the list said "No users
found", and the company filter read "No company (0)". It now says "Loading
users…", or shows what went wrong with a Retry button.

**Add and Edit ask before throwing away your changes.** Cancel, Back to users
and clicking another tab all dropped a half-filled Add user or an unsaved
Edit without a word. They now ask "Discard your changes to …?" first. Nothing
asks when nothing has changed.

**Internal: an Edit save no longer resets two account fields.** Saving
someone's details also wrote two account fields (template and security) back
as 0 every time. Each save now sends back the values the person already had.

**User Management says "no access" below level 5 instead of breaking.** The
menu hides User Management below level 5, but the page could still be
reached by its address, and then it looked for a tab that no longer exists.
It now says "You don't have access to User Management."

**Effective stores' empty message no longer mentions a setting that's gone.**
With nothing granted, Effective stores said "pick some, or set a group to
Auto", a control that no longer exists. It now says "tick a group, or pick its
stores By store".

**Reset security asks first.** On a user's security screen, Reset security
acted on the first click. It now asks, and says the person will have to set
a new security question the next time they sign in.

**Renaming and deleting a base group behave.** Renaming saved twice (once on
Enter and again when the box lost focus), had no way to back out, and jumped
back to the Stores tab. Enter now saves once, Escape cancels, and you stay on
the tab you were on. Deleting a group now says that everyone who holds it
loses its stores, and a double-click on the confirmation deletes it once.

**The users export knows when the list is filtered, and includes Access.** The
export decided whether the list was filtered by comparing counts, so a filter
that happened to match everyone read as "No filters currently applied". It
now goes by whether any filter is set. The file also gains an Access column
(By group, By store, Mixed, Not set), as the list shows.

**The users list sorts by column.** Rows came in whatever order the server
sent them. Clicking First name, Last name, Role, Level, Access or Last visited
now sorts by that column; a second click reverses it and a third goes back to
the original order. People with no value (never signed in, say) stay at the
bottom either way.

**User Management's "?" help matches the page again.** It promised Effective
stores in Add user (it's only in Edit, on a wide window), had nothing on the
Companies tab, the Stores tab or Export CSV, gave one reason for a greyed-out
Save changes where there are several, and said a part-saved Edit showed only
what saved. It now has guides for Companies, Stores and Export CSV (with the
warning that Assign all and Unassign all there take everyone in the list),
explains the reason line beside Create user and Save changes, the Single
Store note, Retry when something doesn't load, the "Discard your changes?"
question, "not yours to change", Assign it to me after creating a base group,
how a group's Users sub-tab now grants in each person's own type, and column
sorting.

**Companies tab: Assign all and Unassign all take only what the column shows.**
They used to take everyone in the list whatever the search box said, so with
one person left by a search, Assign all asked to add all 272. Each button now
takes exactly the people its column is showing, search and company filter
included.

**Assign all and Unassign all show who will move.** The question before Assign
all or Unassign all now lists everyone it would move, by name and email, so
you can see the search narrowed it the way you meant before saying yes. On the
Companies tab both buttons always ask, however few people it is.

**Stores tab: Assign all and Unassign all take only what the column shows.** As
on the Companies tab, each button now takes exactly the people its column is
showing, search included, instead of everyone in the list.

## UPC List: pre-publish audit fixes (3 Nov)

dev mode only

**Association no longer sticks on "Loading associations…" or shows the wrong
error.** Changing the ticked UPCs quickly (A, then B, then back to A) could let
B's late answer overwrite A's, leaving the tab on "Loading associations…" with
nothing asking again. And after one set failed, the next set showed the old
set's error while it loaded, in the export too. An answer or error now only
counts for the set of UPCs still ticked.

**Price Opt's best revenue matches its volume.** For an item rung under two
descriptions, "Volume at best" added up every sale at the best price, but
"Best revenue" took only one of them, so the two figures side by side
described different sales ($120 beside 61.50 lb at $3.99/lb). Both now come
from the same sales, on screen and in the export.

## The page background

dev mode only

**A slightly different page background.** The grey behind the cards and
panels (the `bkg` theme colour) is a touch darker and less blue, `#dee5e8` in
place of `#e4e9ef`, on every screen.

## Item Actions: pasted UPC lists (3 Nov)

dev mode only

**Item Actions reads a whole pasted list even with a short value in it.**
Pasting a long comma-separated list and pressing Add kept only the first UPC
when the list held one value too short to be a code (a stray "697" among 1,963
UPCs). Every code is now added, and a note says which values were left out as
too short.

## Sales: final clean-ups (3 Nov)

dev mode only

**Sales investigate: "Margin diff" is now "Margin $ Gap".** The items grid's
column is the gross-profit difference in dollars between the two stores, not a
margin percentage, and the new name says so. The export's column is renamed
to match (margin_dollar_gap).

**Top 200 follows the day cards.** With one store open, picking a day in the
day cards narrowed the other tabs but the Top 200 stayed on the whole week. It
now shows that day's top 200, against the same weekday last week and last
year, with its share taken of that day's net sales, and its headings name the
day instead of "This week".

**Top 200's department bars are plain navy.** Before an item is picked, the
Top 200 shows each sub department's share as a bar. The bars were coloured by
grade, which made a bar's length read as a verdict. They are now plain navy
and show only how much of the money each department took; the grade stays on
the vs LW / vs LY pill at the end of each row, and the Crit, Watch and OK chips
still filter by it.

**Top 200's department list shows sales only.** Before an item is picked, the
Top 200 lists each sub department with its share bar and its sales, and
nothing else: the Crit / Watch / OK chips, the vs LW / vs LY switch and the
comparison column are gone, and the sales column is headed "Sales". Last week
and last year are still in each item's own detail.

**Top 200 lists every sub department.** The department list showed the
biggest nine and folded the rest into one "8 more" line, with a count strip
above it. Both are gone: every sub department is listed, biggest first.

## Sales: Daily recap

dev mode only

### A Daily recap tab in the store panel

Asked for by the boss: every item sold, with its sales and units, by the day.
The store panel gains a fifth tab, Daily recap, beside Top 200. It lists the
week one row per day: net sales (the day card's own figure), transactions, the
average basket, units and the busiest hour, with the week's totals underneath.
A store that sells by weight also gets a Pounds column.

Click a day to open its sub departments, biggest sales first, each with its
share of the day as a navy bar; click a sub department for every item it sold
that day, with units, sales and average price (per pound for a weighed item).
Picking a day card shows that day alone, with its figures across the top. A
search by name or UPC keeps only the days and sub departments that sold a
match. The download is a CSV with one row per item per day.

It is a summary, so nothing on it is graded and nothing compares to last week
or last year. It always shows the open store, even with a comparison store
chosen. Fuel, lottery and cash are left out of the sub department list, as on
the day cards, and their amount is shown under it. The items are read when a
day is opened, so a day's item counts take a moment to appear. Built on branch
`daily_recap`, not yet merged into master_publish.

### The Daily recap download moves into Export CSV

The recap's CSV is now the Daily Recap option in the store panel's Export CSV,
beside Weekly Summary, Sub Department and the rest, instead of a button on the
tab. It reads the week's items a day at a time when you download, and if a day
cannot be read the section's title says which day is missing. The button on
the export modal now says "Reading the data…" while any option is fetching,
not only Financials.

### Daily recap shows the rest of each day, not its items

Reworked after review: opening a day used to list its sub departments and
items, which Top 200 and Sub depts already show. The tab now leads with four
figures for the week (transactions, average basket, units, busiest hour) and
lists the days with a net sales bar and a small strip of each day's hours.
Opening a day shows its net sales hour by hour with the busiest hour, the
slowest full hour and the hours it traded; its baskets (transactions, average
basket, items per basket, average item price); its money as a sum you can
check (sales with tax, less tax, is the day card's net sales, with fuel and
lottery named as left out); and its refunds and the share of sales at regular
price against on sale. A store that sends no price type, like Sonic, shows
the price mix as Not reported. There is no coupon figure, because the register
already nets coupons into sales and the coupon columns repeat that money.
An Export Daily Recap button at the end of the tabs opens Export CSV with
Daily Recap already ticked.

### Daily recap no longer crashes on a store that sends a numeric price type

Opening a day crashed the whole panel ("price_type.trim is not a function")
when the store's POS sends its price type as a number rather than text. The
recap now reads the type either way. Found in testing on daily_recap.

### Daily recap: the day cards pick the day, and it fits the panel

The tab now has two views. The week shows four figures (transactions, average
basket, qty, busiest) and one striped row per day: net sales, transactions,
average basket, how many different items sold, qty, weight where the store
weighs things, and the busiest hour with a small strip of the day's hours.
The rows are figures only. A day is picked from the day cards above the tabs,
as on every other tab, and the tab turns to that day's full recap: its hours
as a chart that fills the space, then Baskets, Money, and Refunds and price
mix. All week goes back.

Both views fit the panel at any zoom: the days share the list's height
evenly, a short panel tightens everything, and a narrow one drops the hour
strips, puts the chart's facts under it and wraps the cards. Nothing spills
sideways, and only a panel too small for the minimums scrolls.

### Daily recap: hour tooltips, a grey facts panel, and stripes

Hovering an hour on a day's chart shows a tip that follows the mouse: the
hour's net sales, its share of the day, transactions, average basket and qty.
It stays on screen at any panel size or zoom, flipping away from the edges.
The busiest / slowest / trading facts beside the chart now sit on the theme's
grey to set them apart, and the week's day rows are striped like the other
grids. A store that weighs things gets Baskets four across so it stays two
rows tall.

### Daily recap: a day's cards get their own edges

A picked day's recap now sits on a slightly deeper tray, with the day shown
as a small date block beside its net sales. Each card has a titled bar with
an icon. The hour chart has dollar gridlines and a firm baseline, its busiest,
slowest and trading facts sit on their own tinted rail (trading now says how
many hours), Baskets shows its figures as tiles with the lead three
emphasised, Money sets net sales on its own band under the sum, and the price
mix is a labelled two-part bar with a legend.

### Daily recap: one-line day heading; the export is Export CSV only

The picked day's heading is back to one line above the cards (the day, its
net sales, and the way back), and the Export Daily Recap button is gone from
the tab strip: the recap downloads from the Daily Recap preset in Export CSV,
beside the other Sales exports.

### Daily recap: the hour chart is whole again; cards on white

The day's hour chart was cut off at the bottom (the $0 line and hour labels
missing) when its facts rail was taller than the room it was given. It now
never shrinks below its contents; a short panel scrolls instead. The cards
sit on the panel's own white with the theme's medium shadow, and Baskets goes
four across at a store that weighs things so it stays two rows.

### Daily recap: a day's recap as a two-row grid

A picked day now reads as a grid: Money, Baskets, and Refunds and price mix
across the top; Averages and the hour chart (two columns wide) underneath,
taking the rest of the height. Baskets is just the counts (transactions,
items, qty, and weight where the store weighs things); the per-basket and
per-unit figures moved to the new Averages card. The hour chart is back to
its earlier look, with its hover tooltip kept. On a narrow panel the grid
goes two across, and a short panel scrolls rather than cutting anything off.

### Daily recap: cleaner hour chart; Averages matches Baskets

The figure printed over the busiest hour's bar is gone (it ran into the
chart's title on a tall day); the facts panel beside the chart already gives
it, and its amounts under Busiest and Slowest are now semibold. Averages is
laid out as tiles, the same as Baskets beside it.

### Daily recap: two more averages, and tiles that fill their card

Averages adds sales per hour and baskets per hour, over the hours the day
traded (first sale's hour to last). Its tiles and Baskets' now stretch to
share their card's height, so Averages fills down beside the hour chart; at a
store with an odd number of averages the last tile takes the whole row.

### Daily recap: a picked day as board 15, with Exceptions

A picked day now opens straight to its cards, with no heading line (the day
card and Money already say it). Across the top: Money (the day's net sales,
the sum behind it, and the price mix as a bar with each side's dollars),
Baskets (transactions and the average basket, then qty, average unit price,
weight where the store weighs things, and items), and a new Exceptions card:
how many transactions had a void, cancel, refund or no sale and their amount,
then each type with its count and amount. A transaction is one receipt
however many lines it voided. Underneath, net sales by hour across the full
width, with busiest, slowest, sales per hour and baskets per hour in a column
beside the chart; hovering an hour still shows its figures.

The exceptions come from /cashiers/exceptions, read once for the week when
the tab opens. Tender lines are left out: they are payments, not exceptions.
Figures are separated with "|" rather than dots.

### Daily recap is now Summary, and a store opens on it

The tab is renamed Summary and moved to the front of the store panel's tabs;
clicking a store in the left panel now opens it on Summary rather than Sub
depts. In the group view's store detail, the button that opens the store now
reads Open Store Comparison.

### Summary reads each day once

Summary used to read a store's seven days again every time you came back to
it, from another tab or another store. It now keeps what it read for the
session (cleared on sign-out), shares a read already on its way instead of
sending a second, and no longer retries a failing read over and over.

### The Daily Recap export reuses what Summary already read

Downloading the Daily Recap preset no longer reads the week's items again for
every day Summary has already shown: it keeps each finished day's items from
Summary's own read and only reads what it does not have, usually just today.
Today is always read fresh, since it is still changing. The kept items are
limited to about two store-weeks and cleared on sign-out.
