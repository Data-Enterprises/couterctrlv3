import type { InfoGlossaryEntry } from "../../components/InfoPopover";

export const LP_INFO: { title: string; purpose: string; glossary: InfoGlossaryEntry[] } = {
  title: "Loss Prevention",
  purpose: "Flags cashiers and stores with unusual exception activity — voids, refunds, no-sales — so you can catch questionable transaction patterns early.",
  glossary: [
    { term: "Baseline", desc: "Your (or that store's) own average over the prior 2 weeks — per week normally, or per that weekday when you've picked a day. Everything on this page is graded against that baseline, not against other stores or cashiers." },
    { term: "Selecting a day", desc: "Picking a day narrows the transaction list and the cashier list together, and the baseline narrows with them — a Wednesday is compared to the other Wednesdays in those 2 weeks, not to an average day. Exception activity swings a lot by day of week, so measuring a Saturday against a midweek average would flag every Saturday." },
    { term: "Critical / Watch / Healthy", desc: "Based on how many key metrics (transactions, quantity, dollar total, average ticket) are at or below baseline. This page flags when exception activity goes up — the opposite direction from a typical sales KPI, where up is good." },
    { term: "Ungraded (cashier list)", desc: "This cashier has nothing to compare against — either no transactions in the baseline window at all, or none on the weekday you've selected. Not the same as Healthy: it means there isn't enough history to grade them yet." },
    { term: "No baseline data (store list)", desc: "A store with no baseline at all defaults to showing Healthy. That's a lack of comparison data, not a confirmed clean bill of health — worth a second look rather than assuming it's fine." },
    { term: "Cashier grading", desc: "Each cashier is compared only to their own recent history, never ranked against other cashiers." },
    { term: "Avg ticket baseline", desc: "Shown as a straight weekly average, not combined like the other baseline figures, since it's already a per-transaction rate rather than a running total." },
  ],
};
