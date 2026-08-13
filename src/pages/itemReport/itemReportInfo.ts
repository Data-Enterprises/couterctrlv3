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
          desc: "The last delivery was over two weeks ago and the item is still selling, or nothing has arrived in 90 days and it has stopped selling. Either way the shelf is likely empty or close to it.",
        },
        {
          label: "Call vendor",
          desc: "Selling, but nothing received in 90 days: it may never have been ordered, or it arrives direct-to-store and never gets entered. Also raised when the item has come in at three or more different costs, since margin can't be trusted until the invoice price is confirmed.",
        },
        {
          label: "Reprice",
          desc: "Shelf price and cost don't line up. Covers selling below cost, ringing under what the last invoice intended, a cost increase the price never followed, and a price rise that demand visibly reacted to. Causes range from a sale left running too long to a price keyed in wrong.",
        },
        {
          label: "Investigate",
          desc: "In stock, priced correctly, and still not moving. Either nothing has scanned since delivery, or it's down against both last week and last year with cost and price steady. Nothing in the data explains it, so the cause is elsewhere.",
        },
        {
          label: "No action",
          desc: "Flagged upstream, but it holds up here. Includes items down against last year yet steady against last week — a recovery, not a problem.",
        },
        {
          label: "Insufficient",
          desc: "There isn't enough on file to suggest anything — usually no cost recorded against the item, so margin can't be judged. Said plainly rather than guessed: a blank would read as nothing being wrong.",
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
