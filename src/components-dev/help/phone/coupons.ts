import type { PhoneHelp } from "../helpTypes";

/** Help for Coupons on a phone. Ported from its `-mobile` help page. */
export const COUPONS_PHONE_HELP: PhoneHelp = {
  screen: "Coupons",
  purpose:
    "See where coupon activity is concentrated — by store, sub department, date, or cashier — and drill into the actual transactions behind it.",

  questions: [
    {
      q: "How do I load coupons?",
      a: [
        "Choose Store or Group, pick the store or group, set the date range and tap Load Coupons. The button says \"Select Store\" or \"Select Group\" until you pick one.",
      ],
    },
    {
      q: "What if I searched a group?",
      a: [
        "You'll first see each store with its coupon count and total. Tap \"All stores\" for the whole group combined, or tap one store to see just that store.",
      ],
    },
    {
      q: "What do the numbers at the top mean?",
      a: [
        "Coupons is how many were used, Total is their total value, Avg is the average per coupon and Products is how many different items they were used on.",
      ],
    },
    {
      q: "What are the Sub dept, Date and Cashier tabs?",
      a: [
        "They group the same coupons in different ways. Tap a row to see the products in that group.",
      ],
    },
    {
      q: "What does the Amt / Qty switch do?",
      a: [
        "It sorts the lists by total coupon amount (Amt) or by number of coupons (Qty). The Date tab always stays in date order.",
      ],
    },
    {
      q: "How do I see the transactions behind a coupon?",
      a: [
        "Tap a product to list each time it was used, with the cashier, date, transaction number and amount. Tap one to open the full sale in a panel from the bottom, with coupons, tax, net and total. The download icon in that panel exports it.",
      ],
    },
    {
      q: "How do I export coupons?",
      a: [
        "Tap the download icon at the top of the store list or the tabs screen. Choose Presets for the coupon records or Custom to pick your own grouping and totals, then download the CSV.",
      ],
    },
    {
      q: "How do I go back or start a new search?",
      a: [
        "Tap the back arrow to step back one screen. From the first results screen it takes you to the search form. For a group, the search icon at the top also takes you straight there.",
      ],
    },
  ],

  terms: [
    {
      term: "All stores (group view)",
      def: "The combined total across every store in the group, not one store's number.",
    },
    {
      term: "Amt / Qty toggle",
      def: "Switches the store list ranking between total coupon dollar amount and number of coupons used.",
    },
    {
      term: "Sub dept / Date / Cashier tabs",
      def: "Same coupon activity, just re-grouped a different way — not separate data sets.",
    },
    {
      term: "Amount filter",
      def: "Narrows the list to coupons within a dollar range; unrelated to grading or thresholds.",
    },
  ],
};
