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
      desc: "Two sources. **Estimated** comes from daily sales — net sales divided by units for each day, same-price days grouped. Always available. **Transactions** are real register lines, fetched only for the item you select. Estimated says roughly what it has been selling at; transactions say what individual customers paid.",
    },
    {
      term: "Received (90 days)",
      desc: "Every delivery in the lookback, newest first. Qty is sellable units, Retail is what that invoice expected the item to sell for, GM% the margin those two imply. The heading pairs the last arrival with how often the item usually comes — context for reading the date, not a trigger. Reorder is decided by sold against received.",
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
      desc: "Both measure the same shelf, differently. No delivery in 14 days and you get **Unit movement** alone. Exactly one and you get **Since last delivery** alone — the 14-day figure would count sales made before that delivery and charge them against it. Two or more and you get both.",
    },
    {
      term: "Opening a transaction price",
      desc: "A price row opens the sales that rang at it — one per transaction, with the cashier and the price type. Price type is the quickest explanation available: a promotional ring is planned, the same price ringing as Regular is not. Neither is automatically fine — a promotion below cost is raised as Reprice.",
    },
    {
      term: "Opening a transaction",
      desc: "Shows the whole basket that sale belonged to, with your item marked. An item ringing at the wrong price is one story; ringing wrong only when scanned alongside something else is another, and nothing else here separates them.",
    },
  ],
};
