import type { HelpContent } from "../helpTypes";

/** Help for Coupons — where coupons are being used, and the receipts behind them. */
export const COUPONS_HELP: HelpContent = {
  screen: "Coupons",
  purpose:
    "Where coupons are being used — by store, sub department, date or cashier — and the transactions behind them.",

  guides: [
    {
      id: "load",
      title: "Load coupons",
      desc: "Pick a scope and a date range",
      steps: [
        {
          title: "Pick a store or group",
          pre: "Choose Store or Group and pick one. The button reads",
          chip: "Select Store",
          post: "or Select Group until you have.",
          anchor: "search",
        },
        {
          title: "Set the dates and load",
          pre: "Set the range, then press",
          chip: "Load Coupons",
          post: ".",
          see: "A store list on the left — each store with its coupon count and total amount.",
          anchor: "store-list",
        },
        {
          title: "Search again",
          pre: "Click the magnifying glass at the top of the store list to change the store, group or dates.",
          anchor: "search",
        },
      ],
      issues: [
        {
          q: "I searched a group and want one store",
          a: "“All stores” is the group combined; click a single store to narrow to it. Large groups also get a store search box.",
        },
      ],
    },
    {
      id: "trace",
      title: "Trace a coupon to its receipt",
      desc: "Product, then use, then the whole sale",
      steps: [
        {
          title: "Find the product",
          pre: "Each row in the product table is a product, with how many transactions it was used in (Trans), how many coupons (Count) and the total amount.",
          anchor: "products",
        },
        {
          title: "Open its uses",
          pre: "Click the row to list each use, with the cashier, date, transaction ID, quantity and amount.",
        },
        {
          title: "Open the sale",
          pre: "Click a use to see every line on that receipt, marked Sale, Cpn or Tender, with coupons, tax, net and total at the bottom. Press",
          chip: "Back to coupons",
          post: "to return.",
        },
      ],
    },
  ],

  fixes: [],

  terms: [
    {
      term: "Amt / Qty",
      def: "Sorts stores, groups and products by total coupon amount (Amt) or by number of coupons (Qty). The Date tab always stays in date order.",
      anchor: "metric",
    },
    {
      term: "The figures across the top",
      def: "Coupons is how many were used, Total amt their value, Avg / coupon the average. Products and Sub depts count the distinct items and sub departments. Vendor is how many were vendor coupons.",
      anchor: "kpis",
    },
    {
      term: "Sub dept, Date and Cashier tabs",
      def: "The same coupons grouped differently. Click a group to see only its coupons and totals, and click it again to go back to everything.",
      anchor: "tabs",
    },
    {
      term: "Filtering the product table",
      def: "Click the UPC, Product, Sub dept or Total heading. The Total filter can show amounts greater than, less than or equal to a figure.",
      anchor: "products",
    },
    {
      term: "Export CSV",
      def: "Presets downloads the coupon records for what you are viewing, and lets you pick stores for a group. Custom lets you choose the grouping and which totals to include.",
      anchor: "export",
    },
  ],
};
