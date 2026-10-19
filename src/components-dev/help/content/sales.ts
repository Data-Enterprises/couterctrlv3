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
          pre: "Choose one in the search card. The button reads",
          chip: "Select Store",
          post: "or Select Group until you have picked one.",
          anchor: "search",
        },
        {
          title: "Pick the week",
          pre: "Choose a week-ending date. You always get the seven days ending on that date.",
          see: "Nothing yet — the dates are read when you load.",
          anchor: "search",
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
          title: "Check how it rang",
          pre: "How it rang lists every price the item actually sold at this week, with the units and sales at each one.",
          see: "One price usually. Two means part of the week was on promotion, and the split tells you how much went out at each.",
        },
        {
          title: "Check what you are paying",
          pre: "What it costs you compares the price on your last invoice against the cheapest you have paid in 120 days, and the invoices are listed underneath.",
          see: "A paid price in green is an allowance — you paid under the vendor's list price on that delivery.",
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
          a: "Nothing was bought on an invoice in the last 120 days. The item still sold — it just has no purchase to compare today's price against.",
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
    },
    {
      term: "Does not cancel",
      def: "Shown when the two sides are not equal. It happens when some stores are measured against last year and others against last week — each set of shares totals 100% on its own, so mixing them leaves a remainder. The figure says how much.",
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
    },
    {
      term: "Top 200",
      anchor: "store-tabs",
      def: "The store's 200 biggest items by sales for the week shown. Ranked on money, not units, so an expensive item that sells a few still appears. Excluded sub departments are left out, so it agrees with the rest of the page.",
    },
    {
      term: "Average price",
      def: "Sales divided by units — what a unit really fetched once promotions are counted in. It is not the shelf price, and on an item that was half on promotion it will sit between the two. How it rang lists the actual prices.",
    },
    {
      term: "Unit cost",
      def: "What the week's sales cost you to buy, per unit, from the same cost the margin is worked out on. Not the price on your last invoice — that is under What it costs you.",
    },
    {
      term: "Cost coverage",
      def: "The share of an item's sales lines that carried a cost. Below 90% the margin is hidden: with all the sales and only some of the costs it would read far too high, and it is safer to show nothing than a number somebody acts on. Some vendors deliver direct to the store and send no cost at all, which is why this bites most on fast movers.",
    },
    {
      term: "Off regular",
      def: "The share of units that rang at anything other than the regular price — a promotion, a markdown, or a deal item. Units the register sent no price type for are left out of the share rather than counted as regular.",
    },
    {
      term: "Allowance",
      def: "The gap between a vendor's list price and what you actually paid on a delivery. Shown by a paid price in green on the invoice list.",
    },
  ],
};
