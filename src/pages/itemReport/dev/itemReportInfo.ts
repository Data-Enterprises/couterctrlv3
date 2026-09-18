import type { InfoGlossaryEntry } from "../../../components-dev/InfoPopover";

/**
 * Copy for the Item Actions "?" popover.
 *
 * Written against `verdictFor` rather than from the labels, so every trigger
 * described below is the one that actually fires. If that logic changes, this
 * changes with it — a glossary that quietly stops matching the code is worse
 * than no glossary, because it is believed.
 *
 * Scope: the list only. Deliveries, price points, transactions and the two
 * modals are explained by the detail panel's own "?" — see
 * `itemReportRailInfo`. A glossary that reaches across the page to describe
 * something you can't see from it is worse than two short ones.
 *
 * Tone: this page suggests, it does not conclude. The wording says "worth a
 * look" and "likely" on purpose — the data can point at a cause, confirming it
 * is still a person's job, and promising more than that is how a diagnostic
 * tool loses the trust it runs on.
 */
export const ITEM_REPORT_INFO: {
  title: string;
  purpose: string;
  glossary: InfoGlossaryEntry[];
} = {
  title: "Item Actions",
  purpose:
    "Helps you get from a list of flagged items to the call worth making on each one. It suggests where to look; it doesn't decide the cause. Every row compares what sold against what was delivered, so a stocking problem and a demand problem stop looking alike.",
  glossary: [
    {
      term: "Action",
      desc: "A suggested next step, with the evidence behind it. Suggestions only: the data can point at a likely cause, confirming it is still a person's job. Checked in a fixed order, first match wins, so each row shows the one thing most worth acting on.",
      subEntries: [
        {
          label: "Reorder",
          desc: "Three shapes. **It ran out mid-window** — selling steadily every day, then nothing for the last few days of the week, with the units it would have sold in that gap. This one needs no invoice: it reads the shelf emptying rather than a delivery date, so it works on stores whose orders never reach the data. Guarded so a slow mover doesn’t qualify — two days of sales to set a rate, two days of silence, and at least a unit a day. Or **the last delivery has all sold** — sold against received, which catches an item going out faster than it arrives. Or **nothing has come in for over two weeks**. The last two need an invoice on file; where none exists they simply do not fire. No opening balance exists in the data, so stock held before a delivery is invisible.",
        },
        {
          label: "Call vendor",
          desc: "Cost that won’t hold still: three or more changes in the lookback, one delivery up 5% or more that stayed up, a 10% rise end to end, or a cost bouncing up and down. Each finding is dated. Drifting cost is ordinary — these are the shapes worth a call, often about *when* to order rather than the price itself.",
        },
        {
          label: "No receiver invoice on file",
          desc: "A count above the list, not an action. Orders received electronically never reach the scan this data is built from, so a store can trade normally and still show no invoices — and those items were all being filed under one heading instead of being judged. They are now graded on what sales can prove: price against cost, and trend. Only **Reorder** and **Call vendor** are withheld, because those genuinely need the delivery trail. Where no invoice exists, cost falls back to the average from the week's sales and the sentence says so.",
        },
        {
          label: "Reprice",
          desc: "Ringing below cost, in two shapes needing different fixes. **The regular price is under cost** — the tag is wrong, and ending a promotion won’t repair it. Or **a promotion is underwater** — on sale below what the item cost, with the days it has run, the units gone and the money given away. Promotions are read from the POS price type, which distinguishes REG from TPR and SALE; an unrecognised type claims neither. Money given away counts register discounts as well as the ring, because both come off the same units. The price the tag is judged against is taken from the best source available and always named: a regular ring, then the last invoice’s intended retail, then the price on file, and only failing all three the highest price seen. Also raised when cost rose and the shelf never followed, and when a price rise was met by a fall in demand — that last one only between two regular stretches, or every ending promotion would trigger it. Every price here is one the register actually charged: they arrive with the week's sales rather than being worked out from a day's takings divided by its units, which on a day carrying two prices produced an average nobody ever paid. A markdown that still clears cost isn’t raised — that’s a decision, not a mistake.",
        },
        {
          label: "Investigate",
          desc: "In stock, priced right, still not moving — nothing scanned since delivery, or down on both last week and last year with cost and price steady. Zero sales only counts after a week on the shelf or with a selling history; sooner than that reads as Insufficient.",
        },
        {
          label: "No action",
          desc: "Flagged upstream, but it holds up here. Includes items down against last year yet steady against last week — a recovery, not a problem.",
        },
        {
          label: "Insufficient",
          desc: "Not enough on file to suggest anything: no sales, receipts or baseline; too recent to judge; or no cost from either an invoice or the week’s sales, which leaves margin unjudgeable. Said plainly rather than guessed at. A missing invoice on its own is **not** insufficient — price and trend are judged from sales, and cost falls back to the week’s average with the evidence saying so.",
        },
      ],
    },
    {
      term: "Units, vs LW, vs LY",
      desc: "Units sold this week, compared separately against the same week last week and last year. Units rather than dollars, because sales being down could be fewer sold or a lower price, while units being down can only mean fewer left the shelf.",
    },
    {
      term: "Recv and Net",
      desc: "Over the last 14 days: units received, and what remains after what sold. Read it as a change, not a count — nothing in the data reports opening stock, so an item can show a positive Net and still have an empty shelf. It also can't see shrink, damage or transfers, so it reads high rather than low when stock goes missing.",
    },
    {
      term: "Last",
      desc: "Days since the item was last received. Deliveries are read back 90 days regardless of the week you picked, so “never received” means genuinely absent rather than outside your date range.",
    },
    {
      term: "Sales",
      desc: "Last column on purpose. Useful for deciding which of forty reorders to do first, but units are what the row is about.",
    },
    {
      term: "Where “critical” came from",
      desc: "This page grades nothing itself. Severity was set on the page you came from, by its metric and its threshold — Margin or Sales on Sub Dept Margins and Vendors, Sales or Qty on Sales. Change either and the list changes.",
    },
  ],
};
