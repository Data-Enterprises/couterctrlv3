# Since the last publish

Every edit made after a publish goes here as it happens, in the words the
release notes will want. When we reach a stopping point this is what the dated
HTML in `Documents\ccc-release-notes` gets written from, so nobody has to walk
back through the log to work out what changed.

Wipe this file at the next publish and start again.

**Last publish:** 2026-11-04 &middot; `master_publish` at `f251f251` ("ready to
publish to dev", 3 Nov) merged to master as PR #58 (`691c3afb`). The log of
everything in that publish is this file as it stood at `691c3afb`.

---

## Tickets

dev mode only

### A ticket names the store the page was about

Filing a ticket from a page with its own store picker (Item Actions, Item
Lookup, Categories, Vendors, Sub Dept Margins, both Price Optimization pages
and Receivers) showed whichever store was last searched on Sales in the box at
the top of the form, ticked that store in the store list, and sent it with the
ticket. Found in testing: a ticket from Item Actions read "002 - IGA IRVINGTON
KY 2" because that store was open on Sales. The form now reads the store the
page itself picked, and where the page ran a date range, that range goes with
the ticket too. With nothing picked on the page, the box names no store rather
than a wrong one. `d84664cd`.

## Item Actions

dev mode only

### Build actions sits at the bottom of the card

The UPC box and its Add / Upload CSV buttons now come before the navy Build
actions button instead of under it, so the card reads top to bottom: store,
date, UPCs, then build. The button used to say "Add a UPC list" above the box
it was asking for. `6d32d341`.

## Sales: Top 200

dev mode only

Single-store Top 200 with a day picked: the vs Last Week and vs Last Year headers now show that one day's date (e.g. 10/22/2026), as Top 200 Sales does, instead of the date written as a range to itself. `301e9d3d`.

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

### Opening a store from the list starts on All week

Clicking a different store in the left panel now opens it on Summary with the
day cards back on All week, rather than keeping the day picked for the last
store. Opening a store from the group comparison still keeps its day, since
that day is part of the comparison being looked at.

### Summary's hour card is titled Hourly

The card with the hour chart in a picked day's Summary is now titled Hourly.

Summary's All week view is now the same view as a picked day (board 16): Money, Baskets and Exceptions across the top and Hourly across the bottom, with the week's figures. The day cards filter it. The seven-row day table and the week tiles are gone. For the week, Items counts each different item once however many days it sold on, Hourly adds each hour up across the seven days (hourly only, no by-day view), and sales and baskets per hour divide by the hours the store actually traded across the week. Help text updated to match.

Summary's Money, Baskets, Exceptions and Hourly cards now carry the theme's navy card shadow, so they lift off the panel instead of sitting flat.

Summary can now list every item sold. A View items button at the top right of the Baskets card (its tip says "Shows all items sold this week", or names the day picked) switches Summary to an item view: UPC, description, sub dept, vendor, units, weight at a store that sells by weight, and net sales, biggest first, 100 to a page (250 or 500 on request). Search by name or UPC and narrow by sub depts and vendors; with a vendor ticked an item counts only that vendor's share. A totals row at the bottom covers the whole filtered list. The day cards filter it like the rest of Summary: picking a day inside the item view lists that day's items, and Back to summary shows that day's cards. No new reads for finished days: it uses the item rows Summary already reads; today's are held only while Summary is open. A vendor sent as 0 shows as a dash and is filed under No Vendor in the filter.

The Summary item view has a Clear all button after the Vendors filter. It shows only while a search or filter is narrowing the list, and empties the search, Sub depts and Vendors in one click; the sort stays as it was.

The Summary item view now sits straight in the panel, filling it edge to edge like Top 200's list, instead of a bordered card on a padded tray.

The item view's Vendor column is narrower (130px, 100px on a narrow panel) and Description takes the difference, so more of each item name shows.

Units, Weight and Net sales sit a little closer together in the item view, their spare width going to Description.

The item view's Units column is now headed Qty. The Daily Recap export follows the item view: a vendor column (every vendor that sold the item that day, biggest first; blank for none) after the description, and units renamed qty. The preset's description and the help text say so.

The item view's search is now the app's standard TextFilter: magnifier, a clear X, and the filter-active highlight while it is narrowing the list.

Fixed in the item view: Sub dept, Vendor and the figure columns sat to the left of their headings by the width of the list's scrollbar (the rows scroll, the heading and totals did not, so Description was narrower in the rows). The heading and totals rows now keep the same scrollbar gutter, so every column lines up. A vendor sent as 00 or 000 is also treated as No Vendor, like 0.

The item view's Net sales column is now headed Sales and sits left of Qty: UPC, Description, Sub dept, Vendor, Sales, Qty, Weight. It is still net sales and still the default sort, biggest first.

In the item view, the Qty and Weight figures are semibold like Sales.

The item view's Weight column drops the lb and shows three decimal places (105.700), in the rows and the totals row.

The Daily Recap export's columns follow the item view's order after the date: product_code, description, sub_department, vendor, net_sales, qty, then pounds at a store that sells by weight.

The tooltip that follows the mouse (Summary's hour chart, View items, an item's vendors) is now a global dev component in src/components-dev/tooltip: useCursorTip, CursorTip for words, CursorTipBox for a laid-out readout. The store panel's header icons, See item actions and Export CSV, use it in place of the browser's dark title box. docs/theme-reference.md now names it as the app's tooltip.

Right-clicking an item in the Summary item view opens the app's UPC menu: Copy UPC for that item, or Copy all UPCs for every item the search and filters leave, across all pages, in the list's order.

The Daily Recap export is now Items Sold: Summary's item grid as a file, one row per UPC with its totals (sub dept, vendor, sales, qty, weight), not one row per item per day. Under the preset, From and To pick one date (11/3) or a range (11/1 to 11/3), up to 31 days; they start on the day picked in the day cards, else the week, and This week resets them. For the week the file has the grid's row count and adds up to the All week card (checked on 020 IGA Owensboro: 7,047 UPCs, $166,410.16).

Items Sold's file has no title row; it opens on its column headings. If a day could not be read, the warning names it. The file is named for its date or range (020___IGA_OWENSBORO_KY_Nov 3, 2026.csv, or ..._Nov 1 – Nov 3, 2026.csv). From, To and This week are greyed out and inactive until Items Sold is ticked.

## Platform: tooltips

dev mode only

Every hover tooltip in dev mode is now the app's own light tip that follows the mouse, instead of the browser's small dark box: icon buttons, truncated names, column heads and the rest, on every dev page and the shared menus. Not in Legacy and not on phones. Production screens are unchanged.
