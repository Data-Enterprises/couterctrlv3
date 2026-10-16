import type { HelpContent } from "../helpTypes";

/** Help for Receivers — a store's receiving history, invoice by invoice. */
export const RECEIVERS_HELP: HelpContent = {
  screen: "Receivers",
  purpose:
    "A store's receiving history by date and invoice, and exactly what was received on each one.",

  guides: [
    {
      id: "load",
      title: "Load a store's receiving",
      desc: "One store at a time, over a date range",
      steps: [
        {
          title: "Pick the store and dates",
          pre: "This page works one store at a time. The button reads",
          chip: "Select Store",
          post: "until you have picked one.",
          anchor: "search",
        },
        {
          title: "Load",
          pre: "Press",
          chip: "Load Receivers",
          post: ".",
          see: "Receiving dates, newest first, with the number of invoices on each. The Total at the top is how many invoices were loaded.",
          anchor: "date-list",
        },
        {
          title: "Open a date, then an invoice",
          pre: "Click a date to see its invoices — number, item count and vendor — then click one.",
          see: "The vendor, who entered it, the date, the invoice and Ref numbers, the totals, and every line received.",
        },
        {
          title: "Search again",
          pre: "Click the magnifying glass at the top of the list. If nothing was found you get a notice with a Search again button.",
          anchor: "search",
        },
      ],
    },
  ],

  fixes: [],

  terms: [
    {
      term: "Filtering by vendor or date",
      def: "The All Vendors and All Dates lists above the list. Matching dates open for you while a filter is on.",
      anchor: "filters",
    },
    {
      term: "Location tabs",
      def: "Some stores cover more than one location. When they do, tabs appear above the filters to switch between them.",
      anchor: "filters",
    },
    {
      term: "Cases and Units",
      def: "What was received on that line.",
      anchor: "lines",
    },
    {
      term: "U Cost and Ext Cost",
      def: "U Cost is the cost per unit; Ext Cost is the total cost for the line. Retail and Ext Retail are the same two for the retail price, and the Totals row adds up the invoice.",
      anchor: "lines",
    },
    {
      term: "Exporting an invoice",
      def: "The download icon in the invoice header, once its lines have loaded. Presets writes all the line items; Custom groups by UPC or description and lets you pick the figures and totals.",
      anchor: "export",
    },
  ],
};
