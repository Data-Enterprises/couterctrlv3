import type { InfoGlossaryEntry } from "../../components/InfoPopover";

export const SALES_LEDGER_INFO: { title: string; purpose: string; glossary: InfoGlossaryEntry[] } = {
  title: "Sales",
  purpose: "Shows which stores need attention first, then lets you drill into exactly where the problem is — by sub-department or by hour.",
  glossary: [
    { term: "Critical / Watch / Healthy", desc: "Graded against last year, but only when last year has every day of the week. If it's missing days, the grade uses last week instead. Critical means down more than your threshold; Watch means down some, but not past it; Healthy means flat or up." },
    { term: "Grey percentages", desc: "That comparison is missing days — for example, last year only has 3 of the 7 days. The number is still shown, but it isn't used for the grade, because a partial week can't fairly call a store or department Critical." },
    { term: "Not graded (grey dot)", desc: "Neither last week nor last year has every day of the week, so there's no full-week comparison to grade on. These aren't counted under Critical, Watch or Healthy." },
    { term: "Threshold", desc: "How far a decline has to go before something's flagged Critical. You can set this separately for the store list, for sub-departments, and for hours — changing one doesn't affect the others." },
    { term: "Report total", desc: "The combined total across every store currently loaded, not the one store you have open. Easy to mistake for a single store's number." },
    { term: "Sales vs Qty", desc: "Swaps everything on the page from dollars to units sold, including every KPI and every grade." },
    { term: "vs Last Week / vs Last Year", desc: "Only compares days that exist in both periods, so a week still in progress won't look artificially worse just because fewer days have happened yet." },
    { term: "Avg basket (Hourly tab)", desc: "Total sales divided by number of transactions for that hour." },
    { term: "Inactive items (Sub dept tab → Items)", desc: "Sold last week or last year, but nothing yet this year. Listed last, so you can catch something that's quietly stopped selling." },
  ],
};
