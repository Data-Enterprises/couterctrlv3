import type { HelpContent } from "../helpTypes";

/** Help for Loss Prevention — exception activity against each store's own history. */
export const LOSS_PREVENTION_HELP: HelpContent = {
  screen: "Loss Prevention",
  purpose:
    "Exception activity for one week, store by store, against each store's own prior two weeks — so unusual voids, refunds and no-sales surface early.",

  guides: [
    {
      id: "search",
      title: "Run a search",
      desc: "A scope, a week, and an exception type",
      steps: [
        {
          title: "Pick the scope and week",
          pre: "Choose a store or group and a week-ending date, then press",
          chip: "Load exceptions",
          post: ". The week is the seven days ending on that date.",
          anchor: "search",
        },
        {
          title: "Pick the exception type",
          pre: "Click a type in the row of tabs above the store list. The page opens on one for you, and switching type reloads the stores for the one you picked.",
          anchor: "type-tabs",
        },
        {
          title: "Search again",
          pre: "Click the magnifying glass at the top of the store list.",
          anchor: "search",
        },
      ],
    },
    {
      id: "drill",
      title: "Get from a store to a receipt",
      desc: "Store, cashier, transaction",
      steps: [
        {
          title: "Open the store",
          pre: "Click it in the list.",
          see: "Its totals against the baseline, its cashiers, and its transactions.",
          anchor: "store-list",
        },
        {
          title: "Narrow to a cashier",
          pre: "Click one to see only their transactions, and click again to show everyone.",
        },
        {
          title: "Narrow to a day",
          pre: "Use the",
          chip: "Whole week",
          post: "drop-down above the store list, or click a day card inside a store. A single day is compared with the same weekday in the prior two weeks.",
          anchor: "day-select",
        },
        {
          title: "Open the receipt",
          pre: "Click the transaction ID in the transaction list, then Back to return.",
        },
      ],
    },
  ],

  fixes: [
    {
      id: "grading",
      title: "A store or cashier is Critical",
      questions: [
        {
          id: "what",
          title: "What is on the row?",
          options: [
            { label: "A Critical or Watch dot", result: "graded" },
            { label: "A grey dot on a cashier", result: "no-history" },
            { label: "Red numbers I don't understand", result: "colours" },
          ],
        },
      ],
      results: [
        {
          id: "graded",
          tone: "warn",
          badge: "Up on its own baseline",
          title: "Several figures rose against this store's own history",
          why: "The grade counts how many of the four figures — transactions, quantity, total and average — went up against the baseline. Critical means most rose, Watch means about half did. The comparison is always with the same store or cashier's own prior two weeks, never with anybody else.",
          todo: [
            "Open the store and see whether one cashier carries the rise.",
            "Narrow to a single day — one day often explains the week.",
            "Open the receipts before drawing a conclusion.",
          ],
        },
        {
          id: "no-history",
          tone: "ok",
          badge: "Nothing to compare",
          title: "That cashier has no history yet",
          why: "A grey dot means the prior two weeks hold nothing for them, so there is no baseline to grade against — a new starter, or somebody who did not work those weeks.",
          todo: ["Read their raw figures, and grade them once two weeks exist."],
        },
        {
          id: "colours",
          tone: "ok",
          badge: "Reading the page",
          title: "Red is above the baseline, green is at or below it",
          why: "The colour on a number is not a severity. It says which side of that store's own baseline the figure fell on.",
          todo: [],
        },
      ],
    },
  ],

  terms: [
    {
      term: "Baseline",
      def: "The same store's — or cashier's — average for one week over the prior two weeks. Everything here is compared with its own history, not with other stores or cashiers.",
      anchor: "store-list",
    },
    {
      term: "Critical, Watch, OK",
      def: "How many of the four figures (transactions, quantity, total and average) rose against the baseline. Most of them is Critical, about half is Watch, most at or below it is OK.",
      anchor: "severity-chips",
    },
    {
      term: "Whole week",
      def: "The drop-down above the store list that narrows every store to one day.",
      anchor: "day-select",
    },
    {
      term: "Sorting and filtering",
      def: "Click a store-list heading to sort, again to reverse, a third time for worst first. Filter by store narrows the list; Crit, Watch and OK show only those. The transaction list filters on Trans ID, Date, Qty or Total.",
      anchor: "sort",
    },
  ],
};
