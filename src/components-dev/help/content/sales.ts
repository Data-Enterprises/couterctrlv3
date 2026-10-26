import type { HelpContent } from "../helpTypes";

/** Help for Sales — the store ledger and the report behind one store. */
export const SALES_HELP: HelpContent = {
  screen: "Sales",
  purpose:
    "How each store's week compares to last week and last year, and where the change came from.",

  guides: [
    {
      id: "load",
      title: "Load a week's sales",
      desc: "Pick who, pick the week, read the list",
      steps: [
        {
          title: "Pick a store or a group",
          pre: "Choose one in the search card. If results are already showing, the card is closed: click the magnifying glass in the dark header to open it. The button reads",
          chip: "Select Store",
          post: "or Select Group until you have picked one.",
          anchor: "search-card",
        },
        {
          title: "Pick the week",
          pre: "Choose a week-ending date in the same card. You always get the seven days ending on that date.",
          see: "Nothing yet — the dates are read when you load.",
          anchor: "search-card",
        },
        {
          title: "Load",
          pre: "Press",
          chip: "Load Stores",
          post: ".",
          see: "A row per store: TY for this week, with last week and last year beneath the name, and vs LW and vs LY as percentages.",
          anchor: "list",
        },
        {
          title: "Change the search later",
          pre: "Click the magnifying glass in the dark header to go back to it without losing your place.",
          anchor: "search",
        },
      ],
      issues: [
        {
          q: "The total at the top does not match any row",
          a: "It is the combined total for every store loaded, not the selected one.",
        },
      ],
    },
    {
      id: "one-store",
      title: "See why one store moved",
      desc: "Open a store, then look by department, day or hour",
      steps: [
        {
          title: "Open the store",
          pre: "Click its row. Its report opens on the right with this week's net sales against last week and last year.",
          anchor: "list",
        },
        {
          title: "Narrow to one day",
          pre: "Click a day in the strip. Click it again, or",
          chip: "All Week",
          post: ", to go back to the whole week.",
        },
        {
          title: "Find the department",
          pre: "Open the Sub dept tab and click a department to list its items. You can search by UPC or description.",
          see: "Items for that department. Inactive items sold last week or last year but have not sold this week.",
        },
      ],
    },
    {
      id: "top-items",
      title: "See which items earned the week",
      desc: "The 200 biggest sellers, and what each one cost you",
      steps: [
        {
          title: "Open Top 200",
          pre: "With a store open, choose the",
          chip: "Top 200",
          post: "tab.",
          anchor: "store-tabs",
          see: "The store's 200 biggest items for the week, biggest sales first. The number under each name is how many units that took.",
        },
        {
          title: "Read the landing report",
          pre: "Before you pick anything, the right side shows where the week's money came from: each sub department the top 200 sits in, graded, with this week against last week and last year.",
          see: "Click a department to narrow the list to it. Its total will not match the Sub depts tab — that one is the whole week, this is the top 200's share of it.",
        },
        {
          title: "Narrow it down",
          pre: "Search by name or UPC, filter to one sub department, or click Sales, vs LW or vs LY to sort by it.",
          see: "The heading says how many of the 200 are showing once anything is narrowing them.",
        },
        {
          title: "Pick an item",
          pre: "Click a row. The right side opens with a sentence saying what the figures add up to, then the numbers behind it.",
          see: "Sales and units, margin and profit, the average price a unit fetched and what a unit cost you.",
        },
        {
          title: "Check what retail is selling it at",
          pre: "The first section says how the item rang this week — all at regular, all on ad, or a mix — and at what price.",
          see: "All on ad usually explains a thin margin before the cost does.",
          anchor: "item-retail",
        },
        {
          title: "Check the cost",
          pre: "The next section holds the price against the cost, at today's price and at its top price. What it costs to buy compares your last invoice with the cheapest you have paid in the last 60 days; the invoices open from the right.",
          see: "A paid price in green on the invoice list is an allowance — you paid under the vendor's list price on that delivery.",
          anchor: "item-buy",
        },
      ],
      issues: [
        {
          q: "An item I expected is not in the list",
          a: "The list is the top 200 by sales for that store and week. An item that sold very little will not be there. Excluded sub departments — lottery, money orders, stamps — are left out entirely, the same as everywhere else on this page.",
        },
        {
          q: "A margin shows a dash",
          a: "Too few of that item's lines carried a cost to work out a margin worth trusting. The sales, units and prices are unaffected; only the margin and profit are withheld. Cost coverage on the right tells you what share of lines had one.",
        },
        {
          q: "There is no cost history",
          a: "Nothing was bought on an invoice in the last 60 days. The item still sold — it just has no purchase to compare today's price against.",
        },
      ],
    },
    {
      id: "top-items-compare",
      title: "Compare one store's top 200 with another's",
      desc: "What both sell, what only one does, and where the two really differ",
      steps: [
        {
          title: "Choose the store to compare against",
          pre: "With a store open, go to the",
          chip: "Compare",
          post: "tab and pick a counterpart. That choice follows you across the tabs — it is not a setting you make twice.",
          anchor: "store-tabs",
          see: "Sub depts and Top 200 both turn into comparisons against that store. Back takes the counterpart off again.",
        },
        {
          title: "Open Top 200",
          pre: "Choose the",
          chip: "Top 200",
          post: "tab. With a counterpart chosen it opens as a comparison instead of the single store's list.",
          anchor: "store-tabs",
          see: "A heading saying how many of the items differ, and a bar underneath splitting them into three.",
        },
        {
          title: "Read the three piles",
          pre: "The bar is every item across both lists: the ones both stores sell, the ones only this store has in its top 200, and the ones only the other store does.",
          anchor: "top200-piles",
          see: "Widths are counts of items, not money. The shared pile carries this store's sales for those items so you can see how much of the week the overlap accounts for.",
        },
        {
          title: "See where the difference sits",
          pre: "The strip under the bar names the departments the one-sided items fall in. Open it for the full count.",
          anchor: "top200-outline",
          see: "Eighty-eight differing items is a list; \u201cmostly Meat and Beer\u201d is an answer. Items both stores carry are left out of this count — they are not where the two differ in stocking.",
        },
        {
          title: "Narrow it down",
          pre: "The first dropdown picks which pile to show — all of them, the ones both stores sell, or the ones only one does. The second picks departments, as many as you like. The search box finds an item by name or code.",
          anchor: "top200-compare-filters",
          see: "They stack: one store's own items, in Meat, with “ribeye” typed, is a legitimate way to ask. The item search does not look at departments — that is the dropdown's job.",
        },
        {
          title: "Choose what the rows report",
          pre: "The last dropdown picks the figure on every row: \u201cShare gap\u201d in points, or \u201cSales gap\u201d in dollars. The list orders itself by whichever you choose \u2014 furthest apart first.",
          anchor: "top200-compare-filters",
          see: "Two readings of the same question. Share compares a big store with a small one fairly; dollars say what the difference is actually worth.",
        },
        {
          title: "Sort, if you want a different order",
          pre: "Above the list, on the right, is a sort that always names whatever the rows are reporting. Click once for biggest first, again for smallest first, and a third time to go back to the list's own order.",
          anchor: "top200-compare-list",
          see: "The third click matters: the list's own order is furthest-apart-first, which is the view this screen is for. A sort is a temporary lens over it.",
        },
        {
          title: "Read a row",
          pre: "Each row carries one bar. Its length is this item against the biggest item on screen; inside it, this store's share of the pair is green when ahead and red when behind, and the other store's is navy.",
          anchor: "top200-compare-list",
          see: "A hatched cap on the end means the other store does not have it in their top 200. The figure in the corner is the gap in share, in points.",
        },
        {
          title: "Open an item",
          pre: "Click a row. The panel puts both stores' figures side by side, and underneath, every price the item rang at and which store rang it.",
          anchor: "top200-compare-rail",
          see: "A blank cell in the price table is the finding: the other store never sold it at that price. A different shelf price explains a size difference far more often than anything about the shopper.",
        },
        {
          title: "Read the strip at the top of the panel",
          pre: "It is coloured by which way the item went and carries its name. Open it with the chevron for the code, the department, and \u2014 where only one store has the item \u2014 what the other store actually did with it.",
          anchor: "top200-compare-rail",
          see: "It lays over the panel rather than pushing it down, so opening and closing never moves the figures underneath.",
        },
        {
          title: "Copy the codes out",
          pre: "Right-click a row to copy that item's code, or anywhere else in the list to copy every code on screen.",
          anchor: "top200-compare-list",
          see: "What you copy is what you are looking at: narrow to one pile or one department first and the copy follows. The same menu as the sub department list and the investigation.",
        },
      ],
      issues: [
        {
          q: "It says an item is not in their top 200 — do they not sell it?",
          a: "Not necessarily, and the screen is careful not to say so. Both lists are each store's own top 200 by sales, so an item missing from one could be their number 250. When you open the row the panel asks the other store directly and tells you what it finds: either they sold none of it that week, or how much they did sell. Even that is a sales answer — a slow mover can sit on the shelf and ring nothing in a week.",
        },
        {
          q: "Why does the gap figure have a ≥ in front of it?",
          a: "Because the other store's share is unknown on that row, not nought. All we know is that it is below their number 200, so the real gap is at least the figure shown. On a row both stores have, the gap is exact and there is no ≥.",
        },
        {
          q: "The share percentages look small",
          a: "Share is of each store's own top 200, not of its whole week. It is the fair way to compare one store with another when one is simply bigger — but it means the denominators differ in character, and a store whose top 200 covers more of its week will read lower throughout.",
        },
        {
          q: "A row says the amounts are not comparable",
          a: "The two stores ring that item differently — one weighs it, the other sells it as a pack. Pounds against packages is not a comparison, so the panel shows both with their own units and offers no difference. Sales and share are still comparable: money is money.",
        },
        {
          q: "I sorted and now I cannot get the original order back",
          a: "Click the sort a third time. It runs biggest-first, then smallest-first, then returns the list to its own order \u2014 furthest apart first on whichever figure the rows are reporting. That is the ordering this screen is built around, so there is always a way back to it without reloading.",
        },
        {
          q: "Share gap or Sales gap \u2014 which should I be looking at?",
          a: "Share, when the two stores are different sizes: it asks what proportion of each store's top 200 the item is, so a big store does not simply win everything. Dollars, when you want to know what the difference is worth. The two orders can disagree completely, and both are right about their own question.",
        },
        {
          q: "The totals do not match the single-store Top 200",
          a: "They are different lists. The comparison holds every item in either store's top 200, so it is longer than 200, and the sales shown for the shared pile are only the items both stores sell.",
        },
      ],
    },
  ],

  fixes: [
    {
      id: "grey-percentages",
      title: "A percentage is grey, or says “3 of 7 days matched”",
      questions: [
        {
          id: "which",
          title: "What does the row show?",
          options: [
            { label: "A grey percentage with a day count", result: "partial" },
            { label: "A grey dot and no grade", result: "ungraded" },
            { label: "“No history” or a dash", result: "nohistory" },
          ],
        },
      ],
      results: [
        {
          id: "partial",
          tone: "ok",
          badge: "Working as intended",
          title: "That comparison is missing days",
          why: "Last week or last year does not have every day of this week — say last year only has three of the seven. The figure is still shown, but it is grey and does not decide the grade, because a part week cannot fairly mark a store Crit.",
          todo: [
            "Read the figure as a hint, not a verdict.",
            "Compare the store against last week instead, if that side is complete.",
          ],
        },
        {
          id: "ungraded",
          tone: "ok",
          badge: "Working as intended",
          title: "Neither comparison has a full week",
          why: "A grey dot means neither last week nor last year covers all seven days, so there is nothing solid to grade against and the store is left ungraded rather than guessed at.",
          todo: ["Check the day strip to see which days are missing."],
        },
        {
          id: "nohistory",
          tone: "ok",
          badge: "Working as intended",
          title: "There is nothing on file to compare with",
          why: "“No history” means none of this week's days have a matching day last year. A dash means that period has nothing to compare against at all — a new store, or a week before the data starts.",
          todo: ["Use last week for a store that has not been open a year."],
        },
      ],
    },
  ],

  terms: [
    {
      term: "In both / Only here / Only there",
      def: "The three piles the comparison splits every item into. \u201cOnly here\u201d means the item is in this store's top 200 and not in the other's — which is not the same as the other store not selling it.",
      anchor: "top200-piles",
    },
    {
      term: "Not in their top 200",
      def: "The furthest a ranked list can go. The item did not make the other store's 200 biggest sellers that week; it may still be their 250th. Open the row and the panel asks that store directly.",
      anchor: "top200-compare-list",
    },
    {
      term: "Sold none this week",
      def: "The answer after asking. The other store rang none of that item in the window — the closest the sales data comes to a distribution gap. It is not a shelf check: something stocked but slow can ring nothing in seven days.",
      anchor: "top200-compare-rail",
    },
    {
      term: "Share of top 200",
      def: "What the item contributed to its own store's top 200, as a percentage. Comparable between a big store and a small one in a way raw dollars are not.",
      anchor: "top200-compare-rail",
    },
    {
      term: "Share gap",
      def: "One store's share of its top 200 minus the other's, in POINTS — the gap between 2.5% and 1.5% is one point, not forty. The fair way to compare stores of different sizes.",
      anchor: "top200-compare-list",
    },
    {
      term: "Sales gap",
      def: "The same comparison in dollars: this store's sales on the item minus the other's. Says what the difference is worth, where share says how much of each store the item is.",
      anchor: "top200-compare-list",
    },
    {
      term: "The ≥ on a figure",
      def: "At least this far apart. The item is outside the other store's top 200, so their figure is unknown rather than nought — the real gap is this or more. A row both stores carry has no ≥, because both sides are known.",
      anchor: "top200-compare-list",
    },
    {
      term: "The hatched end of a bar",
      def: "Unknown, not nought. It marks the side whose standing we do not have because the item is outside their top 200. It sits outside the measured bar so nothing inside the bar is anything but sales.",
      anchor: "top200-compare-list",
    },
    {
      term: "TY, LW, LY",
      def: "This week's total, with last week and last year underneath. vs LW and vs LY are the change as a percentage.",
      anchor: "list",
    },
    {
      term: "Crit, Watch, OK",
      def: "Graded against last year when last year has every day, and against last week when it does not. Crit is down by more than your threshold, Watch is down but not past it, OK is flat or up. Click a pill to show only those stores, and click it again to show all.",
      anchor: "severity-chips",
    },
    {
      term: "Share of group sales",
      anchor: "share-balance",
      def: "How big a slice each store took this week, against the slice it usually takes. Measured against its own usual size, not an even split — a store that is always 8% of its group is not failing for not being a twelfth of it.",
    },
    {
      term: "Why it balances",
      anchor: "share-balance",
      def: "Shares always total 100%, so a store can only gain ground by taking it from the others. Whatever one store gives up, the rest pick up between them — which is why a Falling store always has a Rising one somewhere, and why the two totals match.",
    },
    {
      term: "Falling, Consistent, Rising",
      anchor: "share-balance",
      def: "Falling lost more than half a percent of the group, Rising gained more than half, Consistent is everything in between. Half a percent is the rounding of a normal week; below it the money is real but it is not a finding.",
    },
    {
      term: "Lost share while sales grew",
      def: "Normal, and the point of the panel. If the group grew 9% and a store grew 4%, it took a smaller slice than usual even though it sold more. Sales up and share down is a store being outpaced, not a store in trouble.",
      anchor: "share-balance",
    },
    {
      term: "Does not cancel",
      def: "Shown when the two sides are not equal. It happens when some stores are measured against last year and others against last week — each set of shares totals 100% on its own, so mixing them leaves a remainder. The figure says how much.",
      anchor: "share-balance",
    },
    {
      term: "Share by day",
      anchor: "share-balance",
      def: "The selected store's share of the group on each day of the week, with the dashed line at the share it usually takes. A bar under the line is a day it came up light. Losing ground on the week's biggest day costs more than losing it on a Tuesday, and the weekly figure cannot tell you which happened.",
    },
    {
      term: "The other side of it",
      anchor: "share-balance",
      def: "The store named beside the selected one moved the opposite way by about the same amount. Shares total 100%, so the pairing is arithmetic — it says the money is accounted for, not that one store's customers drove to the other.",
    },
    {
      term: "Store Threshold",
      def: "How far sales have to drop before a store is marked Crit. Drag the slider or type a number. The Sub dept and Hourly tabs keep their own thresholds, so changing one does not change the others.",
      anchor: "threshold",
    },
    {
      term: "Sales / Qty",
      def: "Swaps the whole page between dollars and units sold — the totals, the percentages and the grades.",
      anchor: "metric",
    },
    {
      term: "Inactive items",
      def: "Items that sold last week or last year but have not sold this week. On the Sub dept tab they are behind their own filter.",
      anchor: "inactive-filter",
    },
    {
      term: "Top 200",
      anchor: "store-tabs",
      def: "The store's 200 biggest items by sales for the week shown. Ranked on money, not units, so an expensive item that sells a few still appears. Excluded sub departments are left out, so it agrees with the rest of the page.",
    },
    {
      term: "What it rang at",
      def: "Every price the item sold at this week, on one axis with what it costs you. Dot size is how much went out at each price; anything in the tinted band sold for less than it cost. An item can average out below cost while most of its sales were fine — this says which price is doing it.",
      anchor: "store-tabs",
    },
    {
      term: "What it earns",
      def: "Price less cost, times how much sold. Read down: the selling price, the cost, what is left of one after the other, the amount that went out, and the week's gross profit. A margin that could not be trusted leaves the profit withheld rather than guessed.",
      anchor: "store-tabs",
    },
    {
      term: "Invoices",
      def: "Every delivery of that item in the last 60 days, in a panel that slides over the item from the right. Nothing is fetched to open it — the invoices arrive with the item. Cases are what the invoice was written in, not units sold; turning one into the other needs a case size this does not carry. A paid price in green is an allowance: you paid under the vendor's list price on that delivery.",
      anchor: "store-tabs",
    },
    {
      term: "Pounds, not units",
      def: "A scale item sells by weight, so the panel reads it in pounds and prices it per pound. Its unit count is a count of weighings, and at some companies the feed sends none at all — a row showing 0 units beside 507 lb is accurate, not broken.",
      anchor: "store-tabs",
    },
    {
      term: "% of net sales",
      def: "How much of the store's week these 200 items carried. The three tiles compare that share rather than the dollars: a week up 10% lifts the top 200 with it, and comparing dollars then reads as a change in the list when nothing about the list moved. The pill is the difference in those shares.",
      anchor: "store-tabs",
    },
    {
      term: "Both locations",
      def: "Some stores share one store id — two operations at one site, told apart only by their store number. The Top 200 reads by store id, so on those it answers for both at once and says so above the list. Every other tab narrows to the one location, which is why its total can be smaller than the Top 200's.",
      anchor: "store-tabs",
    },
    {
      term: "Average price",
      def: "Sales divided by units — what a unit really fetched once promotions are counted in. It is not the shelf price, and on an item that was half on promotion it will sit between the two. The first section of the item report names the prices it actually rang at.",
      anchor: "item-retail",
    },
    {
      term: "Unit cost",
      def: "What the week's sales cost you to buy, per unit, from the same cost the margin is worked out on. Not the price on your last invoice — that is under What it costs to buy.",
      anchor: "item-cost",
    },
    {
      term: "Cost coverage",
      def: "The share of an item's sales lines that carried a cost. Below 90% the margin is hidden: with all the sales and only some of the costs it would read far too high, and it is safer to show nothing than a number somebody acts on. Some vendors deliver direct to the store and send no cost at all, which is why this bites most on fast movers.",
      anchor: "item-cost",
    },
    {
      term: "Allowance",
      def: "The gap between a vendor's list price and what you actually paid on a delivery. Shown by a paid price in green on the invoice list.",
      anchor: "item-buy",
    },
  ],
};
