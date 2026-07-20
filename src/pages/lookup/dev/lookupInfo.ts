import type { InfoGlossaryEntry } from "../../../components/InfoPopover";

export const LOOKUP_INFO: { title: string; purpose: string; glossary: InfoGlossaryEntry[] } = {
  title: "Item Lookup",
  purpose: "Look up specific UPCs at a store to see how they're actually performing — margin, pricing, and sales gaps — without digging through the full sales report.",
  glossary: [
    { term: "Margin %", desc: "Calculated fresh for this store over the last 14 days (revenue vs. cost). Not carried over from wherever the UPC was copied from, so the same item can show different margins at different stores." },
    { term: "Queue vs. Report", desc: "The queue (left) is your batch list and shows each item's status as it loads. The report (right) is the full 14-day detail for whichever one item you've selected." },
    { term: "14-day window", desc: "Always ends yesterday, not today, since today's sales aren't finished posting yet." },
    { term: "Longest gap", desc: "The longest stretch of consecutive days with zero sales inside the 14-day window. A useful sign an item may be out of stock or delisted rather than just slow." },
    { term: "Slowing trend", desc: "Flags when the second week of the window sold noticeably fewer units than the first week, even if the item is still selling." },
    { term: "Loading status (queue)", desc: "Each queued UPC fetches independently, so some can finish while others are still loading or error out." },
  ],
};
