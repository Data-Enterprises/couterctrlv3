import type { PhoneHelp } from "../helpTypes";

/** Help for Cashiers on a phone. Ported from its `-mobile` help page. */
export const CASHIERS_PHONE_HELP: PhoneHelp = {
  screen: "Cashiers",
  purpose:
    "Groups a week's exceptions — voids, refunds, no sales — so you can tell the difference between one person's behaviour and a problem with an item or a lane. It surfaces where to look; it does not accuse anyone.",

  questions: [
    {
      q: "How do I search?",
      a: [
        "Pick a store or group and a date, then tap Find exceptions. You'll see the week ending on that date. The button reads \"Select Store\" or \"Select Group\" until you have picked one. To search again, tap Back in the header.",
      ],
    },
    {
      q: "Which exception am I looking at?",
      a: [
        "The page opens on refunds or voids when the week has them. To switch, tap the Exception box beside the Store, Cashier, Item and Terminal buttons.",
      ],
    },
    {
      q: "What do the figures across the top mean?",
      a: [
        "They cover the whole week's search: exception lines, transactions, amount, and how many stores, cashiers and items are involved.",
      ],
    },
    {
      q: "What do the Store, Cashier, Item and Terminal buttons do?",
      a: [
        "They group the same exceptions in different ways. The same item across many cashiers usually points to a bad tag or wrong price. Terminal groups by lane, which can show a register problem.",
      ],
    },
    {
      q: "What does the tag on each row mean?",
      a: [
        "It counts how many cashiers are involved, or how many items when you're grouping by cashier. One cashier suggests one person's habit, while many cashiers suggests an item or lane problem. It shows where to look. It doesn't accuse anyone.",
      ],
    },
    {
      q: "How do I see the transactions and receipts?",
      a: [
        "Tap a row to see its transactions, then tap a transaction to open the full receipt. \"1 of 13\" shows how many of the receipt's lines were exceptions, and a \"last\" tag means the exception was the final line of the sale.",
      ],
    },
    {
      q: "Why does it say \"Capped\"?",
      a: [
        "Very large searches load only part of the transactions, so the totals run low. Search a single store to see everything.",
      ],
    },
  ],

  terms: [
    {
      term: "Exception",
      def: "The kind of transaction being examined, picked once per search because each one is its own query. The page lands on refunds or voids when the week has them, since those are what people usually come here for.",
    },
    {
      term: "Lens",
      def: "What the exceptions are grouped by. The same week reads differently through each, and switching costs nothing — it re-groups what is already loaded rather than fetching again.",
      parts: [
        { label: "Store", def: "One row per location. Where to start when a group was searched." },
        { label: "Cashier", def: "One row per person. The behaviour view." },
        { label: "Item", def: "One row per product. A single item across many cashiers usually means a bad tag or a wrong price, not theft." },
        { label: "Terminal", def: "One row per lane. Isolates a broken scanner or a misconfigured register." },
      ],
    },
    {
      term: "Signal",
      def: "One row in the list — a group of exception lines under the current lens, with the lines, transactions and dollars they account for.",
    },
    {
      term: "The spread badge",
      def: "The badge on each row, and the page's central judgement: is this one person, or is it the item or the lane? Anything a single cashier owns is behaviour; the same exception spread across several is almost always a bad tag, a wrong price, or a broken lane. It is a classification, not a grade — a wide signal is not worse than a single one, it is a different kind of problem, which is why it carries no red or green.",
      parts: [
        { label: "On most lenses", def: "Counts the distinct cashiers involved — one, two, or more." },
        { label: "On the Cashier lens", def: "Counts distinct items instead. One person on one or two items is a narrower story than one person across a dozen." },
        { label: "unmapped upc", def: "The item came back with no description at all. Almost always a catalogue gap rather than anything a cashier did." },
      ],
    },
    {
      term: "Lines vs transactions",
      def: "One receipt can contribute many exception lines — the same item voided eleven times in a single sale. The list counts both, and the drill-down collapses to one row per transaction so the two never contradict each other.",
    },
    {
      term: "1 of 13 · last",
      def: "Where the exception sat in the receipt: how many of that transaction's lines it accounts for, out of the total. The amber \"last\" tag means it was the final line of the sale — the classic pattern for ringing a full order, then voiding at the end. Worth a look, not proof.",
    },
    {
      term: "The summary line",
      def: "The sentence above the transactions is the page reading its own numbers back — how many cashiers and items are involved, the most repeated item, and how many landed on a last line. It is a starting point for the question, not an answer to it.",
    },
    {
      term: "Totals",
      def: "The strip along the top covers the whole exception set for the week, not the selected signal: lines, transactions, dollars, and how many distinct stores, cashiers and items are involved.",
    },
    {
      term: "Receipts",
      def: "Tapping a transaction opens the full receipt — every line of the sale, not only the exception lines. That is what makes the line position above meaningful.",
    },
  ],
};
