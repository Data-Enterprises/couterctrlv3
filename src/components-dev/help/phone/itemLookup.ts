import type { PhoneHelp } from "../helpTypes";

/** Help for Item Lookup on a phone. Ported from its `-mobile` help page. */
export const ITEM_LOOKUP_PHONE_HELP: PhoneHelp = {
  screen: "Item Lookup",
  purpose:
    "One item at one store over the last fourteen days — what it sold, what it sold at, and how that has moved. Nothing is graded: the figures sit as they are and you draw the conclusion.",

  questions: [
    {
      q: "How do I look up an item?",
      a: [
        "Choose a store in the Select Store box (your first store is filled in for you), then type the UPC or product code and tap Search. You can also tap Scan barcode to use your camera. Until a store is picked, the button reads \"Select Store\" and won't search.",
      ],
    },
    {
      q: "The camera won't read the barcode. What do I do?",
      a: [
        "Hold the phone steady and tap Try scanning again. If it still won't read, type the code into the box above instead. Tap Close camera to stop scanning.",
      ],
    },
    {
      q: "What dates does it cover?",
      a: [
        "Always the last 14 days, ending yesterday, because today's sales are still coming in. The dates are shown under the store name.",
      ],
    },
    {
      q: "What do the figures mean?",
      a: [
        "Amount, Qty, COGS (cost of goods) and Margin are totals for the 14 days, and the rows below show each day. \"No cost\" means no cost is on file for the item, so a margin can't be worked out. A red \"Selling below cost\" line means the margin is negative.",
      ],
    },
    {
      q: "Why do some items show \"Lb\" and \"Cost/lb\"?",
      a: [
        "Those items are sold by weight. Qty is how many times the item was rung up, and Lb is the pounds sold. Cost is shown per pound.",
      ],
    },
    {
      q: "What do the warnings mean?",
      a: [
        "\"Slowing down\" means this week sold fewer units than the week before. \"No sales in the last X days\" means the item hasn't sold for two or more days up to yesterday, which can mean it is out of stock.",
      ],
    },
    {
      q: "What is \"By sale type\"?",
      a: [
        "It splits the item's register lines into Sale, Backup (restored transactions), Cancelled and Voided. Tap one to see its days, then tap Back to sales to return. The other figures count Sale lines only.",
      ],
    },
    {
      q: "How do I look up another item?",
      a: [
        "Tap the back arrow at the top left to return to the search. To see an item you checked recently, tap it in the list under the search, or tap the clock icon on the results screen.",
      ],
    },
  ],

  terms: [
    {
      term: "The bar chart",
      def: "One column per day, sized by what the item took. It is also this screen's only filter: tap a column to scope the figures beneath it to that day, and tap the same column again for the whole window. A day with no sales is a flat stub and cannot be tapped.",
    },
    {
      term: "Pounds or a count",
      def: "An item priced on the scale is measured in pounds; anything else is counted. You see one or the other, never both — a scale item rings a quantity of zero, so a count beside it would be a column of nothing. \"$7.68/lb\" is what it actually went out at, which moves with promotions.",
    },
    {
      term: "Sold · 13 of 14 days",
      def: "How many days in the window actually sold. Every per-day average divides by that number rather than by fourteen, so a slow fortnight is not made to look worse by the days the item never sold at all.",
    },
    {
      term: "Per selling day",
      def: "Takings divided by the days that sold. The figure beside it is the same for pounds or units.",
    },
    {
      term: "Best day",
      def: "The biggest day by takings inside the window, with what it took.",
    },
    {
      term: "Share of window / vs typical day",
      def: "Shown once a day is scoped. Share is that day against the whole window. Typical day compares it with the average of the days that SOLD — measured against the window it would flatter every day the item opened.",
    },
    {
      term: "Cost and margin",
      def: "Cost is what one unit cost after any vendor allowance, not the invoice list price, which is why margin here agrees with Sub Dept Margins. When no cost is on file the screen says so once, rather than reporting a margin computed from a cost of zero.",
    },
    {
      term: "Shelf price",
      def: "The item's list price, shown when there is no cost to report a margin against.",
    },
    {
      term: "By sale type",
      def: "Every register line is a Sale, Backup (a restored transaction), Cancelled or Voided. The headline figures count Sale lines only. Tap another type to read its days instead; tap it again to come back. Cost and margin are left off those, since they are not sales.",
    },
    {
      term: "Day by day",
      def: "Every day in the window, newest first, with what it took, how much moved and the rate it went out at. It is a list, not a control — the chart above is what scopes the screen, and the row for a scoped day is highlighted here so you can see which one the figures describe.",
    },
    {
      term: "Slowing down",
      def: "Appears when the second week of the window moved noticeably less than the first, even if the item is still selling.",
    },
    {
      term: "No sales in the last N days",
      def: "A run of days with nothing sold, counting back from the end of the window. Often a sign an item is out of stock or delisted rather than merely slow.",
    },
    {
      term: "The window",
      def: "Fourteen days ending yesterday, not today — today's sales have not finished posting.",
    },
    {
      term: "Location",
      def: "A few stores share one store ID across two locations. When that happens you can switch between them; the figures are never added together.",
    },
  ],
};
