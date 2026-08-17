import type { InfoGlossaryEntry } from "../../components/InfoPopover";

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
          desc: "Either the last delivery has all sold — sold against received, which catches an item going out faster than it arrives — or nothing has come in for over two weeks. No opening balance exists in the data, so stock held before that delivery is invisible.",
        },
        {
          label: "Call vendor",
          desc: "Cost that won’t hold still: three or more changes in the lookback, one delivery up 5% or more that stayed up, a 10% rise end to end, or a cost bouncing up and down. Each finding is dated. Drifting cost is ordinary — these are the shapes worth a call, often about *when* to order rather than the price itself.",
        },
        {
          label: "Check receiving",
          desc: "Selling, but no receiver names it in 90 days — the rows whose Last reads “none”. Either it was never ordered, it arrives direct-to-store, or it came in electronically and never reached the scan this data is built from. The last is common and normal, which is why it isn’t a vendor call.",
        },
        {
          label: "Reprice",
          desc: "Two shapes, needing different fixes. **The regular price is under cost** — the tag is wrong, and ending a promotion won’t repair it. Or **a promotion is underwater** — on sale below what you last paid, with the days it has run, units gone and money given away. Also a cost rise the regular price never followed. A markdown that still clears cost isn’t raised: that’s a decision, not a mistake.",
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
          desc: "Not enough on file to suggest anything: the store keeps no receiving data at all, the item has no sales, receipts or baseline, or it arrived too recently to judge. Said plainly rather than guessed — a blank would read as nothing being wrong.",
        },
      ],
    },
    {
      term: "Uploaded / All found",
      desc: "Uploaded is the list you brought in, and what you see by default. All found adds items the delivery read turned up that also sold last week or last year — worth a look if you want to see what else came in on the same invoices. It is not a full department list: only items received in the last 90 days can appear.",
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
