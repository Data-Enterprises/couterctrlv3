import type { HelpContent } from "../helpTypes";

/** Help for Item Actions — a list of items, each with a suggested next step
 *  and the deliveries, prices and sales behind it. */
export const ITEM_ACTIONS_HELP: HelpContent = {
  screen: "Item Actions",
  purpose:
    "Upload a UPC list and get a suggested next step for each item, with the deliveries, prices and sales that led to it.",

  guides: [
    {
      id: "start",
      title: "Build a list of actions",
      desc: "A store, a date, and the UPCs you want answered",
      steps: [
        {
          title: "Pick the store and the date",
          pre: "One store at a time. The date is the end of the window — sales are read for the days up to it, and measured against the same week last week and last year.",
        },
        {
          title: "Add the items",
          pre: "Paste UPCs separated by commas or new lines and press Add, or use",
          chip: "Upload CSV",
          post: ". The list usually comes from an export off Sub Dept Margins or Vendors.",
          anchor: "upc-input",
        },
        {
          title: "Build",
          pre: "Press",
          chip: "Build actions",
          post: ". The button stays off until there is a list — the report answers for the codes it is given and nothing else.",
          see: "A row per item, each carrying one action.",
        },
      ],
      issues: [
        {
          q: "The button says “Add a UPC list”",
          a: "No codes have been added yet. Pasting into the box is not enough on its own — press Add, or upload a file.",
        },
        {
          q: "Some of my UPCs are missing from the result",
          a: "Codes with no sales and no deliveries in the window have nothing to report on. Check the code is right for this store before assuming the item is dead.",
        },
      ],
    },
    {
      id: "work",
      title: "Work one kind of problem at a time",
      desc: "The piles across the top narrow the list",
      steps: [
        {
          title: "Pick a pile",
          pre: "Click an action — Reorder, Reprice, Call vendor, Investigate — and the list narrows to it. Click it again to go back to everything.",
          anchor: "piles",
          see: "The list narrows, but nothing is recalculated — the report was already complete.",
        },
        {
          title: "Narrow further if you need to",
          pre: "The column filters take a UPC, a description, a department, a sub department or a vendor.",
        },
        {
          title: "Open an item",
          pre: "Click a row. The panel on the right opens with the action first and the figures behind it underneath.",
          anchor: "verdict",
        },
      ],
    },
    {
      id: "evidence",
      title: "Check the reasoning behind an action",
      desc: "Every verdict shows its working",
      steps: [
        {
          title: "Read the action strip",
          pre: "The label alone answers “what do I do”. Click it and the sentence underneath is the working behind it.",
          anchor: "verdict",
        },
        {
          title: "Check the deliveries",
          pre: "Underneath sits what actually arrived — when, how much, and at what cost — so a verdict about movement can be checked against whether the item was ever on the shelf.",
        },
        {
          title: "Check the prices",
          pre: "The price points show what the registers actually rang against what the item is set up to cost, which is where a Reprice comes from.",
        },
      ],
      issues: [
        {
          q: "The action disagrees with what I can see on the shelf",
          a: "Read the sentence behind the label. If it quotes “Highest price seen” rather than a regular price, no shelf price was on file and the highest ring was used instead — worth checking the tag.",
        },
      ],
    },
    {
      id: "export",
      title: "Export the list",
      desc: "What is on screen, with the columns you choose",
      steps: [
        {
          title: "Narrow first",
          pre: "The export follows the list as filtered, so pick the pile and the filters you want before opening it.",
          anchor: "piles",
        },
        {
          title: "Export",
          pre: "Press the download arrow in the header.",
          chip: "Export CSV",
          anchor: "export",
        },
      ],
    },
  ],

  fixes: [
    {
      id: "why-this-action",
      title: "I do not agree with the action on an item",
      questions: [
        {
          id: "q-which",
          title: "Which action is it showing?",
          options: [
            { label: "Insufficient", result: "r-insufficient" },
            { label: "Reorder", next: "q-reorder" },
            { label: "Reprice", next: "q-reprice" },
            { label: "Investigate", result: "r-investigate" },
          ],
        },
        {
          id: "q-reorder",
          title: "Has the item been delivered recently?",
          options: [
            { label: "Yes, there is stock", result: "r-reorder-stock" },
            { label: "No deliveries showing", result: "r-reorder-right" },
          ],
        },
        {
          id: "q-reprice",
          title: "Does the shelf tag match the price shown?",
          options: [
            { label: "Yes, they match", result: "r-reprice-right" },
            { label: "No, the tag reads higher", result: "r-reprice-tag" },
          ],
        },
      ],
      results: [
        {
          id: "r-insufficient",
          badge: "Not enough yet",
          tone: "ok",
          title: "The item has not had a chance to sell",
          why: "Zero sales is only evidence once an item has been on the shelf long enough to show something. A delivery two days ago with nothing scanned yet is not a dead item, and ranking it as one is the false warning this page exists to avoid.",
          todo: [
            "Leave it and run the list again in a week.",
            "If it has genuinely been out for a while, check the delivery dates — a missing receiver is the usual reason.",
          ],
        },
        {
          id: "r-reorder-stock",
          badge: "Check the count",
          tone: "warn",
          title: "It is selling, and the deliveries say it should be running out",
          why: "Reorder is offered, not asserted. It comes from an item that sells steadily with less arriving than leaving — which is also what a miscount looks like.",
          todo: [
            "Check what is physically on the shelf and in the back.",
            "If the stock is there, the receiving is what needs looking at rather than the order.",
          ],
        },
        {
          id: "r-reorder-right",
          badge: "Act on it",
          tone: "bad",
          title: "It sells and nothing is coming in",
          why: "Sales continuing with no deliveries behind them is the clearest version of this. The shelf will empty.",
          todo: ["Order it.", "Check whether the vendor has it on allocation."],
        },
        {
          id: "r-reprice-right",
          badge: "Act on it",
          tone: "bad",
          title: "The price on file really is wrong",
          why: "The shelf price sits under what the item costs, so every sale loses money. That is permanent until somebody changes it, which is why it outranks the other pricing checks.",
          todo: [
            "Fix the retail.",
            "Check whether the same cost change hit other items from that vendor.",
          ],
        },
        {
          id: "r-reprice-tag",
          badge: "Look closer",
          tone: "warn",
          title: "The gap is probably a sale or a coupon",
          why: "If no regular price was on file, the highest ring seen was used instead. A tag reading higher than that means the low rings came from a promotion rather than from the shelf.",
          todo: [
            "Check whether the item is on a TPR or carrying a coupon.",
            "If it is, no reprice is needed — the item comes off the list when the promotion ends.",
          ],
        },
        {
          id: "r-investigate",
          badge: "Needs a person",
          tone: "warn",
          title: "Something does not add up, and it is not one of the usual shapes",
          why: "Investigate is what is left when the item is not simply out of stock or mispriced. Usually it is money standing still — stock that arrived and has not moved.",
          todo: [
            "Read the sentence behind the label for what the figures actually say.",
            "Check the deliveries and the price points together — one of them normally explains it.",
          ],
        },
      ],
    },
  ],

  terms: [
    {
      term: "Reorder",
      def: "It sells, and less is arriving than leaving. Offered rather than asserted — a miscount looks the same from here.",
      anchor: "piles",
    },
    {
      term: "Reprice",
      def: "The price is wrong in one of two ways: the shelf tag sits under cost, or what the registers rang does not match what the item is set up to be.",
      anchor: "piles",
    },
    {
      term: "Call vendor",
      def: "The cost on file cannot be relied on, which makes every margin computed from it suspect. That outranks the pricing verdicts, because fixing a price against a wrong cost fixes nothing.",
      anchor: "piles",
    },
    {
      term: "Investigate",
      def: "Money standing still — usually stock that arrived and has not moved — in a shape the other verdicts do not cover.",
      anchor: "piles",
    },
    {
      term: "Insufficient",
      def: "Not enough has happened yet to judge. An item delivered two days ago with nothing scanned is not a dead item.",
      anchor: "piles",
    },
    {
      term: "No action",
      def: "Checked and nothing is wrong. It stays on the list so you can see it was considered rather than missed.",
      anchor: "piles",
    },
    {
      term: "vs LW / vs LY",
      def: "The same window last week and last year. Both are shown because neither is enough alone — last year catches a seasonal collapse last week would call normal, and last week catches a recovery last year would still condemn.",
    },
    {
      term: "Left over",
      def: "Received less sold over the recent window. What should still be there.",
    },
    {
      term: "Highest price seen",
      def: "Used when no regular shelf price is on file: the highest ring the registers recorded. Worth checking against the tag, because a promotion can make it read low.",
    },
  ],

  contact:
    "Still stuck? Raise a ticket from the Client Help Desk with the store and a UPC from the list.",
};
