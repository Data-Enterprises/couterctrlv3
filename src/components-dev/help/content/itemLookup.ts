import type { HelpContent } from "../helpTypes";

/** Help for Item Lookup — a store's last 14 days for specific UPCs. */
export const ITEM_LOOKUP_HELP: HelpContent = {
  screen: "Item Lookup",
  purpose:
    "How specific items are selling at one store over the last 14 days — margin, pricing, and the days they did not sell.",

  guides: [
    {
      id: "search",
      title: "Look up items",
      desc: "One store, one or more UPCs",
      steps: [
        {
          title: "Pick the store",
          pre: "Search is off until a store is picked and at least one UPC is entered.",
          anchor: "search",
        },
        {
          title: "Enter the UPCs",
          pre: "Type or paste them, separated by commas or new lines, then press",
          chip: "Search",
          post: ".",
          see: "Every UPC you searched down the left, each loading on its own — so some finish before others, and anything that cannot be found says so.",
          anchor: "item-list",
        },
        {
          title: "Open one",
          pre: "Click an item to see its full report on the right.",
        },
        {
          title: "Search again",
          pre: "Click the magnifying glass above the item list.",
          anchor: "search",
        },
      ],
      issues: [
        {
          q: "I want a different date range",
          a: "There isn't one. The page is always the last 14 days ending yesterday, because today's sales are still arriving. The dates are shown at the top of the item list.",
        },
      ],
    },
  ],

  fixes: [
    {
      id: "no-margin",
      title: "The margin looks wrong or missing",
      questions: [
        {
          id: "what",
          title: "What does the report say?",
          options: [
            { label: "“No cost on file”", result: "no-cost" },
            { label: "It shows lb and a Weight column", result: "weighed" },
          ],
        },
      ],
      results: [
        {
          id: "no-cost",
          tone: "warn",
          badge: "Data gap",
          title: "No cost has been set up for the item",
          why: "Without a cost there is no real margin to work out, so the page says so rather than showing a false 100%. New items often sell before their cost is entered.",
          todo: [
            "Have the cost added to the item file.",
            "Until then, read price and units rather than margin.",
          ],
        },
        {
          id: "weighed",
          tone: "ok",
          badge: "Working as intended",
          title: "The item is sold by weight",
          why: "Cost, average price and totals count pounds rather than scans. In the daily breakdown, Qty is how many times it was rung up and Weight is the pounds sold — so a margin read against Qty will look wrong.",
          todo: ["Read the Weight column, not Qty, for anything per-unit."],
        },
      ],
    },
  ],

  terms: [
    {
      term: "Slowing down",
      def: "The second week sold fewer units than the first.",
      anchor: "report",
    },
    {
      term: "No sales in the last X days",
      def: "The item has not sold for two or more days up to yesterday, which can mean it is out of stock.",
      anchor: "report",
    },
    {
      term: "Longest gap",
      def: "The longest earlier stretch of days with no sales.",
      anchor: "report",
    },
    {
      term: "By sale type",
      def: "Splits the register lines into Sale, Backup (restored transactions), Cancelled and Voided, each as a share of sales. Everything else on the report counts Sale lines only. Click a type to see its days, then Back to sales.",
    },
    {
      term: "Two locations",
      def: "Where a store covers two, tabs appear above the item list — one per location plus Both — and every figure follows the tab.",
      anchor: "item-list",
    },
  ],
};
