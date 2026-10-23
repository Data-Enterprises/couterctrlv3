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

`461aee5f`

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
