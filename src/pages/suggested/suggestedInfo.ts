import type { InfoGlossaryEntry } from "../../components/InfoPopover";

/**
 * Help text, scoped to what is on screen.
 *
 * One flat glossary stopped working when the right panel became three tabs: the
 * same term does not mean the same thing between them. "Waste %" on the Order
 * tab is an adjustment being added to what you buy; on Production it is a loss
 * rate you are trying to bring down. Reading both definitions at once is worse
 * than reading neither.
 *
 * `glossary` stays the page-level set, which is what the store list opens.
 */
const NOT_AN_ORDER: InfoGlossaryEntry = {
  term: "What this number is not",
  desc: "It is a forecast of what customers will buy, not a quantity to write on the order. Nothing here subtracts stock already in the case, and nothing subtracts what is already on the way — so a buyer has to net those off by eye. It is built from demand plus recorded waste; once receipts arrive it will also cover what entered and never sold.",
};

const LEAD_COVER: InfoGlossaryEntry = {
  term: "Days until delivery / Cover days",
  desc: "Days until delivery is how long between placing the order and it arriving; Cover days is how long the delivery has to last. Cover days runs to your next delivery, not through it: the day the next truck lands is that order's to cover, not this one's.",
};

const WASTE_PCT: InfoGlossaryEntry = {
  term: "Waste %",
  desc: "The percentage added to this item's order to cover product that will not sell: for every 100 lb sold, this much gets thrown away. A dash means no waste signal exists for it, so its order is pure demand. Built from markdowns where they exist, otherwise recorded damage — never both, because the two overlap almost entirely and adding them would double-count the heaviest wasters.",
};

const MARKED_DOWN: InfoGlossaryEntry = {
  term: "Marked down",
  desc: "Recorded waste in pounds, over each item's whole recorded life — not the cover window, which is why it is not totalled. Sort it to find where the waste actually is: a small percentage of a big mover is more pounds than a big percentage of a slow one.",
};

export const SUGGESTED_INFO: {
  title: string;
  purpose: string;
  glossary: InfoGlossaryEntry[];
  byTab: Record<
    "topToOrder" | "order" | "production" | "notSelling",
    InfoGlossaryEntry[]
  >;
} = {
  title: "Suggested Weight",
  purpose:
    "How many pounds of each scale item to buy to cover the days between the next delivery and the one after it. Demand is learned per weekday, then adjusted for waste.",

  /* ── the store list ── */
  glossary: [
    NOT_AN_ORDER,
    LEAD_COVER,
    {
      term: "Order lb",
      desc: "The pounds that store or department is being asked to buy for this window. Stores are heaviest first, which is usually the order somebody works them in.",
    },
    {
      term: "Capped",
      desc: "Items whose raw waste rate blew past its limit and was clamped. That is a keying problem — an item receiving under one code and selling under another — not heavy waste. Treat these as data cleanup, not an order.",
    },
    {
      term: "No department",
      desc: "Items missing from the inventory table, so the endpoint could not name their department. They carry real weight and still have to be ordered.",
    },
  ],

  byTab: {
    /* ── store overview, before a department is picked ── */
    topToOrder: [
      {
        term: "Top to order",
        desc: "The store's heaviest lines for this window, across every department, in the order the endpoint returns them. It is here because the biggest single item is often not in the biggest department — opening the heaviest department first can walk you straight past it. Click a row to jump to its department.",
      },
      NOT_AN_ORDER,
      LEAD_COVER,
    ],

    /* ── Order ── */
    order: [
      NOT_AN_ORDER,
      {
        term: "The day cards",
        desc: "NOT forecasts for those dates. Each card is what this department does on that day of the WEEK, averaged over the lookback, labelled with the date it will be delivered against — which is why the value says 'typical'. Move the order to a different Friday and the number is identical. The cards sum to Cover demand, which is why they sit on an order screen.",
      },
      {
        term: "Order",
        desc: "The total of the Order lb column — every pound the sheet is asking you to buy. Follows the column filters, so filtering to one vendor's items totals just those.",
      },
      {
        term: "Cover demand",
        desc: "What the cover window alone is forecast to sell, before any waste adjustment. Order minus Cover demand is the waste allowance being added.",
      },
      {
        term: "Avg / day",
        desc: "The ordinary daily rate of the rows on screen. It is the intuition check: Cover demand should be roughly this times the cover days, and the gap between them is the weekday shape — a Fri-Mon window is not four average days. The day cards are graded against this same figure.",
      },
      {
        term: "Items",
        desc: "Rows currently shown, after filters. Not the department's full item count, which is why it moves when you filter.",
      },
      {
        term: "Capped",
        desc: "Items whose raw waste rate blew past its limit and was clamped — a keying problem rather than heavy waste. Click the Waste % header to show only those.",
      },
      {
        term: "What the waste figure is built from",
        desc: "How much of this sheet is measured rather than guessed. Receipts is the best signal and needs EDI; markdown is the best available today and is where meat's loss lives; damage is narrower and only used where an item has no markdowns; no signal means that item's order is pure demand. Counts are over the whole store, not the department on screen.",
      },
      WASTE_PCT,
      MARKED_DOWN,
    ],

    /* ── Production ── */
    production: [
      {
        term: "Sold per day",
        desc: "What the department actually moved, day by day. The days that happened, as opposed to the typical week below it — the gap between the two rows is the point of this tab. The dashed line is the average of days that HAVE sales, so a closed Sunday does not drag it down.",
      },
      {
        term: "Typical week",
        desc: "All seven weekday averages over the lookback. The Order tab shows only the days the current order has to cover; this is the full shape, which is what you plan a production week against. Same source, wider slice.",
      },
      {
        term: "Lb per day per item carried",
        desc: "Where this store sits against the others in this department, divided by how many items each one stocks. Raw pounds is the wrong comparison and wrong in an alarming way: a store carrying five meat items against another's hundred and eighty reads as down 99% and has simply not got a meat case.",
      },
      WASTE_PCT,
    ],

    /* ── Not selling ── */
    notSelling: [
      {
        term: "Declining",
        desc: "Still selling, but well down on its own earlier rate. This is the one worth watching: dead and stopped items are visible to anyone paying attention, but an item moving at half its old rate looks fine on a shelf while being produced to the old level and rotting the difference.",
      },
      {
        term: "Stopped",
        desc: "Sold in the earlier half of the lookback and nothing at all in the recent half. Either it was pulled deliberately, or something is wrong.",
      },
      {
        term: "Dead",
        desc: "Carried, but with no recorded weight in either half of the window. A cleanup list rather than an urgent one.",
      },
      {
        term: "Prior / Recent lb/day",
        desc: "Per day, not totals — the two halves of the lookback are different lengths, and comparing raw totals would call almost everything declining.",
      },
      {
        term: "Lost lb",
        desc: "The pounds this item used to sell across the recent window and now does not. Computed here rather than returned by the endpoint, because without it a heavy item that stopped sorts level with a slow one and the list cannot be read by what it is costing you.",
      },
    ],
  },
};
