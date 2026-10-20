import type { HelpContent } from "../helpTypes";

/** Help for Coupon Sales — coupons graded against each store's own history. */
export const COUPON_SALES_HELP: HelpContent = {
  screen: "Coupon Sales",
  purpose:
    "Coupon activity for one week, store by store, against each store's own prior two weeks — so an unusually large average coupon shows up and can be traced.",

  guides: [
    {
      id: "load",
      title: "Run a search",
      desc: "A store or group, and a week",
      steps: [
        {
          title: "Pick the scope and the week",
          pre: "Choose a store or group and a week-ending date, then press",
          chip: "Load Coupon Sales",
          post: ". The week is the seven days ending on that date.",
          anchor: "search",
        },
        {
          title: "Search again",
          pre: "Click the magnifying glass at the top of the store list.",
          anchor: "search",
        },
      ],
    },
    {
      id: "break-down",
      title: "Break a store down",
      desc: "Sub dept, cashier or item, then the receipts",
      steps: [
        {
          title: "Open the store",
          pre: "Click it in the list.",
          anchor: "store-list",
        },
        {
          title: "Choose a grouping",
          pre: "Use the",
          chip: "Sub Dept",
          post: ", Cashier and Items tabs. Click a row to see only its transactions, and Clear to show them all again.",
          anchor: "tabs",
        },
        {
          title: "Narrow to one day",
          pre: "Click a day card to narrow the totals, the breakdown and the transactions. Click it again, or",
          chip: "All Week",
          post: ", to go back. Each day is compared with the same weekday in the prior two weeks.",
        },
        {
          title: "Open a receipt",
          pre: "Click a transaction to see the whole sale, with the coupon lines highlighted and coupons, tax, net and total at the bottom.",
        },
      ],
    },
  ],

  fixes: [
    {
      id: "grading",
      title: "A store is Critical and I want to know why",
      questions: [
        {
          id: "mode",
          title: "Which mode is the page in?",
          options: [
            { label: "Trend", next: "trend-dot" },
            { label: "Avg $", result: "avg" },
          ],
        },
        {
          id: "trend-dot",
          title: "What is on the row?",
          options: [
            { label: "A Critical or Watch dot", result: "trend" },
            { label: "A grey dot", result: "no-history" },
          ],
        },
      ],
      results: [
        {
          id: "trend",
          tone: "warn",
          badge: "Rose on its own history",
          title: "The average coupon rose past the threshold",
          why: "Trend compares each store against its own prior two weeks, so this is a change in that store rather than a comparison with anybody else. Critical means it rose by more than the threshold; Watch means it rose by less.",
          todo: [
            "Open the store and use the Sub Dept, Cashier and Items tabs to see where the rise sits.",
            "Click a day card — a single day often carries the whole move.",
            "Open a transaction and read the receipt before drawing a conclusion.",
          ],
        },
        {
          id: "avg",
          tone: "ok",
          badge: "Over the amount you set",
          title: "The average coupon is over your dollar figure",
          why: "Avg $ ignores history entirely and only asks whether the average coupon is over the amount in the box. There are only two states here — Critical if it is over, OK if it is not.",
          todo: [
            "Change the dollar amount beside the switch if the figure is set for a different kind of store.",
            "Switch to Trend to see whether it is also a change for that store.",
          ],
        },
        {
          id: "no-history",
          tone: "ok",
          badge: "Nothing to compare",
          title: "There were no coupons in the prior two weeks",
          why: "A grey dot under Trend means there is no history to compare against, so the store is left ungraded rather than judged against nothing.",
          todo: ["Use Avg $ for a store with no recent coupon history."],
        },
      ],
    },
  ],

  terms: [
    {
      term: "Trend",
      def: "Compares each store's average coupon with its own prior two weeks. The slider sets the percentage rise that counts as Critical.",
      anchor: "metric",
    },
    {
      term: "Avg $",
      def: "Ignores history and asks whether the average coupon is over a dollar amount you set.",
      anchor: "metric",
    },
    {
      term: "Critical, Watch, OK",
      def: "Under Trend: rose past the threshold, rose but less, or held and fell. Under Avg $ there are only two — over the amount, or not.",
      anchor: "severity-chips",
    },
    {
      term: "Sorting a list",
      def: "Click Amount, Trans or Count to sort, again to reverse, and a third time to go back to worst first.",
      anchor: "sort",
    },
  ],
};
