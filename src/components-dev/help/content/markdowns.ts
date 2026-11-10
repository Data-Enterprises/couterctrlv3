// Interfaces
import type { HelpContent } from "../helpTypes";

/** Help for Markdowns: every markdown line for a store or group over a date
 *  range, filtered on the left and listed on the right. */
export const MARKDOWNS_HELP: HelpContent = {
  screen: "Markdowns",
  purpose:
    "Every markdown line for a store or group over a date range: price cuts, percentage markdowns and waste, and who keyed them.",

  guides: [
    {
      id: "load",
      title: "Load a store's or group's markdowns",
      desc: "A store or a group, over a date range",
      steps: [
        {
          title: "Pick the store or group and dates",
          pre: "The button reads",
          chip: "Select Store",
          post: "or Select Group until you have picked one.",
          anchor: "search",
        },
        {
          title: "Load",
          pre: "Press",
          chip: "Load markdowns",
          post: ". A long range reads in pages, and the card says which page it is waiting on.",
          see: "The filters on the left and every markdown line on the right, with how many lines the filters keep at the foot of the filters.",
          anchor: "lines",
        },
        {
          title: "Search again",
          pre: "Press",
          chip: "Back",
          post: "at the top of the filters. If the new search fails, the last results stay on screen.",
          anchor: "search",
        },
      ],
    },
    {
      id: "export",
      title: "Export what you see",
      desc: "The rows as filtered and sorted, as a CSV",
      steps: [
        {
          title: "Open the export",
          pre: "Click the download icon in the grid's navy header.",
          anchor: "export",
        },
        {
          title: "Pick the columns and download",
          pre: "Tick the columns you want, then press",
          chip: "Download CSV",
          post: ". The file is named for the store or group and dates the rows came from.",
          anchor: "export",
        },
      ],
    },
  ],

  fixes: [],

  terms: [
    {
      term: "Filters",
      def: "Types, Stores, Dates, Sub departments, Categories, Vendors, Items and Users. Each list holds only what this search returned; leave one untouched and all of it is included. Clear, at the foot of the panel, empties them all.",
      anchor: "filters",
    },
    {
      term: "Markdown percent at least",
      def: "Hides lines marked down by less than the percent you type.",
      anchor: "filters",
    },
    {
      term: "Markdown $",
      def: "Each line's markdown per unit times its quantity, or its weight for a scaled item, added up for the lines shown.",
      anchor: "kpis",
    },
    {
      term: "Avg MD %",
      def: "The markdown dollars over what the same lines sold for before the markdown, so a big line counts for more than a small one.",
      anchor: "kpis",
    },
    {
      term: "Waste $",
      def: "The markdown dollars on Waste lines alone.",
      anchor: "kpis",
    },
    {
      term: "Type",
      def: "How the markdown was keyed: a new price, a percentage off, or waste.",
      anchor: "lines",
    },
    {
      term: "Sorting",
      def: "Click a heading to sort by it: descending, then ascending, then back to the order the lines came in.",
      anchor: "lines",
    },
  ],
};
