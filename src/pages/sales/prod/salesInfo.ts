import type { InfoGlossaryEntry } from "../../../components/InfoPopover";

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

/** The mobile "?" sheet. Mobile Sales has no grading, thresholds or last week,
 *  so it gets its own copy rather than the desktop glossary. */
export const SALES_MOBILE_INFO: { title: string; purpose: string; glossary: InfoGlossaryEntry[] } = {
  title: "Sales",
  purpose: "This year against last year for the week you searched. Open a store to see its week, then open a sub department to see the items in it.",
  glossary: [
    { term: "TY / LY", desc: "TY is the week you searched. LY is the same weekdays last year, matched day by day, so a Monday is compared with a Monday and a holiday with the same holiday." },
    { term: "Sales", desc: "Sales before tax, for whatever is in view \u2014 the whole search, or the store and day you have open." },
    { term: "The card at the top", desc: "The group as a whole, and the total every store below is part of. Open it for the group's week and its own breakdowns." },
    { term: "Open a store", desc: "Tap a store to open its report where it sits \u2014 its week, its total against last year, and what made it up. One opens at a time; the others shrink to a single line so the open one has the screen." },
    { term: "Transactions / Avg basket", desc: "Transactions is the number of receipts. Avg basket is sales divided by transactions. These come from the store's own figures, so they show a grey placeholder for a moment after you open a card." },
    { term: "Coupons", desc: "Every coupon redeemed, split by type: digital, electronic store, electronic in-store and paper store coupons." },
    { term: "View details", desc: "Opens the store's sub departments and hours on their own screen. Tap a sub department to see the items in it \u2014 those load the first time you open that department and are instant after. Back returns to the list with your card still open." },
    { term: "Tap a day", desc: "On the top card, scopes the whole screen \u2014 its figures and every store below. Inside a store's card it scopes that store only, and is cleared when you open a different one. Tap the same day again for the full week." },
    { term: "Sort by", desc: "Tap a chip to sort, again to reverse it, and a third time to go back to the order the search returned. Sales opens on the biggest, Change vs LY on the biggest drop; rows with nothing to compare stay at the bottom either way. Each list keeps its own sort." },
    { term: "Filter by store", desc: "Narrows a long list to the stores whose name or number matches what you type. It only hides rows \u2014 no figure changes." },
    { term: "Change %", desc: "This year against last year for that row. A dash means it sold nothing last year, so there is no percentage to show." },
  ],
};
