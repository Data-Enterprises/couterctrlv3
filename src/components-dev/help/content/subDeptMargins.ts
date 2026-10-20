import type { HelpContent } from "../helpTypes";

/** Help for Sub Dept Margins — one store's week by sub department. */
export const SUB_DEPT_MARGINS_HELP: HelpContent = {
  screen: "Sub Dept Margins",
  purpose:
    "One store's week by sub department, against last week and last year, and the items behind it.",

  guides: [
    {
      id: "load",
      title: "Load a store's week",
      desc: "Pick a store and a week-ending date",
      steps: [
        {
          title: "Pick the store and the week",
          pre: "Choose a store and a week-ending date, then press",
          chip: "Search",
          post: ". You get the seven days ending on that date.",
          see: "Every sub department in the store for that week, weakest first.",
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
      title: "See a sub department's items",
      desc: "Open one, then narrow to a day",
      steps: [
        {
          title: "Open the sub department",
          pre: "Click it in the list.",
          see: "Its week against last week and last year, a day strip, and its items.",
          anchor: "list",
        },
        {
          title: "Open an item",
          pre: "Click one for its sales, margin, contribution and quantity, plus each weekday.",
        },
        {
          title: "Narrow to one day",
          pre: "Click a day card. Click it again, or",
          chip: "All Week",
          post: ", to go back.",
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
            { label: "A dash instead of a margin", result: "no-sales" },
          ],
        },
      ],
      results: [
        {
          id: "partial",
          tone: "ok",
          badge: "Working as intended",
          title: "Only the matching days were compared",
          why: "Last week or last year is missing some of this week's days, so only the days present on both sides are compared. The figure shows but stays grey and does not decide the grade — a part week cannot fairly mark a sub department Crit.",
          todo: ["Read it as a hint, and check the day strip for the gaps."],
        },
        {
          id: "ungraded",
          tone: "ok",
          badge: "Working as intended",
          title: "There was no full week to grade on",
          why: "Neither last week nor last year covers the whole week, so the sub department is left ungraded rather than graded on a part week.",
          todo: ["Compare against last week if that side is complete."],
        },
        {
          id: "no-sales",
          tone: "ok",
          badge: "Working as intended",
          title: "That period sold nothing",
          why: "A period with no sales has no margin, and 0.00% would read as a week sold at cost. A margin delta needs sales on both sides of it, so where one side is empty the row is left ungraded rather than reporting a collapse that did not happen.",
          todo: [],
        },
      ],
    },
  ],

  terms: [
    {
      term: "Margin / Sales",
      def: "Switches the list, the figures and the grades between gross margin and net sales. Margin is sales minus cost of goods as a percentage of sales — margin changes show in points (pts), sales changes in percent.",
      anchor: "metric",
    },
    {
      term: "Crit, Watch, OK",
      def: "Graded against last year, or against last week when last year is missing days. Crit is down by more than your Threshold, Watch is down but not past it, OK is flat or up. Click a chip to show only those, and again to show all.",
      anchor: "severity-chips",
    },
    {
      term: "Threshold",
      def: "How far a sub department has to fall before it is marked Crit.",
      anchor: "threshold",
    },
    {
      term: "Cost and No Cost tabs",
      def: "Cost shows each item's cost and the department's total cost of goods. No Cost lists items with no cost on file, whose margin cannot be worked out.",
    },
    {
      term: "Two locations",
      def: "Where one store ID covers two, tabs appear under the header — either location, or Both together.",
    },
  ],
};
