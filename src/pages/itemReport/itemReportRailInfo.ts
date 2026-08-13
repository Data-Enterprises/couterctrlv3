import type { InfoGlossaryEntry } from "../../components/InfoPopover";

/**
 * Copy for the detail panel's "?" popover.
 *
 * Separate from the list's glossary rather than bolted onto it. The single "?"
 * lived on the left panel's header while already explaining right-panel things,
 * which is a control describing content it doesn't sit beside — and the detail
 * panel has roughly doubled since that copy was written. Two short glossaries,
 * each next to what it describes, beat one growing into a manual.
 *
 * Written against the components, not from memory. If the sections change, this
 * changes with them.
 */
export const ITEM_REPORT_RAIL_INFO: {
  title: string;
  purpose: string;
  glossary: InfoGlossaryEntry[];
} = {
  title: "Item detail",
  purpose:
    "Everything behind the suggestion at the top: what arrived, what moved, what it rang at, and who bought it. The strip states the call; these sections are the working.",
  glossary: [
    {
      term: "Estimated vs transaction price points",
      desc: "Two views of the same question, from different sources. **Estimated** is worked out from daily sales — net sales divided by units for each day, with days holding the same price grouped together. It is always available. **Transactions** is real register lines, fetched when you select the item and only for that item. Estimated tells you roughly what an item has been selling at; actual tells you what individual customers paid. When they disagree, the register is right.",
    },
    {
      term: "Received (90 days)",
      desc: 'Every delivery in the lookback, newest first. Qty is sellable units, Retail is what that invoice expected the item to sell for, and GM% is the margin those two imply. The heading pairs the last arrival with how often the item usually comes, averaged across every delivery in the lookback: "24d ago, usually every 9" is a reorder, "6d ago, usually every 9" is not.',
    },
    {
      term: "Billed in cases or units",
      desc: "Vendors bill one way or the other, never both. “1 case of 15” means fifteen sellable units arrived in one case; “8 cases” means eight arrived, one to a case; “by the unit” means there is no case pack. A case size of one is left unsaid, because a pack of one is the selling unit itself.",
    },
    {
      term: "Free and Returned",
      desc: "Flags on the delivery line, not quantities — the line either was free goods, or was a return, or was neither. Note that a flagged line still counts toward Received above. Whether that is right depends on how the source records a return, which has not been confirmed against a real one yet.",
    },
    {
      term: "Opening a delivery",
      desc: "A delivery row opens to show its invoice number, how it was billed, and what the line was worth at cost and at retail. The invoice number itself opens the whole order — every product on that truck — which is how you tell an item problem from a delivery problem.",
    },
    {
      term: "Unit movement",
      desc: "Over the last 14 days: units received against units sold, and the change between them. Read it as a change, not a count — nothing in the data reports opening stock, so a positive figure can still sit above an empty shelf. It is also blind to shrink, damage and transfers, so it reads high rather than low when stock goes missing.",
    },
    {
      term: "Since last delivery",
      desc: "Delivered less sold since the most recent arrival, with what that leaves over. Sharper than the 14-day figure because it starts from one known event rather than a span, so there is no opening balance to be ignorant of — but only answerable when that delivery landed inside the days we hold sales for.",
    },
    {
      term: "Why you see one block or two",
      desc: "They measure the same shelf and are not interchangeable. With no delivery in the last 14 days you get **Unit movement** alone — it is all there is. With exactly one you get **Since last delivery** alone, because the 14-day figure would count sales made *before* that delivery arrived and charge them against it, understating what is left. With two or more you get both: the span totals every arrival, the anchored block tracks only the newest.",
    },
    {
      term: "Opening a transaction price",
      desc: "A price row opens the sales that rang at it — one row per transaction, with the cashier and the price type. Price type is the quickest explanation available: TPR is a planned promotion and needs no action, while a promotional price ringing as Regular means the shelf itself is wrong.",
    },
    {
      term: "Opening a transaction",
      desc: "Shows the whole basket that sale belonged to, with your item marked. An item ringing at the wrong price is one story; an item ringing at the wrong price only when it is scanned alongside something else is a different one, and nothing else here separates them.",
    },
  ],
};
