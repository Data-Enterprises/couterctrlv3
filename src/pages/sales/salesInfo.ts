import type { InfoGlossaryEntry } from "../../components/InfoPopover";

export const SALES_LEDGER_INFO: { title: string; purpose: string; glossary: InfoGlossaryEntry[] } = {
  title: "Sales",
  purpose: "Shows which stores need attention first, then lets you drill into exactly where the problem is — by sub-department or by hour.",
  glossary: [
    { term: "Critical / Watch / Healthy", desc: "Graded against last year (or last week, if this store doesn't have a year of history yet). Critical means down more than your threshold; Watch means down some, but not past it; Healthy means flat or up." },
    { term: "Threshold", desc: "How far a decline has to go before something's flagged Critical. You can set this separately for the store list, for sub-departments, and for hours — changing one doesn't affect the others." },
    { term: "Report total", desc: "The combined total across every store currently loaded, not the one store you have open. Easy to mistake for a single store's number." },
    { term: "Sales vs Qty", desc: "Swaps everything on the page from dollars to units sold, including every KPI and every grade." },
    { term: "vs Last Week / vs Last Year", desc: "Only compares days that exist in both periods, so a week still in progress won't look artificially worse just because fewer days have happened yet." },
    { term: "Avg basket (Hourly tab)", desc: "Total sales divided by number of transactions for that hour." },
    { term: "Inactive items (Sub dept tab → Items)", desc: "Sold last week or last year, but nothing yet this year. Listed last, so you can catch something that's quietly stopped selling." },
  ],
};
