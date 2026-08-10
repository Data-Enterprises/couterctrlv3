import type { InfoGlossaryEntry } from "../../components/InfoPopover";

/** Content for the "?" popover in the Cashiers header.
 *
 *  Kept beside the page rather than in the component so the copy can be edited
 *  without touching layout, matching lpInfo.ts and vendorsInfo.ts.
 *
 *  Every claim was checked against `explorer/lensUtils.ts` — `spreadFor`,
 *  `buildSignals`, `groupSignalByTransaction`, `describeSignal` — not against
 *  what the labels imply.
 */
export const CASHIERS_INFO: {
  title: string;
  purpose: string;
  glossary: InfoGlossaryEntry[];
} = {
  title: "Cashiers",
  purpose:
    "Groups a week's exceptions — voids, refunds, no sales — so you can tell the difference between one person's behaviour and a problem with an item or a lane. It surfaces where to look; it does not accuse anyone.",
  glossary: [
    {
      term: "Exception",
      desc: "The kind of transaction being examined, picked once per search because each one is its own query. The page lands on refunds or voids when the week has them, since those are what people usually come here for.",
    },
    {
      term: "Lens",
      desc: "What the exceptions are grouped by. The same week reads differently through each, and switching costs nothing — it re-groups what is already loaded rather than fetching again.",
      subEntries: [
        {
          label: "Store",
          desc: "One row per location. Where to start when a group was searched.",
        },
        {
          label: "Cashier",
          desc: "One row per person. The behaviour view.",
        },
        {
          label: "Item",
          desc: "One row per product. A single item across many cashiers usually means a bad tag or a wrong price, not theft.",
        },
        {
          label: "Terminal",
          desc: "One row per lane. Isolates a broken scanner or a misconfigured register.",
        },
      ],
    },
    {
      term: "Signal",
      desc: "One row in the list — a group of exception lines under the current lens, with the lines, transactions and dollars they account for.",
    },
    {
      term: "The spread badge",
      desc: "The badge on each row, and the page's central judgement: is this one person, or is it the item or the lane? Anything a single cashier owns is behaviour; the same exception spread across several is almost always a bad tag, a wrong price, or a broken lane. It is a classification, not a grade — a wide signal is not worse than a single one, it is a different kind of problem, which is why it carries no red or green.",
      subEntries: [
        {
          label: "On most lenses",
          desc: "Counts the distinct cashiers involved — one, two, or more.",
        },
        {
          label: "On the Cashier lens",
          desc: "Counts distinct items instead. One person on one or two items is a narrower story than one person across a dozen.",
        },
        {
          label: "unmapped upc",
          desc: "The item came back with no description at all. Almost always a catalogue gap rather than anything a cashier did.",
        },
      ],
    },
    {
      term: "Lines vs transactions",
      desc: "One receipt can contribute many exception lines — the same item voided eleven times in a single sale. The list counts both, and the drill-down collapses to one row per transaction so the two never contradict each other.",
    },
    {
      term: "1 of 13 · last",
      desc: 'Where the exception sat in the receipt: how many of that transaction\'s lines it accounts for, out of the total. The amber "last" tag means it was the final line of the sale — the classic pattern for ringing a full order, then voiding at the end. Worth a look, not proof.',
    },
    {
      term: "The summary line",
      desc: "The sentence above the transactions is the page reading its own numbers back — how many cashiers and items are involved, the most repeated item, and how many landed on a last line. It is a starting point for the question, not an answer to it.",
    },
    {
      term: "Totals",
      desc: "The strip along the top covers the whole exception set for the week, not the selected signal: lines, transactions, dollars, and how many distinct stores, cashiers and items are involved.",
    },
    {
      term: "Receipts",
      desc: "Tapping a transaction opens the full receipt — every line of the sale, not only the exception lines. That is what makes the line position above meaningful.",
    },
  ],
};
