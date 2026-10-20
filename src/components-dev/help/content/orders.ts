import type { HelpContent } from "../helpTypes";

/** Help for Orders — orders by type and date, and the lines inside one. */
export const ORDERS_HELP: HelpContent = {
  screen: "Orders",
  purpose:
    "Your stores' orders by type and date, and the line items inside any one of them with cost, retail and profit.",

  guides: [
    {
      id: "find",
      title: "Find orders",
      desc: "A scope, a date range, then a store row",
      steps: [
        {
          title: "Pick a store or group",
          pre: "Choose Store or Group and pick one. The button reads",
          chip: "Select Store",
          post: "or Select Group until you have — so if it will not click, check that first.",
          anchor: "search",
        },
        {
          title: "Set the dates and find",
          pre: "Set the range, then press",
          chip: "Find orders",
          post: ".",
          see: "Available Orders: each store and date that has orders, with how many.",
          anchor: "orders-list",
        },
        {
          title: "Narrow the list",
          pre: "Type a store name or number in the filter box, or pick a date from the",
          chip: "All dates",
          post: "list. The tabs show all order types or just one.",
          anchor: "orders-list",
        },
        {
          title: "Search again",
          pre: "Click the magnifying glass at the top of the Available Orders list.",
          anchor: "search",
        },
      ],
    },
    {
      id: "open",
      title: "Open an order and read its lines",
      desc: "Store row, order card, line items",
      steps: [
        {
          title: "Open the store",
          pre: "Click a store row.",
          see: "Its orders as cards — order number, status, invoice total, ext cost, item count and sub departments.",
          anchor: "orders-list",
        },
        {
          title: "Open the order",
          pre: "Click a card to see its line items on the right, with the order's totals across the top.",
          anchor: "lines",
        },
        {
          title: "Narrow the lines",
          pre: "Use the",
          chip: "All sub depts",
          post: "list above the order cards to show one sub department, or click the UPC, Description or Sub dept heading in the lines to filter them.",
          anchor: "lines",
        },
      ],
    },
  ],

  fixes: [],

  terms: [
    {
      term: "Cost",
      def: "The cost per unit — not the case cost.",
      anchor: "lines",
    },
    {
      term: "Ext cost and Ext retail",
      def: "Ext cost is the unit cost times the quantity; Ext retail is the retail price times the quantity. Items sold by weight use the weight instead of a count.",
      anchor: "lines",
    },
    {
      term: "Profit and Margin",
      def: "Profit is Ext retail minus Ext cost. Margin is that profit as a percentage of Ext retail.",
      anchor: "lines",
    },
    {
      term: "Export CSV",
      def: "Presets downloads all orders, the selected order, or chosen sub departments. Custom lets you pick the columns and totals. A store has to be picked first.",
      anchor: "export",
    },
  ],
};
