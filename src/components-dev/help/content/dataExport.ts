// Interfaces
import type { HelpContent } from "../helpTypes";

/**
 * Help for Data Export.
 *
 * Written for all four tables, with the few things that belong to one of them
 * (price types, the Cashiers row, Returns, personal columns) said where they
 * come up. Every chip is a label as the page carries it, and every claim was
 * checked against the page on 2 Nov 2026 -- change one and change this.
 *
 * Show SQL stays out: it is hidden on the page (SHOW_SQL_BUTTON). The query
 * box is not, and is covered here; it runs in the browser and sends nothing.
 */
export const DATA_EXPORT_HELP: HelpContent = {
  screen: "Data Export",
  purpose:
    "Sales, orders, invoices or markdowns out of the database as a file you can open in Excel — every line, or a summary of them — and any file you have built before.",

  guides: [
    {
      id: "three-steps",
      title: "Build a file",
      desc: "Three steps: search, shape it, build it",
      steps: [
        {
          title: "Pick the data, a store and a date range",
          pre: "The search card asks for the data first: Sales, Orders, Invoices or Markdowns. Then a store or group and the dates, up to 31 days, and press",
          chip: "Load config",
          post: ".",
          see: "The page fills from one read of that table over the range: the stores it covers, the values each list holds, every column, and two hundred sample rows. The Data line at the top of the configuration says which table it is.",
          anchor: "source",
        },
        {
          title: "Shape the file in the configuration",
          pre: "The configuration starts closed; the arrow at the left of the query bar opens it. Tick what you want in the file. The sample on the right redraws as you go, so what is on screen is what the file will hold — same columns, same order.",
          anchor: "config",
        },
        {
          title: "Build it",
          pre: "Press",
          chip: "Build export",
          post: ".",
          see: "The file, its row count and size, and a Download button. The link lasts the minutes shown beside it. The file is written straight to storage, so a big one is a wait rather than a problem.",
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
          a: "Go back puts the strip back as it was. The file is in Previous builds either way.",
        },
        {
          q: "The strip turned amber after I built",
          a: "The configuration has changed since that file was built, so the file no longer matches the screen. Build export again for one that does.",
        },
      ],
    },
    {
      id: "another-search",
      title: "Search another table, store or dates",
      desc: "Change, on the Data line",
      steps: [
        {
          title: "Open the search card",
          pre: "Press",
          chip: "Change",
          post: "on the Data line at the top of the configuration.",
          see: "The search card over the page, with this table, store and dates already on it. Click outside it to close it and nothing changes.",
          anchor: "source",
        },
        {
          title: "Pick another table",
          pre: "Choose it and press Load config. The table you were on is kept as it is: Change back to it, with the same store and dates, and it returns as you left it, ticks and all, without being read again.",
        },
        {
          title: "Or search a different store or dates",
          pre: "That is a new search. The table is read again for it, and every table kept from the last search is let go. Group By, Aggregates, the sort and Output stay as they were; the lists, days, columns and products start full again from the new range.",
        },
        {
          title: "Or read the same one again",
          pre: "Load config with the table, store and dates unchanged reads it again, for rows that have arrived since. It keeps what a new search keeps, and the lists start full again.",
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
          see: "The File line at the top of the configuration says which shape the file is: Every line, or Summary.",
          anchor: "config",
        },
      ],
      issues: [
        {
          q: "A yellow bar says the summary has no key to group by",
          a: "Aggregates need rows to sit in, so the export refuses a summary without a Group By key. Pick one: storeid for one row per store, product_code for one per item.",
        },
      ],
    },
    {
      id: "query",
      title: "Read or write the configuration as a query",
      desc: "The box above the sample",
      steps: [
        {
          title: "Read it",
          pre: "The box above the sample is the configuration written as a query. Tick something and the query changes with it.",
          anchor: "query",
        },
        {
          title: "Write it",
          pre: "Edit the text and press",
          chip: "Apply to configuration",
          post: "(or Ctrl+Enter) to turn it into the ticks. Until you do, the sample is still the configuration's, and the box says so.",
          see: "Discard edits puts the text back; Undo puts the configuration back as it was before Apply. The query runs nowhere: it is read in this window, and the file is still built from the configuration.",
          anchor: "query",
        },
        {
          title: "Keep it",
          pre: "Save as new keeps the box as a named query, and",
          chip: "Queries",
          post: "lists the ones you have kept for this table — each table has its own list. With one open, Update, Rename and Delete act on it.",
          anchor: "query",
        },
      ],
      issues: [
        {
          q: "The query says there is no column called something",
          a: "It names a column this table does not have — usually a query typed or pasted from another table. Change the column names to this table's.",
        },
      ],
    },
    {
      id: "come-back",
      title: "Come back to a file or a setup",
      desc: "Saved exports and Previous builds",
      steps: [
        {
          title: "Save the setup",
          pre: "The",
          chip: "Saved",
          post: "button opens your saved exports: save the configuration on screen under a name, or load one. It holds no dates on purpose — September's report is October's with October's dates. Each table has its own list.",
          anchor: "build",
        },
        {
          title: "Find a past file",
          pre: "Previous builds, beside it once you have built one from this table, lists your files newest first, grouped by the saved export they came from. Its download links last the minutes it shows.",
          anchor: "build",
        },
        {
          title: "Reload one",
          pre: "Reload puts a past build's settings back on the configuration — taken from the build itself, so it is what produced that file even if the saved export has changed since. It leaves your dates alone.",
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
            { label: "The sample's figures against the file", result: "sample" },
            { label: "Values a saved export picked that aren't in the lists", result: "vocabulary" },
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
            "Use the aggregate names — each is its column and its operation (a total ends in _sum, a count of rows is row_count), so a file cannot quietly be read as a report.",
          ],
        },
        {
          id: "sample",
          tone: "ok",
          badge: "Expected",
          title: "The sample is a sample, not the file",
          why: "Two hundred rows taken wherever the scan landed — often a handful of stores and a couple of values from each list. The columns are the file's; the rows are an illustration. A summary's numbers on screen are that sample's, not the range's.",
          todo: ["Build the file and read its row count for the real figures."],
        },
        {
          id: "vocabulary",
          tone: "warn",
          badge: "This range's values",
          title: "A list holds only what this range has",
          why: "Every list is built from the search, so a value that isn't in this store's range isn't offered. Price types are the usual case: one company says Regular and Managers Special, another says REG and STOR. Load a saved export or reload a build and the page lists, above the sample, whatever it could not find here.",
          todo: ["Re-tick the values from this range's own list."],
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
      term: "The configuration",
      def: "The column on the left, opened and closed by the arrow on the query bar. Every section is shut until you open it, and the line on the right of each one is the answer — so the column reads as a list of decisions already made.",
      anchor: "config",
    },
    {
      term: "The filter lists",
      def: "Every table has Stores and Days. Then its own: Sales has Sale Types, Ring Types, Sub Departments, Vendors, Cashiers and Price Types; Orders has Order Types, Statuses, Vendors, Sub Departments and Categories; Invoices has Vendors, Sub Departments, Categories and Statuses, and no Cashiers; Markdowns has Types, Vendors, Sub Departments and Categories. Each list holds only what this range contains, and untick nothing and the whole list is included.",
      anchor: "config",
    },
    {
      term: "Products",
      def: "Paste or type codes, and words the description holds. A word is a contains-match — MILK finds WHOLE MILK GAL. Fill both and a line has to match a code and a word.",
      anchor: "config",
    },
    {
      term: "Output",
      def: "The file's format (CSV or Text), how it spells dates where the table offers a choice, its name, and its sort. On Sales and Invoices, also voided lines and refunds — and on Invoices, returns: all lines, exclude them, or only them.",
      anchor: "config",
    },
    {
      term: "Personal columns",
      def: "Customer name, email, phone, address and location. Marked PERSONAL in Columns, shaded in the sample, and turned on or off together with the Personal columns box. The sample shows their values, as the file does.",
      anchor: "config",
    },
    {
      term: "Group By and Aggregates",
      def: "Together they make the file a summary instead of the lines. Group By is what each row is; Aggregates are the numbers worked out for it.",
      anchor: "config",
    },
    {
      term: "The strip at the bottom",
      def: "What is about to be built: how many stores, how many columns (or keys and aggregates), the format, how many filters are narrowing it, and how many personal columns it includes.",
      anchor: "build",
    },
  ],
};
