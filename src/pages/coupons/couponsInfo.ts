import type { InfoGlossaryEntry } from "../../components/InfoPopover";

export const COUPONS_INFO: { title: string; purpose: string; glossary: InfoGlossaryEntry[] } = {
  title: "Coupons",
  purpose: "See where coupon activity is concentrated — by store, sub department, date, or cashier — and drill into the actual transactions behind it.",
  glossary: [
    { term: "All stores (group view)", desc: "The combined total across every store in the group, not one store's number." },
    { term: "Amt / Qty toggle", desc: "Switches the store list ranking between total coupon dollar amount and number of coupons used." },
    { term: "Sub dept / Date / Cashier tabs", desc: "Same coupon activity, just re-grouped a different way — not separate data sets." },
    { term: "Amount filter", desc: "Narrows the list to coupons within a dollar range; unrelated to grading or thresholds." },
  ],
};
