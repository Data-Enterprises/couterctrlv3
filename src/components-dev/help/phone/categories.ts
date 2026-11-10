import type { PhoneHelp } from "../helpTypes";

/** Help for Categories on a phone. Ported from its `-mobile` help page. */
export const CATEGORIES_PHONE_HELP: PhoneHelp = {
  screen: "Categories",
  purpose:
    "Margin for one store's week against the same week last year, by category. Open one to see its figures, then its items, then a single item's week day by day. Nothing is graded: this year, last year and last week sit side by side and you draw the conclusion.",

  questions: [
    {
      q: "What does this page show?",
      a: [
        "The store’s week at the top, then a card for each category, biggest sellers first. Last year (LY) is the same weekdays last year, so a Monday is compared with a Monday. Tap Back on the store card to change the store or week.",
      ],
    },
    {
      q: "What do TY margin, LY margin, gross profit and cost mean?",
      a: [
        "Margin is sales minus cost of goods, as a percentage of sales, this year (TY) and last year (LY); GPM on a row is the same figure. Gross profit is sales before tax minus that cost, and cost is what was actually paid after vendor allowances.",
      ],
    },
    {
      q: "What do the bars show?",
      a: [
        "Sales this year (TY), last year (LY) and last week (LW), on the cards and every category and item. The percentage on a card is how much its sales changed from last year. When last year has nothing on file it compares with last week instead, and the TY bar's colour follows the same rule, so the two always agree.",
        "The day chart compares this week with last year, or with last week when the store has no last year. Its legend says which.",
      ],
    },
    {
      q: "Can I see units instead of dollars?",
      a: [
        "Yes. Tap Units on the switch beside the ? on the store's card. The bars and the size sort then count units, with weighed items counted by the pound. Margin, gross profit and cost stay as they are. The switch carries across Categories, Vendors and Sub Dept Margins.",
      ],
    },
    {
      q: "What do “no history” and “days matched” mean?",
      a: [
        "“No history” means there is no record for this store last year, not that it sold nothing. The LY bar says “no history on file”, and the change and the day chart use last week instead. “Last year: 3 of 7 days matched” means only some days line up, so only those days are compared.",
      ],
    },
    {
      q: "How do I open a category and see its items?",
      a: [
        "Tap its card to open it. Tap a day in its chart to see just that day, and tap it again for the full week. Tap View items for its item list, then tap an item to see its week day by day.",
      ],
    },
    {
      q: "What is “Sold directly to the sub department”?",
      a: [
        "Sales rung on a department key at the register rather than by scanning an item. They show as one row in the item list, marked “No item scanned: rung on the department key”, with any refunds taken off.",
      ],
    },
    {
      q: "How do I find an item or scan a barcode?",
      a: [
        "Tap Find an item or scan to search the whole store by name or UPC, or tap the scan button to read a barcode. Inside a category’s item list, the box and scan button search just that list; if nothing turns up, tap the option to search the whole store.",
      ],
    },
    {
      q: "How do I sort the list?",
      a: [
        "Tap Sales (Units when the switch is on Units), Profit, GPM, Change vs LY or Change vs LW. Tap the same one again to reverse it, and once more to put the list back.",
      ],
    },
    {
      q: "My store ID covers two locations. How do I see each one?",
      a: [
        "Location buttons appear at the top of the page. Tap a store to see it; the two are never added together.",
      ],
    },
  ],

  terms: [
    {
      term: "The card at the top",
      def: "The store you searched, for the whole week — its margin, and its sales against last year. It doesn't open, because what is inside it is the list of categories underneath.",
    },
    {
      term: "TY margin / LY margin",
      def: "Gross margin this year: sales minus cost of goods, as a percentage of sales. LY margin is the same for last year.",
    },
    {
      term: "Bars",
      def: "Sales this year (TY), last year (LY) and last week (LW) — on the cards and every category and item in a list. The TY bar is compared with last year, or with last week when last year has nothing on file. The day chart compares with last year, or last week for a store with no last year, and its legend says which. The percentage says how healthy; the bars say how much was sold.",
    },
    {
      term: "Sales | Units",
      def: "The switch beside the ? on the store's card. Units makes the bars and the size sort count units, with weighed items counted by the pound. Margin, gross profit and cost stay as they are. The switch carries across Categories, Vendors and Sub Dept Margins.",
    },
    {
      term: "Gross profit / Cost",
      def: "Sales before tax minus the cost of goods sold, and that cost — this year on the top row, last year beneath. Cost is what was actually paid after vendor allowances, and weighted items cost by the pound.",
    },
    {
      term: "TY / LY / LW",
      def: "LY is the same weekdays last year, matched day by day, so a Monday is compared with a Monday. LW is the week before the one you searched. \"No history\" means we have no record for this store last year — not that it sold nothing; the LY bar says so, and the change uses last week.",
    },
    {
      term: "Open a category",
      def: "Tap it to open its report where it sits. One opens at a time; the others shrink to a single line so the one you opened has the screen.",
    },
    {
      term: "Tap a day",
      def: "Inside an open category, scopes that category to the day — its figures and its items. It belongs to that card only, and clears when you open a different one. Tap the same day again for the full week.",
    },
    {
      term: "View items",
      def: "Opens that category's items on their own screen. Tap an item to see its week day by day. Back returns to the list with your card still open.",
    },
    {
      term: "Sold directly to the sub department",
      def: "Sales rung on a department key at the register rather than by scanning an item. They are one row in the item list, marked “No item scanned: rung on the department key”, with any refunds taken off.",
    },
    {
      term: "Find an item or scan",
      def: "Searches every item in the store's week, not just one category — by name, by UPC, or by scanning a barcode. Each result names the category it came from, and tapping one goes straight to that item's week.",
    },
    {
      term: "Filtering and scanning a list",
      def: "The box above a list narrows it to what you type, and the scan button fills it from a barcode. Inside a category that only covers its own items, so if a scan finds nothing the screen offers to search the whole store for it instead.",
    },
    {
      term: "Sort by",
      def: "Sales puts the biggest sellers first (Units, when the switch is on Units). Profit puts the biggest earners first. GPM puts the thinnest margins first. Change vs LY and Change vs LW put the biggest drop first; anything with nothing to compare goes to the bottom. Tap the same one again to reverse it, and once more to put the list back the way it arrived.",
    },
    {
      term: "Each page keeps its place",
      def: "Sub Dept Margins, Vendors and Categories each remember their own search, sort and open card. Moving between them leaves the others as you left them.",
    },
    {
      term: "Location",
      def: "A few stores share one store ID across two locations. When that happens you can switch between them; the figures are never added together.",
    },
  ],
};
