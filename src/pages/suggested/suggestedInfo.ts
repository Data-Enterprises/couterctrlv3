import type { InfoGlossaryEntry } from "../../components/InfoPopover";

export const SUGGESTED_INFO: {
  title: string;
  purpose: string;
  glossary: InfoGlossaryEntry[];
} = {
  title: "Suggested Order",
  purpose:
    "How many pounds of each scale item to buy to cover the days between the next delivery and the one after it. Demand is learned per weekday, then adjusted for waste.",
  glossary: [
    {
      term: "What this number is not",
      desc: "It is a forecast of what customers will buy, not a quantity to write on the order. Nothing here subtracts stock already in the case, and nothing subtracts what is already on the way — so a buyer has to net those off by eye. It is built from demand plus recorded waste; once receipts arrive it will also cover what entered and never sold.",
    },
    {
      term: "Lead / Cover days",
      desc: "Lead is days until the delivery lands; Cover is how many days it has to last. They should add up to your real ordering rhythm — ordering Wednesday for Friday and again Saturday for Monday is Lead 2, Cover 3, not 4, or Monday gets bought twice.",
    },

    /* ── the KPI strip, tile by tile ── */
    {
      term: "Order",
      desc: "The total of the Order lb column — every pound the sheet is asking you to buy for this department. Follows the column filters, so filtering to one vendor's items totals just those.",
    },
    {
      term: "Cover demand",
      desc: "What the cover window alone is forecast to sell, before any shrink adjustment. Order minus Cover demand is the waste allowance being added.",
    },
    {
      term: "Avg / day",
      desc: "The department's ordinary daily rate, from the whole lookback. It is the intuition check: Cover demand should be roughly this times the cover days, and the gap between them is the weekday shape — a Fri-Mon window is not four average days.",
    },
    {
      term: "Items",
      desc: "Rows currently shown, after filters. Not the department's full item count, which is why it moves when you filter.",
    },
    {
      term: "Shrink applied",
      desc: "How many of those items got any waste uplift at all. A low number against a high item count means the department is running on pure demand, with no recorded waste behind it.",
    },
    {
      term: "Capped",
      desc: "Items whose raw shrink rate blew past its limit and was clamped. That is a keying problem — an item receiving under one code and selling under another — not heavy waste. Treat these as data cleanup, not an order; click the Shrink header to show only them.",
    },

    /* ── columns ── */
    {
      term: "Shrink",
      desc: "The uplift applied to that item, as a percentage. A dash means none was applied. Built from receipts where EDI exists, otherwise from recorded waste — markdowns first, since that is where meat's loss is recorded, and damage only where there are no markdowns. The two are never added together: they overlap almost entirely, and stacking them would double-count the most heavily wasted items.",
    },
    {
      term: "No department",
      desc: "Items missing from the inventory table, so the endpoint could not name their department. They carry real weight and still have to be ordered.",
    },
  ],
};
