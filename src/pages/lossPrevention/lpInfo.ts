import type { InfoGlossaryEntry } from "../../components/InfoPopover";

export const LP_INFO: { title: string; purpose: string; glossary: InfoGlossaryEntry[] } = {
  title: "Loss Prevention",
  purpose: "Flags cashiers and stores with unusual exception activity — voids, refunds, no-sales — so you can catch questionable transaction patterns early.",
  glossary: [
    { term: "Baseline", desc: "Your (or that store's) own average per week over the prior 2 weeks. Everything on this page is graded against that baseline, not against other stores or cashiers." },
    { term: "Critical / Watch / Healthy", desc: "Based on how many key metrics (transactions, quantity, dollar total, average ticket) are at or below baseline. This page flags when exception activity goes up — the opposite direction from a typical sales KPI, where up is good." },
    { term: "Ungraded (cashier list)", desc: "This cashier had no transactions in the baseline window, so there's nothing yet to compare against. Not the same as Healthy — it means there isn't enough history to grade them." },
    { term: "No baseline data (store list)", desc: "A store with no baseline at all defaults to showing Healthy. That's a lack of comparison data, not a confirmed clean bill of health — worth a second look rather than assuming it's fine." },
    { term: "Cashier grading", desc: "Each cashier is compared only to their own recent history, never ranked against other cashiers." },
    { term: "Avg ticket baseline", desc: "Shown as a straight weekly average, not combined like the other baseline figures, since it's already a per-transaction rate rather than a running total." },
  ],
};
