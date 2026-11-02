import type { HelpContent } from "../helpTypes";

/**
 * Help for Data Export.
 *
 * Written for all four tables, with the few things that belong to one of them
 * (price types, the Cashiers row, Returns) said where they come up.
 *
 * The query box is support-only and stays out of this, the same way it stays
 * off a client's screen — see the page's own gate. Nothing here describes it.
 */
export const DATA_EXPORT_HELP: HelpContent = {
  screen: "Data Export",
  purpose:
    "Sales, orders, invoices or markdowns out of the database as a file you can open in Excel — every line, or a summary of them — and any file you have built before.",

  guides: [
    {
      id: "three-steps",
      title: "Build a file",
      desc: "Three steps: scope it, shape it, build it",
      steps: [
        {
          title: "Pick what to export, a store and a date range",
          pre: "The search card asks for the Data first: Sales, Orders, Invoices or Markdowns. Then the same store and dates as everywhere else, and press",
          chip: "Load config",
          post: ".",
          see: "The whole page fills from one read of that table over the range: the stores it covers, the values your filters can hold, every column, and two hundred sample rows.",
          anchor: "search",
        },
        {
          title: "Shape the file on the left",
          pre: "Tick what you want in it. The panel on the right redraws as you go, so what is on screen is what the file will hold — same columns, same order.",
          anchor: "config",
        },
        {
          title: "Build it",
          pre: "Press",
          chip: "Build export",
          post: ".",
          see: "The file, its size and row count, and a link that lasts an hour. It is written straight to storage, so size is a wait rather than a problem.",
          anchor: "build",
        },
      ],
      issues: [
        {
          q: "The Build button is off",
          a: "The reason is printed underneath it.",
        },
        {
          q: "I want to keep configuring after building",
          a: "Go back puts the panel back as it was. The file is in Previous builds either way.",
        },
      ],
    },
    {
      id: "another-table",
      title: "Export another table",
      desc: "Switch between Sales, Orders, Invoices and Markdowns",
      steps: [
        {
          title: "Change the Data",
          pre: "Press",
          chip: "Change",
          post: "on the Data line at the top of the panel.",
          see: "The search card, with your store and dates still on it. Pick another table and Load config.",
          anchor: "source",
        },
        {
          title: "Come back to the first one",
          pre: "Change again and pick it, or use the card's Back button. It comes back as you left it, ticks and all, without being read again.",
        },
        {
          title: "Search something new",
          pre: "A different store, group or dates is a new search: every table is read again for it. The magnifier at the top of the panel starts over too.",
          anchor: "search",
        },
      ],
    },
    {
      id: "summary",
      title: "Make a summary instead of the lines",
      desc: "Group By and Aggregates change the file's shape",
      steps: [
        {
          title: "Choose what each row is",
          pre: "Open",
          chip: "Group By",
          post: "and pick the thing a row should represent.",
          anchor: "config",
        },
        {
          title: "Choose the numbers",
          pre: "Open",
          chip: "Aggregates",
          post: "for the figures worked out for each row.",
          see: "The panel says at the top which shape the file currently is.",
          anchor: "config",
        },
      ],
    },
    {
      id: "come-back",
      title: "Come back to a file or a setup",
      desc: "Saved configurations and Previous builds",
      steps: [
        {
          title: "Save the setup",
          pre: "The",
          chip: "Saved",
          post: "button keeps a named set of choices. It holds no dates on purpose — the report is the report, whether you run it for September or October. Each table has its own list.",
        },
        {
          title: "Find a past file",
          pre: "Previous builds lists every file you have built from this table, newest first, grouped by the configuration it came from.",
        },
        {
          title: "Reload one",
          pre: "Reload puts a past build's settings back on the panel — taken from the build itself, so it is what produced that file even if the configuration has changed since. It leaves your dates alone.",
        },
      ],
    },
  ],

  fixes: [
    {
      id: "numbers",
      title: "The numbers don't match the other pages",
      questions: [
        {
          id: "what",
          title: "What are you comparing?",
          options: [
            { label: "A sales total against a sales report", result: "raw" },
            { label: "The preview's figures against the file", result: "sample" },
            { label: "Price types that aren't in the list", result: "price-types" },
          ],
        },
      ],
      results: [
        {
          id: "raw",
          tone: "ok",
          badge: "Expected",
          title: "This is an extract of the raw lines",
          why: "Tender rows, voids, department transfers and untendered modifications are all in the sales lines, and refunds are stored positive. A store total from here runs roughly double what the sales pages say for the same window. That is the nature of the data, not an error.",
          todo: [
            "Anything that has to reconcile against a report should start from the report.",
            "Use the measure names — they carry the operation, so a file cannot quietly be read as a report.",
          ],
        },
        {
          id: "sample",
          tone: "ok",
          badge: "Expected",
          title: "The preview is a sample, not the file",
          why: "Two hundred rows taken wherever the scan landed — often a handful of stores and a couple of values from each list. The columns are the file's; the rows are an illustration. A summary's numbers on screen are that sample's, not the range's, and the preview says so.",
          todo: ["Build the file and read its row count for the real figures."],
        },
        {
          id: "price-types",
          tone: "warn",
          badge: "Company vocabulary",
          title: "Price type words belong to the company",
          why: "On Sales, one company says Regular and Managers Special, another says REG and STOR. The list you see is what these stores actually use. Load a configuration saved for a different company and the page tells you which of its price types do not exist here.",
          todo: ["Re-tick the price types from this company's own list."],
        },
      ],
    },
  ],

  terms: [
    {
      term: "Data",
      def: "The table the file is read from. Sales is every line of every transaction; Orders is order lines, with counts (INV, PER) and damages among them; Invoices is received vendor invoice lines; Markdowns is items marked down, waste included.",
      anchor: "source",
    },
    {
      term: "The configuration column",
      def: "Every section is shut until you open it, and the line on the right of each one is the answer — so the column reads as a list of decisions already made.",
      anchor: "config",
    },
    {
      term: "The filter lists",
      def: "Each table has its own. Sales: Sale Types, Ring Types, Sub Departments, Vendors, Cashiers, Price Types. Orders: Order Types, Statuses, Vendors, Sub Departments, Categories. Invoices: Vendors, Sub Departments, Categories, Statuses — no Cashiers. Markdowns: Types, Vendors, Sub Departments, Categories. Every list holds only what this range actually contains, so nothing you can pick comes back empty. Untick nothing and the whole list is included.",
      anchor: "config",
    },
    {
      term: "Output",
      def: "Voided lines and refunds on Sales and Invoices, and returns on Invoices: all lines, exclude them, or only them.",
      anchor: "config",
    },
    {
      term: "Product codes and descriptions",
      def: "Paste or type codes, and words to find in the description. A description word is a contains-match — MILK finds WHOLE MILK GAL. Fill both and a line has to match a code and a word.",
      anchor: "config",
    },
    {
      term: "Personal columns",
      def: "Customer name, contact and location are marked, and can be turned on or off together. The sample shows their values, as the file does.",
      anchor: "config",
    },
    {
      term: "Group By and Aggregates",
      def: "Together they make the file a summary instead of the lines. Group By is what each row is; Aggregates are the numbers worked out for it.",
      anchor: "config",
    },
    {
      term: "The strip at the bottom",
      def: "What is about to be built: how many stores, what shape, and every filter that is actually narrowing something.",
      anchor: "build",
    },
  ],
};
