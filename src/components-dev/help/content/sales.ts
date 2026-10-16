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
  ],
};
