import type { PhoneHelp } from "../helpTypes";

/** Help for Sales on a phone. Ported from its `-mobile` help page. */
export const SALES_PHONE_HELP: PhoneHelp = {
  screen: "Sales",
  purpose:
    "This year against last year and last week for the week you searched. Open a store to see its week, then open a sub department to see the items in it.",

  questions: [
    {
      q: "How do I load my sales?",
      a: [
        "Pick a store or group and an end date, then tap Load sales. You get the seven days ending on that date, this year against the same days last year. Tap the search button on the top card to search again.",
      ],
    },
    {
      q: "What do TY, LY and LW mean?",
      a: [
        "TY is this year, the week you searched. LY is the same weekdays last year, matched day by day. LW is the week before the one you searched. Every card and row draws all three as bars.",
        "The change shows how this year compares to last year. When last year has nothing on file, it compares with last week instead, and the TY bar's colour follows the same rule, so the two always agree. A dash means there is nothing to compare to.",
      ],
    },
    {
      q: "Can I see units instead of dollars?",
      a: [
        "Yes. Tap Units on the switch beside the ? on the top card, or on the store's card when you search one store. Every figure, bar and sort then counts units. Transactions, average basket, tax and coupons stay in dollars. Tap Sales to switch back.",
      ],
    },
    {
      q: "What does \"3 of 7 days matched\" mean?",
      a: [
        "Last year only has some of this week's days on file, so the comparison covers just those days. \"No history\" means last year has none of them: the LY bar says \"no history on file\", and the change and the day chart compare with last week instead. The chart's legend says which it is using.",
      ],
    },
    {
      q: "How do I see one store?",
      a: [
        "Tap a store to open its week, total, transactions, average basket, tax and coupons. Only one store opens at a time. Tap it again to close it.",
      ],
    },
    {
      q: "Can I look at a single day?",
      a: [
        "Yes. Tap a day on the chart to see just that day, and tap it again to go back to the full week. On the top card this changes the whole screen, and inside a store it changes only that store.",
      ],
    },
    {
      q: "How do I see sub departments and hours?",
      a: [
        "Tap View details in an open store to see its sub departments and hours. Tap a sub department to see its items, and search them by description or UPC. Tap Stores to go back.",
      ],
    },
    {
      q: "What is \"Sold directly to the sub department\"?",
      a: [
        "Sales rung on the sub department's key at the register rather than by scanning an item. They show as one row in that sub department's item list, marked \"No item scanned: rung on the department key\", with any refunds taken off, so the list adds up to the sub department.",
      ],
    },
    {
      q: "How do I sort or find a store?",
      a: [
        "When you search more than one store, sort chips appear above the list: Sales (or Units), Change vs LY, Change vs LW and Store #. Tap one to sort, tap again to reverse, and a third time to go back to the original order. Sub department and hour lists sort the same way. Type in Filter by store to show only stores whose name or number matches.",
      ],
    },
  ],

  terms: [
    {
      term: "TY / LY / LW",
      def: "TY is the week you searched. LY is the same weekdays last year, matched day by day, so a Monday is compared with a Monday and a holiday with the same holiday. LW is the week before the one you searched. Every card and row draws all three as bars.",
    },
    {
      term: "Sales",
      def: "Sales before tax, for whatever is in view — the whole search, or the store and day you have open. Switch to Units to count units instead.",
    },
    {
      term: "Sales | Units",
      def: "The switch beside the ? on the top card, or on the store's card when you search one store. Units makes every figure, bar and sort count units. Transactions, average basket, tax and coupons stay in dollars either way.",
    },
    {
      term: "The card at the top",
      def: "The group as a whole, and the total every store below is part of. Open it for the group's week and its own breakdowns.",
    },
    {
      term: "Open a store",
      def: "Tap a store to open its report where it sits — its week, its total against last year, and what made it up. One opens at a time; the others shrink to a single line so the open one has the screen.",
    },
    {
      term: "Transactions / Avg basket",
      def: "Transactions is the number of receipts. Avg basket is sales divided by transactions. These come from the store's own figures, so they show a grey placeholder for a moment after you open a card.",
    },
    {
      term: "Coupons",
      def: "Every coupon redeemed, split by type: digital, electronic store, electronic in-store and paper store coupons.",
    },
    {
      term: "View details",
      def: "Opens the store's sub departments and hours on their own screen. Tap a sub department to see the items in it — those load the first time you open that department and are instant after. Back returns to the list with your card still open.",
    },
    {
      term: "Sold directly to the sub department",
      def: "Sales rung on a department key at the register rather than by scanning an item. They are one row in the item list, marked “No item scanned: rung on the department key”, with any refunds taken off. The sub department's item list adds up to the sub department.",
    },
    {
      term: "Tap a day",
      def: "On the top card, scopes the whole screen — its figures and every store below. Inside a store's card it scopes that store only, and is cleared when you open a different one. Tap the same day again for the full week.",
    },
    {
      term: "Sort by",
      def: "Tap a chip to sort, again to reverse it, and a third time to go back to the order the search returned. Sales (or Units) opens on the biggest; Change vs LY and Change vs LW open on the biggest drop; rows with nothing to compare stay at the bottom either way. Each list keeps its own sort.",
    },
    {
      term: "Filter by store",
      def: "Narrows a long list to the stores whose name or number matches what you type. It only hides rows — no figure changes.",
    },
    {
      term: "Change %",
      def: "This year against last year for that row. When last year has nothing on file it compares with last week instead, and the TY bar's colour follows the same rule. A dash means there is nothing to compare to.",
    },
  ],
};
