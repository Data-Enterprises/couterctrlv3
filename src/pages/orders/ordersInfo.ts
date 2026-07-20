import type { InfoGlossaryEntry } from "../../components/InfoPopover";

export const ORDERS_INFO: { title: string; purpose: string; glossary: InfoGlossaryEntry[] } = {
  title: "Orders",
  purpose: "Browse store orders by type and date, then drill into line-item detail — pricing, cost, and profit for everything on that order.",
  glossary: [
    { term: "Ext Retail", desc: "Price × quantity (or × weight for scalable items like produce/deli)." },
    { term: "Total Cost", desc: "Cost per unit × quantity (or weight), not the case cost." },
    { term: "Profit", desc: "Ext Retail minus Total Cost for that line item." },
    { term: "Select all stores", desc: "Pulls orders for the specific date you're viewing, not the full date range, even if you've got a wider range loaded." },
  ],
};
