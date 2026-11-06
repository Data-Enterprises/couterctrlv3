import type { PhoneHelp } from "../helpTypes";

/** Help for Orders on a phone. Ported from its `-mobile` help page. */
export const ORDERS_PHONE_HELP: PhoneHelp = {
  screen: "Orders",
  purpose:
    "Browse store orders by type and date, then drill into line-item detail — pricing, cost, and profit for everything on that order.",

  questions: [
    {
      q: "How do I find orders?",
      a: [
        "Choose Store or Group, pick the store or group, set the date range and tap Find orders. The button says \"Select Store\" or \"Select Group\" until you pick one.",
      ],
    },
    {
      q: "What does the first list show?",
      a: [
        "Each store and date that has orders, with how many orders it has. Use the tabs to see all order types or just one, and use the store box or \"All dates\" list to narrow it down.",
      ],
    },
    {
      q: "What does \"Select all stores\" do?",
      a: [
        "It shows up when you're on one order type tab and more than one store is listed. Tap it to see that order type for all the listed stores together, for the date you picked or your whole date range.",
      ],
    },
    {
      q: "How do I open an order?",
      a: [
        "Tap a store row to see its orders, each with its order number, status, retail total, cost and item count. Tap an order to open its line items in a panel from the bottom. If there's only one order, it opens right away.",
      ],
    },
    {
      q: "What do the retail and cost figures mean?",
      a: [
        "Retail is the retail price times the quantity. Cost is the cost per unit (not the case cost) times the quantity. Items sold by weight use the weight instead of the quantity.",
      ],
    },
    {
      q: "Can I filter by sub department?",
      a: [
        "Yes. On the order list, use the \"All sub depts\" list to show only orders for one sub department. The Orders, Items and Retail counts next to it update to match.",
      ],
    },
    {
      q: "How do I export orders?",
      a: [
        "Tap the download icon at the top of the order list, or Export in an open order. Choose Presets for ready-made downloads or Custom to pick your own columns, then download the CSV.",
      ],
    },
    {
      q: "How do I go back or start a new search?",
      a: [
        "Tap the back arrow on the order list to return to the store list. Tap the search icon on the store list to go back to the search form.",
      ],
    },
  ],

  terms: [
    {
      term: "Ext Retail",
      def: "Price × quantity (or × weight for scalable items like produce/deli).",
    },
    {
      term: "Total Cost",
      def: "Cost per unit × quantity (or weight), not the case cost.",
    },
    {
      term: "Profit",
      def: "Ext Retail minus Total Cost for that line item.",
    },
    {
      term: "Select all stores",
      def: "Pulls orders for the specific date you're viewing, not the full date range, even if you've got a wider range loaded.",
    },
  ],
};
