import type { PhoneHelp } from "../helpTypes";

/** Help for Loss Prevention on a phone. Ported from its `-mobile` help page. */
export const LOSS_PREVENTION_PHONE_HELP: PhoneHelp = {
  screen: "Loss Prevention",
  purpose:
    "Exception activity — voids, refunds, no-sales and the rest — for the week you searched, next to the same stores' and cashiers' own prior two weeks. Nothing is graded: the two sit side by side and you draw the conclusion.",

  questions: [
    {
      q: "What does this page show?",
      a: [
        "The number of exception transactions for the week you searched, side by side with a normal week from before. You can go from all your stores down to a single receipt.",
      ],
    },
    {
      q: "How do I run a search?",
      a: [
        "Choose a store or group and a week ending date, then tap Load exceptions. To search again, tap Back on the top card.",
      ],
    },
    {
      q: "What do WK, AVG, Per txn and Busiest mean?",
      a: [
        "WK is the week you searched. AVG is the two weeks before it, averaged into one week; with a day picked, it is that same weekday. Per txn is the dollar amount divided by the number of transactions, and Busiest is the day with the most exception transactions.",
      ],
    },
    {
      q: "How do I pick an exception type?",
      a: [
        "Tap the title on the top card and choose a type from the list, which shows each type's figures. Your choice applies to the whole screen, including every store below; the first entry shows all types at once.",
      ],
    },
    {
      q: "How do I open a store?",
      a: [
        "If you searched more than one store, tap a store in the list to open its report. Only one opens at a time; tap it again to close it.",
      ],
    },
    {
      q: "How do I see cashiers and transactions?",
      a: [
        "Tap View details on the open card, then choose Cashiers or Transactions. Tap a cashier to see only their transactions, and tap a transaction to open its receipt. You can search transactions by sale ID, cashier or lane.",
      ],
    },
    {
      q: "How do I look at a single day?",
      a: [
        "Tap a day on the chart. On the top card this changes the whole screen; inside a store it changes only that store. Tap the same day again for the full week.",
      ],
    },
    {
      q: "How do I sort or filter the stores?",
      a: [
        "Tap Transactions, Amount, vs Avg or Store # to sort; vs Avg puts the biggest rise over AVG first. Tap the same one again to reverse it, and once more to go back. Type in Filter by store to narrow the list.",
      ],
    },
  ],

  terms: [
    {
      term: "The big number",
      def: "Exception transactions for whatever is in view — the whole week or the day you have tapped, for the store and exception type you have open. A transaction with two exceptions on it counts once.",
    },
    {
      term: "WK / AVG",
      def: "WK is the week you searched. AVG is the two weeks before it, added up and halved into one week's worth. With a day picked, AVG is that weekday in those two weeks, halved — so a Saturday is compared with an average Saturday.",
    },
    {
      term: "Exception type",
      def: "Tap the underlined title on the top card to choose one. The list shows every type with its own figures, so you can see which is worst before choosing. Picking one narrows the whole screen, including every store below; the first entry is every type at once.",
    },
    {
      term: "The card at the top",
      def: "All the stores you searched, together. Open it for the week's shape and its own cashiers and transactions.",
    },
    {
      term: "Open a store",
      def: "Tap a store to open its report where it sits. One opens at a time; the others shrink to a single line. Changing the exception type keeps your store open.",
    },
    {
      term: "View details",
      def: "Opens that store's cashiers and transactions on their own screen. Tap a cashier to see just their transactions, and a transaction to open the receipt. Back returns to the list with your card still open.",
    },
    {
      term: "Tap a day",
      def: "On the top card, scopes the whole screen — its figures and every store below. Inside a store's card it scopes that store only, and is cleared when you open a different one. Tap the same day again for the full week.",
    },
    {
      term: "Sort by",
      def: "Transactions and Amount put the biggest first. vs Avg puts the biggest rise over AVG first — the most extra exceptions, not the biggest percentage, so a cashier going from 1 to 3 does not outrank one going from 20 to 30. Store # and Name sort in order. Tap the same one again to reverse it, and once more to put the list back the way it arrived. Stores and Cashiers each remember their own sort.",
    },
    {
      term: "Filter by store",
      def: "Narrows a long list to the stores matching what you type. It only hides rows — no figure changes.",
    },
    {
      term: "Transactions list",
      def: "Newest first, because a run of exceptions in one evening is the pattern worth seeing. Search it by sale ID, cashier or lane.",
    },
    {
      term: "Busiest",
      def: "The day of the week with the most exception transactions for what is in view.",
    },
    {
      term: "Per txn",
      def: "The dollar amount divided by the number of transactions.",
    },
  ],
};
