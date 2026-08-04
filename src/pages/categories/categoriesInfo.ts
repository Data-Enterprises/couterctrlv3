import type { InfoGlossaryEntry } from "../../components/InfoPopover";

/** Content for the "?" popover in the Categories header.
 *
 *  Kept beside the page rather than in the component so the copy can be edited
 *  without touching layout, matching salesInfo.ts.
 */
export const CATEGORIES_INFO: {
  title: string;
  purpose: string;
  glossary: InfoGlossaryEntry[];
} = {
  title: "Categories",
  purpose:
    "Shows which categories in a store are falling behind, then lets you drill into the day, the items, or the hour where the decline actually happened.",
  glossary: [
    {
      term: "Crit / Watch / OK",
      desc: "Graded against last year, or last week if this category has no matching week a year ago. Crit means down more than your threshold; Watch means down, but not past it; OK means flat or up. Click a chip to show only those; click it again to clear.",
    },
    {
      term: "Ungraded",
      desc: "Sold this week but has neither a last-week nor a last-year figure to compare against. Not a verdict — there is simply nothing to grade it on yet. The chip only appears when some exist.",
    },
    {
      term: "Category Threshold",
      desc: "How far a decline has to go before a category is flagged Critical. The Items tab has its own separate threshold, since a single UPC moving is a smaller thing than a whole category moving.",
    },
    {
      term: "Day strip",
      desc: "Picking a day narrows everything below it — the KPIs, the items, and the hours — to that day alone. Click the selected day again, or All Week, to go back to the full week.",
    },
    {
      term: "Items tab",
      desc: "Every UPC in the open category, graded the same way the categories are. Selecting one shows its margin, contribution and day-of-week pattern, plus a plain-language read on what moved.",
    },
    {
      term: "Contribution",
      desc: "An item's share of the whole category's sales, not of its own. It's how you tell a big decline on a small item from a small decline on the item carrying the category.",
    },
    {
      term: "Item margin",
      desc: "Revenue less cost of goods, using the cost actually paid after any vendor allowance — and pounds rather than scans on anything sold by weight. Matches Sub Dept Margins and Item Lookup for the same item and day.",
    },
    {
      term: "Hours tab",
      desc: "Loads on demand rather than with the page, since it's a much larger pull. Each hour is compared to the same hour last week and last year — 4pm being busy is true of every store, so only the change means anything.",
    },
    {
      term: "Sales vs Qty",
      desc: "Swaps the whole page from dollars to units sold, including every KPI and every grade — categories and items alike.",
    },
    {
      term: "vs LW / vs LY",
      desc: "Only compares days present in both periods, so a week still in progress isn't dragged down by days that haven't happened yet. A dash means there's no comparable period at all.",
    },
    {
      term: "Uncategorized",
      desc: "Sales the POS recorded with no category attached. Worth clearing up — anything sitting here is invisible to every category figure on this page.",
    },
    {
      term: "Export",
      desc: "Covers whatever the date pills are set to, so a single day exports that day. Categories are always the full list; items and hours cover the open category only.",
    },
  ],
};
