import type { HelpContent } from "../helpTypes";

/** Help for Forecasting — what a list of items will sell at a chosen price. */
export const FORECASTING_HELP: HelpContent = {
  screen: "Forecasting",
  purpose:
    "What a list of items will sell in an ad week at the price you choose, from the last 90 days of sales history.",

  guides: [
    {
      id: "start",
      title: "Start a forecast",
      desc: "A scope, a date, and a list of UPCs",
      steps: [
        {
          title: "Pick the scope and date",
          pre: "Choose Store or Group and pick one, then pick a date — the 90 days of history end on it. The button reads",
          chip: "Select Store",
          post: "or Select Group until you have.",
          anchor: "search",
        },
        {
          title: "Add the items",
          pre: "Paste UPCs and press Add, or use",
          chip: "Upload CSV",
          post: "or Upload AD list.",
          anchor: "upc-input",
        },
        {
          title: "Forecast",
          pre: "Press",
          chip: "Forecast",
          post: ".",
          see: "A grid of items, each at the price it sold the most units at over the 90 days.",
        },
      ],
      issues: [
        {
          q: "Some items say “no sales history”",
          a: "The selected stores had no sales for those UPCs in the 90 days — usually a new item, a discontinued one, or a wrong UPC. Click the note above the grid for the list.",
        },
      ],
    },
    {
      id: "ad-list",
      title: "Use an ad list",
      desc: "Take the prices from the ad rather than from history",
      steps: [
        {
          title: "Upload it",
          pre: "Press",
          chip: "Upload AD list",
          post: "and choose an Excel (.xlsx) file with UPC and Ad Retail columns, plus Ad Count for multi-buy deals.",
          anchor: "upc-input",
        },
        {
          title: "Read the tags",
          pre: "Those items carry an AD tag, and their ad price is used as the forecast price instead of the one history would have picked.",
        },
      ],
    },
    {
      id: "bulk",
      title: "Change price, ad days or notes for many rows",
      desc: "The toolbar applies to what is on screen",
      steps: [
        {
          title: "Narrow to the rows you mean",
          pre: "The toolbar changes only the rows on screen, so filter first with",
          chip: "Driving",
          post: ", Supporting or Tail.",
          anchor: "bands",
        },
        {
          title: "Apply",
          pre: "Enter ad days (1 to 7), a price or a note, then press Apply.",
          anchor: "toolbar",
        },
        {
          title: "Undo it",
          pre: "Reset puts price and ad days back to how the search returned them; Clear notes removes the notes.",
          anchor: "toolbar",
        },
      ],
    },
  ],

  fixes: [],

  terms: [
    {
      term: "Which items count",
      def: "Only the items ticked in the left panel. Everything is ticked after a search; Driving, Supporting and Tail narrow the grid further and can be combined.",
      anchor: "item-list",
    },
    {
      term: "Ad fcst, Total, Markdown",
      def: "Ad fcst is the forecast units at the row's price over its ad days — or over 7 days when no ad days are set. Total is Ad fcst times the price. Markdown is regular retail minus the price, times Ad fcst.",
      anchor: "grid",
    },
    {
      term: "Driving, Supporting, Tail",
      def: "Items ranked by forecast total: Driving is the fewest items making up at least 80%, Supporting takes it to 95%, Tail is the rest. They show size, not performance. Click a band's header to fold it away.",
      anchor: "bands",
    },
    {
      term: "Double-clicking a row",
      def: "Lists every price the item has sold at with its forecast, so you can apply one in a click. A calculator lets you try a price and cost without touching the grid. An item marked “1pt” sold at only one price and has no popup.",
    },
    {
      term: "no sales history",
      def: "The selected stores had no sales for that UPC in the 90 days. Usually new, discontinued, or a wrong UPC.",
    },
  ],
};
