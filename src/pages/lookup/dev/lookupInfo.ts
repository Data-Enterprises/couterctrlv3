import type { InfoGlossaryEntry } from "../../../components/InfoPopover";

export const LOOKUP_INFO: { title: string; purpose: string; glossary: InfoGlossaryEntry[] } = {
  title: "Item Lookup",
  purpose: "Look up specific UPCs at a store to see how they're actually performing — margin, pricing, and sales gaps — without digging through the full sales report.",
  glossary: [
    { term: "Margin %", desc: "Revenue less cost of goods, calculated fresh for this store over the last 14 days. Not carried over from wherever the UPC was copied from, so the same item can show different margins at different stores." },
    { term: "Cost / unit", desc: "What one unit cost you after any vendor allowance — not the list price on the invoice. An item on a vendor deal costs less than its invoice says, and this reflects that, which is why margin here matches Sub Dept Margins." },
    { term: "Cost / lb", desc: "The same figure on an item sold by weight. When you see \"lb\" instead of \"unit\", the item is priced on the scale and everything on this report counts pounds rather than scans." },
    { term: "Units vs. scans", desc: "On a scale item one scan can be several pounds — bananas ring about 2 lb at a time. Cost and margin count what was actually sold, not how many times the item was rung up." },
    { term: "Avg sold at", desc: "Revenue divided by what actually sold, so it stays comparable to the shelf price. Sits below it when the item spent part of the window on promotion." },
    { term: "Queue vs. Report", desc: "The queue (left) is your batch list and shows each item's status as it loads. The report (right) is the full 14-day detail for whichever one item you've selected." },
    { term: "14-day window", desc: "Ends yesterday, not today, since today's sales aren't finished posting yet." },
    { term: "Longest gap", desc: "The longest stretch of consecutive days with zero sales inside the 14-day window. A useful sign an item may be out of stock or delisted rather than just slow." },
    { term: "Slowing trend", desc: "Flags when the second week of the window sold noticeably fewer units than the first week, even if the item is still selling." },
    { term: "Loading status (queue)", desc: "Each queued UPC fetches independently, so some can finish while others are still loading or error out." },
  ],
};
