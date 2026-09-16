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

/** The mobile "?" sheet. Mobile LP has no grading, thresholds or severity, so
 *  it gets its own copy rather than the desktop glossary. */
export const LP_MOBILE_INFO: { title: string; purpose: string; glossary: InfoGlossaryEntry[] } = {
  title: "Loss Prevention",
  purpose: "Exception activity — voids, refunds, no-sales and the rest — for the week you searched, next to the same stores' and cashiers' own prior two weeks. Nothing is graded: the two sit side by side and you draw the conclusion.",
  glossary: [
    { term: "The big number", desc: "Exception transactions for whatever is in view — the whole week or the day you've tapped, for the store, cashier and exception type you have open. A transaction with two exceptions on it counts once." },
    { term: "WK / AVG", desc: "WK is the week you searched. AVG is the two weeks before it, added up and halved into one week's worth. With a day picked, AVG is that weekday in those two weeks, halved — so a Saturday is compared with an average Saturday." },
    { term: "Exception types", desc: "Swipe the card, or use the arrows under it, to narrow the whole screen to one type. The first card is every type at once. Busiest is the day of the week with the most transactions for that card's type." },
    { term: "Tap a day", desc: "Scopes the card and the lists to that day. Tap it again for the full week." },
    { term: "Stores, cashiers, transactions", desc: "Tap a store to see its cashiers, a cashier to see their transactions, and a transaction to open the receipt. Back steps up one level. A single-store search starts at Cashiers." },
    { term: "Sort by", desc: "Transactions and Amount put the biggest first. vs Avg puts the biggest rise over AVG first — the most extra exceptions, not the biggest percentage, so a cashier going from 1 to 3 doesn't outrank one going from 20 to 30. Store # and Name sort in order. Stores and Cashiers each remember their own sort." },
    { term: "Transactions list", desc: "Newest first. Search it by sale ID, cashier or lane." },
    { term: "Per txn", desc: "The dollar amount divided by the number of transactions." },
  ],
};
