import type { InfoGlossaryEntry } from "../../../components/InfoPopover";

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
  purpose: "Exception activity \u2014 voids, refunds, no-sales and the rest \u2014 for the week you searched, next to the same stores' and cashiers' own prior two weeks. Nothing is graded: the two sit side by side and you draw the conclusion.",
  glossary: [
    { term: "The big number", desc: "Exception transactions for whatever is in view \u2014 the whole week or the day you have tapped, for the store and exception type you have open. A transaction with two exceptions on it counts once." },
    { term: "WK / AVG", desc: "WK is the week you searched. AVG is the two weeks before it, added up and halved into one week's worth. With a day picked, AVG is that weekday in those two weeks, halved \u2014 so a Saturday is compared with an average Saturday." },
    { term: "Exception type", desc: "Tap the underlined title on the top card to choose one. The list shows every type with its own figures, so you can see which is worst before choosing. Picking one narrows the whole screen, including every store below; the first entry is every type at once." },
    { term: "The card at the top", desc: "All the stores you searched, together. Open it for the week's shape and its own cashiers and transactions." },
    { term: "Open a store", desc: "Tap a store to open its report where it sits. One opens at a time; the others shrink to a single line. Changing the exception type keeps your store open." },
    { term: "View details", desc: "Opens that store's cashiers and transactions on their own screen. Tap a cashier to see just their transactions, and a transaction to open the receipt. Back returns to the list with your card still open." },
    { term: "Tap a day", desc: "On the top card, scopes the whole screen \u2014 its figures and every store below. Inside a store's card it scopes that store only, and is cleared when you open a different one. Tap the same day again for the full week." },
    { term: "Sort by", desc: "Transactions and Amount put the biggest first. vs Avg puts the biggest rise over AVG first \u2014 the most extra exceptions, not the biggest percentage, so a cashier going from 1 to 3 does not outrank one going from 20 to 30. Store # and Name sort in order. Tap the same one again to reverse it, and once more to put the list back the way it arrived. Stores and Cashiers each remember their own sort." },
    { term: "Filter by store", desc: "Narrows a long list to the stores matching what you type. It only hides rows \u2014 no figure changes." },
    { term: "Transactions list", desc: "Newest first, because a run of exceptions in one evening is the pattern worth seeing. Search it by sale ID, cashier or lane." },
    { term: "Busiest", desc: "The day of the week with the most exception transactions for what is in view." },
    { term: "Per txn", desc: "The dollar amount divided by the number of transactions." },
  ],
};
