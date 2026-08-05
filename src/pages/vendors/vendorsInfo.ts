import type { InfoGlossaryEntry } from "../../components/InfoPopover";

/** Content for the "?" popover in the Vendors header.
 *
 *  Kept beside the page rather than in the component so the copy can be edited
 *  without touching layout, matching salesInfo.ts and categoriesInfo.ts.
 */
export const VENDORS_INFO: {
  title: string;
  purpose: string;
  glossary: InfoGlossaryEntry[];
} = {
  title: "Vendors",
  purpose:
    "Shows which of a store's suppliers are falling behind, then lets you drill into the items and departments where it happened.",
  glossary: [
    {
      term: "Crit / Watch / OK",
      desc: "Graded against last year, or last week if this vendor has no matching week a year ago. Crit means down more than your threshold; Watch means down, but not past it; OK means flat or up. Click a chip to show only those; click it again to clear.",
    },
    {
      term: "Ungraded",
      desc: "Sold this week but has neither a last-week nor a last-year figure to compare against. Not a verdict — there is simply nothing to grade it on yet. The chip only appears when some exist.",
    },
    {
      term: "Vendor Threshold",
      desc: "How far a decline has to go before a vendor is flagged Crit. The Items tab has its own separate threshold, since a single UPC moving is a smaller thing than a whole vendor moving.",
    },
    {
      term: "No vendor",
      desc: "Coupon (CPN) lines and anything else the POS books without a supplier. Kept in the list rather than dropped, so the vendors still add up to the store total — but it isn't a supplier, and a large bucket here is worth a look on its own.",
    },
    {
      term: "Items · sub depts",
      desc: "How much of the store a vendor touches. A 20% fall means something different for a one-item supplier than for the wholesaler behind half the shelves, and the count is what tells them apart.",
    },
    {
      term: "Day strip",
      desc: "Picking a day narrows everything below it — the KPIs, the items, the departments — to that day alone. Click the selected day again, or All Week, to go back to the full week.",
    },
    {
      term: "Items tab",
      desc: "Every UPC this vendor supplied, graded the same way the vendors are. Selecting one shows its margin, contribution and day-of-week pattern.",
    },
    {
      term: "Sub departments tab",
      desc: "Which departments this vendor reaches, and how each moved. A vendor can hold overall while quietly losing one department.",
    },
    {
      term: "Sales vs Qty",
      desc: "Swaps the whole page from dollars to units sold, including every KPI and every grade — vendors and items alike.",
    },
    {
      term: "vs LW / vs LY",
      desc: "Only compares days present in both periods, so a week still in progress isn't dragged down by days that haven't happened yet. A dash means there's no comparable period at all.",
    },
    {
      term: "Net sales",
      desc: "Sales less tax, the same figure Sub Dept Margins and Item Lookup compare on — so a vendor's total here reconciles with the departments it sits in.",
    },
    {
      term: "Where the data comes from",
      desc: "Vendor is carried on the item rows, which arrive one department at a time. The page asks which departments sold this week, then walks all of them across three periods — which is why it takes longer to load than the pages above it.",
    },
    {
      term: "Export",
      desc: "Covers whatever the date pills are set to, so a single day exports that day. Vendors are always the full list; items and departments cover the open vendor only.",
    },
  ],
};
