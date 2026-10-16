import type { HelpContent } from "../helpTypes";

/**
 * Help for Admin → Store activity.
 *
 * Written against the screen, not from memory: every chip below is the label
 * as the button carries it, and every anchor is a `data-help` that exists in
 * `pages/admin/dev`. A chip that drifts from its button is the one error this
 * format can still make, so they are worth re-reading together when either
 * changes.
 */
export const ADMIN_HELP: HelpContent = {
  screen: "Store activity",
  purpose:
    "Shows, for one company and a date range, how many days each store actually sent sales — and which days are missing. It is how you tell a store that is closed from a store whose data stopped arriving.",

  guides: [
    {
      id: "find-missing",
      title: "Find stores that stopped sending sales",
      desc: "Narrow a company and a range down to the stores with gaps",
      steps: [
        {
          title: "Pick the company",
          pre: "Choose one in",
          chip: "Company",
          post: "down the left. The list is the companies on your own account, and only one company is read at a time.",
          anchor: "company",
        },
        {
          title: "Set the range",
          pre: "Set a start and end in",
          chip: "Dates",
          post: ". Every figure on this screen counts whole days inside that range.",
          see: "Nothing yet — the range is only read when you search.",
          anchor: "dates",
        },
        {
          title: "Search",
          pre: "Press",
          chip: "Search",
          post: ". It stays greyed out until a company is picked.",
          see: "A row per store, with its total days, the days it was active, and the days missing.",
          anchor: "search",
        },
        {
          title: "Keep only the stores with gaps",
          pre: "Press",
          chip: "View all missing",
          post: "to drop every store that reported every day.",
          see: "A shorter list.",
          anchor: "missing-filter",
        },
      ],
      issues: [
        {
          q: "Search does nothing",
          a: "No company is selected — the button is disabled until one is.",
        },
        {
          q: "Every store shows missing days",
          a: "The range probably runs past today, or into days before the company was live. Both count as missing, because no sales arrived for them.",
        },
      ],
    },
    {
      id: "export-activity",
      title: "Export what you are looking at",
      desc: "Take the activity list out as a CSV",
      steps: [
        {
          title: "Run a search first",
          pre: "The export is disabled until there is something to write — run a",
          chip: "Search",
          post: "first.",
          anchor: "search",
        },
        {
          title: "Open the export",
          pre: "Press the download icon in the page header.",
          see: "A dialog naming the company and the stores it will write.",
          anchor: "export",
        },
      ],
    },
  ],

  fixes: [
    {
      id: "missing-days",
      title: "A store is showing missing days",
      questions: [
        {
          id: "which",
          title: "Which days are missing?",
          options: [
            { label: "The most recent few days", result: "lag" },
            { label: "Scattered single days", next: "pattern" },
            { label: "Every day in the range", result: "never-sent" },
          ],
        },
        {
          id: "pattern",
          title: "Are they the same weekday each time?",
          options: [
            { label: "Yes — always the same day", result: "closed-day" },
            { label: "No — no pattern", result: "gaps" },
          ],
        },
      ],
      results: [
        {
          id: "lag",
          tone: "ok",
          badge: "Normal",
          title: "The last days have not arrived yet",
          why: "Sales reach us a day behind, and a store that has not closed its day yet has nothing to send. A range ending today will almost always show the end missing.",
          todo: [
            "Set the end date to yesterday and search again.",
            "If the gap is more than two days old, treat it as a real gap and raise it.",
          ],
        },
        {
          id: "closed-day",
          tone: "ok",
          badge: "Expected",
          title: "The store is closed that day",
          why: "A day with no sales and a day with no data look identical here — both are simply absent. The same weekday every week is almost always a closure.",
          todo: [
            "Confirm the store's trading days with the operator.",
            "Read the other figures against the days it actually trades.",
          ],
        },
        {
          id: "gaps",
          tone: "warn",
          badge: "Worth checking",
          title: "The register stopped sending on those days",
          why: "Scattered gaps with no weekday pattern usually mean the till could not reach us — a network outage, a machine switched off, or a day closed late enough to miss the collection.",
          todo: [
            "Note the exact dates and the store number.",
            "Ask whether anything happened at the store on those days.",
            "Send the dates and store number to your CounterCtrl rep if nothing explains them.",
          ],
        },
        {
          id: "never-sent",
          tone: "bad",
          badge: "Needs attention",
          title: "Nothing has arrived from this store for the whole range",
          why: "A store missing every day either is not sending at all, or was not trading in this range. This is the one case that does not resolve itself.",
          todo: [
            "Widen the range and search again — if earlier days are present, the stop has a date.",
            "Check whether the store was open in this period.",
            "Send the store number and the last date that reported to your rep.",
          ],
        },
      ],
    },
  ],

  terms: [
    {
      term: "Dates",
      def: "The range every figure on the screen is counted inside. Both ends are included.",
      anchor: "dates",
    },
    {
      term: "Company",
      def: "Which company's stores are read. One at a time, and the list is the companies on your own account.",
      anchor: "company",
    },
    {
      term: "Total",
      def: "Days in the range. The same for every store, and the number the other two are read against.",
      anchor: "activity-grid",
    },
    {
      term: "Active",
      def: "Days the store sent at least one sale. A day it traded but sent nothing does not count here — nothing distinguishes the two in the data.",
      anchor: "activity-grid",
    },
    {
      term: "Missing",
      def: "Days in the range with nothing from this store. It counts closures and outages the same way, which is why the guided fix asks which days they are.",
      anchor: "activity-grid",
    },
    {
      term: "View all missing",
      def: "Narrows the list to stores with at least one missing day. It filters what is on screen; it does not re-read anything.",
      anchor: "missing-filter",
    },
  ],
};
