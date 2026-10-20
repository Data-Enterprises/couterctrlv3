import type { HelpContent } from "../helpTypes";

/** Help for Vendors — one store's week by supplier. */
export const VENDORS_HELP: HelpContent = {
  screen: "Vendors",
  purpose:
    "One store's week by vendor, against last week and last year, and the items each vendor supplied.",

  guides: [
    {
      id: "load",
      title: "Load a store's week",
      desc: "Pick a store and a week-ending date",
      steps: [
        {
          title: "Pick the store and the week",
          pre: "Choose a store and a week-ending date, then press",
          chip: "Load vendors",
          post: ". You get the seven days ending on that date.",
          see: "Every vendor that sold in that store that week, weakest first.",
          anchor: "search",
        },
        {
          title: "Change either later",
          pre: "Click the magnifying glass next to the store name.",
          anchor: "search",
        },
        {
          title: "Sort it your way",
          pre: "Click the TY, vs LW or vs LY heading to sort, again to reverse, and a third time to go back to weakest-first.",
          anchor: "sort",
        },
      ],
    },
    {
      id: "drill",
      title: "See a vendor's items",
      desc: "Open a vendor, then narrow to a day",
      steps: [
        {
          title: "Open the vendor",
          pre: "Click it in the list.",
          see: "Its week against last week and last year, a day strip, and every item it supplied.",
          anchor: "list",
        },
        {
          title: "Open an item",
          pre: "Click one to see its sales, contribution, margin and quantity, plus each weekday.",
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
          ],
        },
      ],
      results: [
        {
          id: "partial",
          tone: "ok",
          badge: "Working as intended",
          title: "Only the matching days were compared",
          why: "Last week or last year is missing some of this week's days, so only the days present on both sides are compared. The figure still shows, but it is grey and does not decide the grade — a part week cannot fairly mark a vendor Crit.",
          todo: ["Read it as a hint, and check the day strip for the gaps."],
        },
        {
          id: "ungraded",
          tone: "ok",
          badge: "Working as intended",
          title: "There was no full week to grade on",
          why: "Neither last week nor last year covers the whole week, so the vendor is left ungraded rather than graded on a part week.",
          todo: ["Compare against last week if that side is complete."],
        },
      ],
    },
  ],

  terms: [
    {
      term: "Margin / Sales",
      def: "Switches the whole page between gross margin and net sales, grades included. Margin is sales minus cost of goods, as a percentage of sales — margin changes are shown in points (pts), sales changes in percent.",
      anchor: "metric",
    },
    {
      term: "Crit, Watch, OK",
      def: "Graded against last year, or against last week when last year is missing days. Crit is down by more than your Threshold, Watch is down but not past it, OK is flat or up. Click a chip to show only those vendors, and again to show all.",
      anchor: "severity-chips",
    },
    {
      term: "Threshold",
      def: "How far a vendor has to fall before it is marked Crit.",
      anchor: "threshold",
    },
    {
      term: "Booked without a vendor",
      def: "Coupon lines and anything else the register recorded with no supplier. It is kept in the store total so the vendors still add up, but it is not a real vendor.",
      anchor: "list",
    },
  ],
};
