// Interfaces
import type { HelpContent } from "../helpTypes";

/**
 * Help for Admin: Sub dept exclusions and Stores for owners, then Store
 * activity, which only support and level 9 see.
 *
 * Written against the screen, not from memory: every chip below is the label
 * as the button carries it, and every anchor is a `data-help` that exists in
 * `pages/admin/dev`. A chip that drifts from its button is the one error this
 * format can still make, so they are worth re-reading together when either
 * changes.
 */
export const ADMIN_HELP: HelpContent = {
  screen: "Admin",
  purpose:
    "Choose which sub departments count toward net sales, and rename your company's stores. Support also uses it to see which stores have stopped sending sales.",

  guides: [
    {
      id: "exclude-sub-dept",
      title: "Stop a sub department counting toward net sales",
      desc: "For money that goes through the register but isn't sales, like lottery or money orders",
      steps: [
        {
          title: "Open the tab",
          pre: "Open",
          chip: "Sub dept exclusions",
          post: "at the top of Admin.",
          see: "Every sub department that rang at your stores in the last 60 days.",
          anchor: "excl-list",
        },
        {
          title: "Pick the stores",
          pre: "Leave",
          chip: "Store",
          post: "on all your stores to change every store at once, or pick one store.",
          anchor: "excl-filters",
        },
        {
          title: "Find the department",
          pre: "Type its name in",
          chip: "Search departments…",
          post: ", or press Likely hash to bring the usual ones to the top.",
          anchor: "likely-hash",
        },
        {
          title: "Tick it",
          pre: "Tick the box at the start of its row. When it is at more than one store you are asked to confirm, then press",
          chip: "Yes, exclude at",
          post: "and the number of stores.",
          see: "Where it stands reads excluded at all of them.",
          anchor: "excl-list",
        },
      ],
      issues: [
        {
          q: "The department isn't in the list",
          a: "It hasn't rung at your stores in the last 60 days, so there is nothing to exclude yet.",
        },
        {
          q: "I want it to count again",
          a: "Untick its box, and confirm. It counts toward net sales again at every store it was excluded at.",
        },
      ],
    },
    {
      id: "rename-store",
      title: "Rename a store",
      desc: "Change the name a store shows everywhere",
      steps: [
        {
          title: "Open the tab",
          pre: "Open",
          chip: "Stores",
          post: "at the top of Admin.",
          anchor: "store-list",
        },
        {
          title: "Rename it",
          pre: "Press the pencil at the end of the store's row, type the new name in",
          chip: "Store name",
          post: "and save.",
          see: "The new name in the list.",
          anchor: "store-list",
        },
      ],
      issues: [
        {
          q: "There's no pencil on a store",
          a: "The store doesn't belong to a company yet. Contact support to change it.",
        },
        {
          q: "I need a new store, or to close one",
          a: "Adding, closing and reopening stores is done by support. Send them the store and what needs doing.",
        },
      ],
    },
    {
      id: "find-missing",
      title: "Find stores that stopped sending sales (support)",
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
      title: "Export store activity (support)",
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
      term: "Sub dept exclusion",
      def: "A sub department that no longer counts toward net sales on the Performance pages. It still shows in every list, export and search.",
      anchor: "excl-list",
    },
    {
      term: "Where it stands",
      def: "Whether the department counts at your stores, is excluded at all of them, or at some. \"Not present\" counts the stores where it didn't ring.",
      anchor: "excl-list",
    },
    {
      term: "Likely hash",
      def: "Brings the departments that look like pass-through money, such as lottery, money orders and stamps, to the top. It doesn't tick anything for you.",
      anchor: "likely-hash",
    },
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
