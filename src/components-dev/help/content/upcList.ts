import type { HelpContent } from "../helpTypes";

/** Help for UPC List — a list of items studied four ways. */
export const UPC_LIST_HELP: HelpContent = {
  screen: "UPC List",
  purpose:
    "A list of UPCs across a store or group and a date range: sales against last year, price history, trends, and what sells alongside them.",

  guides: [
    {
      id: "search",
      title: "Set up a search",
      desc: "A scope, a range, and a list of UPCs",
      steps: [
        {
          title: "Pick the scope and dates",
          pre: "Choose the tab to open on, pick Store or Group, and set your dates. The button reads",
          chip: "Select Store",
          post: "or Select Group until you have picked one.",
          anchor: "search",
        },
        {
          title: "Add the UPCs",
          pre: "Paste them and press",
          chip: "Add",
          post: ". They only join the list once you press Add, and the search stays off until at least one is on it.",
          anchor: "upc-input",
        },
        {
          title: "Or upload them",
          pre: "Press",
          chip: "Upload CSV",
          post: "and choose a .csv or .txt with UPCs separated by commas, spaces or new lines. Only numbers are picked up.",
          anchor: "upc-input",
        },
        {
          title: "Search",
          pre: "Press Search. Afterwards, tick the items you want — the tabs and totals only cover ticked items.",
          see: "The left panel with your items, and All to tick every one.",
          anchor: "item-list",
        },
      ],
      issues: [
        {
          q: "It says “No UPCs selected”",
          a: "Nothing is ticked. Tick items in the left panel, or press All. The Filter box finds one quickly.",
        },
        {
          q: "I need to change the search",
          a: "The magnifying glass at the top of the left panel — add or remove UPCs, or change the store, group or dates, then Search again.",
        },
      ],
    },
  ],

  fixes: [],

  terms: [
    {
      term: "Sales Comp",
      def: "Sales for the ticked items this year against the same weeks last year. WoW trend compares each item's most recent full week with its average full week. Click an item for its sales day by day.",
      anchor: "tabs",
    },
    {
      term: "Price Opt",
      def: "Every price each item sold at in the range, with the quantity and revenue at each. The price marked “best” brought in the most revenue. Elasticity shows how far sales moved when the price changed, and needs at least two prices to appear.",
      anchor: "tabs",
    },
    {
      term: "Trend",
      def: "Compares each item's daily sales before and after a point in the range and labels it Growing, Declining, Accelerating or Reduced availability, biggest losses first. Confidence says how steady the pattern is.",
      anchor: "tabs",
    },
    {
      term: "Reduced availability",
      def: "The daily rate held up but the item sold on fewer days — which usually points at stocking rather than demand.",
    },
    {
      term: "Association",
      def: "What else was bought in the same baskets as your ticked items. Attach is the share of those baskets that also held the product. Click a product to see what sells with it, then Back to Seed UPCs.",
      anchor: "tabs",
    },
  ],
};
