import type { HelpContent } from "../helpTypes";

/** Help for Categories — one store's week by category. */
export const CATEGORIES_HELP: HelpContent = {
  screen: "Categories",
  purpose:
    "One store's week by category, against last week and last year, and the items and hours behind it.",

  guides: [
    {
      id: "load",
      title: "Load a store's week",
      desc: "Pick a store and a week-ending date",
      steps: [
        {
          title: "Pick the store and the week",
          pre: "Choose a store and a week-ending date, then press",
          chip: "Load categories",
          post: ". You get the seven days ending on that date.",
          see: "Every category in that store for the week, weakest first.",
          anchor: "search",
        },
        {
          title: "Change either later",
          pre: "Click the magnifying glass next to the store name.",
          anchor: "search",
        },
        {
          title: "Sort it your way",
          pre: "Click the TY, vs LW or vs LY heading to sort, again to reverse, and a third time to go back.",
          anchor: "sort",
        },
      ],
    },
    {
      id: "drill",
      title: "See a category's items, or its hours",
      desc: "Open a category, then go by item, day or hour",
      steps: [
        {
          title: "Open the category",
          pre: "Click it in the list.",
          see: "Its week against last week and last year, a day strip, and the Items tab.",
          anchor: "list",
        },
        {
          title: "Open an item",
          pre: "Click one to see its sales, contribution, margin and quantity, plus each weekday.",
        },
        {
          title: "Look at the hours",
          pre: "Open the Hours tab for the category hour by hour, each hour against the same hour last week and last year.",
          see: "It takes a moment the first time — the hours are fetched when you ask for them.",
        },
      ],
    },
  ],

  fixes: [
    {
      id: "grey",
      title: "A percentage is grey, or says “3 of 7 days matched”",
      questions: [
        {
          id: "which",
          title: "What is the row showing?",
          options: [
            { label: "A grey percentage with a day count", result: "partial" },
            { label: "A grey dot and no grade", result: "ungraded" },
          ],
        },
      ],
      results: [
        {
          id: "partial",
          tone: "ok",
          badge: "Working as intended",
          title: "Only the matching days were compared",
          why: "Last week or last year is missing some of this week's days, so only the days on both sides are compared. The figure shows but stays grey, and does not decide the grade — a part week cannot fairly mark a category Crit.",
          todo: ["Read it as a hint, and check the day strip for the gaps."],
        },
        {
          id: "ungraded",
          tone: "ok",
          badge: "Working as intended",
          title: "There was no full week to grade on",
          why: "Neither last week nor last year covers the whole week, so the category is left ungraded rather than graded on a part week.",
          todo: ["Compare against last week if that side is complete."],
        },
      ],
    },
  ],

  terms: [
    {
      term: "Sales / Qty",
      def: "Switches the whole page between net sales dollars and units sold, grades included.",
      anchor: "metric",
    },
    {
      term: "Crit, Watch, OK",
      def: "Graded against last year, or against last week when last year is missing days. Crit is down by more than your Threshold, Watch is down but not past it, OK is flat or up. Click a chip to show only those categories, and again to show all.",
      anchor: "severity-chips",
    },
    {
      term: "Threshold",
      def: "How far a category has to fall before it is marked Crit.",
      anchor: "threshold",
    },
    {
      term: "Hours tab",
      def: "The category hour by hour, each hour against the same hour last week and last year. Click an hour for its sales, tax, units and basket figures.",
    },
  ],
};
