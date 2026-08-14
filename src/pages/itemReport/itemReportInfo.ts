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
          desc: "The cost history on the receivers doesn’t hold still: three or more changes across the lookback, a single delivery up 5% or more, a 10% rise end to end, or a cost that moves up and down repeatedly. Cost drifting upward is ordinary; these are the shapes worth querying. The row names which one it was. Often the fix is timing rather than price — a store ordering on a fixed schedule will catch whatever promotion or rebate happens to be running, and only the store and vendor together can line those up. Nothing here can see that; they can.",
        },
        {
          label: "Check receiving",
          desc: "It is selling, but no receiver names it in 90 days — the rows whose Last column reads “none”. Three things do that and only one is the vendor’s: it was never ordered, it arrives direct-to-store, or it was received electronically and so never reached the scan this data is built from. The last is common and entirely normal, which is why this is its own action rather than a vendor call.",
        },
        {
          label: "Reprice",
          desc: "Shelf price and cost don’t line up **today**. Judged on the price it is currently ringing at, against the cost the last receiver carried — not a blended cost from the sales file. Covers selling below cost and a cost increase the shelf price never followed. Ringing under the retail a receiver intended is **not** raised on its own — a markdown that still clears cost is a decision, not a mistake, and nothing in this data carries a target margin to judge it against. The intended retail sits in the detail panel so you can see the gap yourself. An item that was underwater earlier in the window and has since been fixed is not raised here; that stretch stays visible in the estimated price points instead. Causes range from a sale left running too long to a price keyed in wrong.",
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
