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
    "Shows which categories in a store are falling behind, then lets you drill into which day or hour the decline actually happened.",
  glossary: [
    {
      term: "Critical / Watch / OK",
      desc: "Graded against last year, or last week if this category has no matching week a year ago. Critical means down more than your threshold; Watch means down, but not past it; OK means flat or up.",
    },
    {
      term: "Ungraded",
      desc: "Sold this week but has neither a last-week nor a last-year figure to compare against. Not a verdict — there is simply nothing to grade it on yet.",
    },
    {
      term: "Category Threshold",
      desc: "How far a decline has to go before a category is flagged Critical. The right panel has its own threshold for days and hours; changing one doesn't affect the other.",
    },
    {
      term: "Sales vs Qty",
      desc: "Swaps the whole page from dollars to units sold, including every KPI and every grade.",
    },
    {
      term: "vs LW / vs LY",
      desc: "Only compares days present in both periods, so a week still in progress isn't dragged down by days that haven't happened yet. A dash means there's no comparable period at all.",
    },
    {
      term: "Uncategorized",
      desc: "Sales the POS recorded with no category attached. Worth clearing up — anything sitting here is invisible to every category figure on this page.",
    },
  ],
};
