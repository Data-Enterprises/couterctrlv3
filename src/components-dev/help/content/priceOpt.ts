import type { HelpContent, HelpGuide, HelpFix, HelpTerm } from "../helpTypes";

/**
 * Help for the two Price Opt screens.
 *
 * One file, because the pages are siblings: identical from the item rightward
 * — same analysis panel, same register read, same suggestion — and different
 * only in how you reach the item. Writing them twice would mean two copies of
 * the part that matters drifting apart over the part that does not.
 *
 * So the shared guides, fixes and terms are built once and each screen adds
 * its own opening guide and its own wording for the tree.
 */

const openItem = (grouping: string, chip: string): HelpGuide => ({
  id: "start",
  title: "Find an item to price",
  desc: `Open a ${grouping} and pick the item out of it`,
  steps: [
    {
      title: "Pick the store and the dates",
      pre: "One store at a time — price points are a question about one shelf, and two stores' rings averaged together answer nobody.",
      anchor: "scope",
    },
    {
      title: `Open a ${grouping}`,
      pre: "The tree on the left lists",
      chip,
      post: ". Open one and the items inside it appear underneath.",
      anchor: "tree",
    },
    {
      title: "Pick the item",
      pre: "Click it. The panel on the right fills with that item's prices.",
      anchor: "tree",
      see: "Two tables side by side — estimated on the left, actual on the right — and a suggestion above them.",
    },
  ],
  issues: [
    {
      q: "The right-hand table is still loading",
      a: "The actual prices come from register lines and arrive a few seconds after the rest. The panel keeps its full height while they land rather than growing underneath you.",
    },
    {
      q: "The item is not in the tree",
      a: "The tree only carries items with sales in the period. Widen the dates before assuming the item is missing.",
    },
  ],
});

const SHARED_GUIDES: HelpGuide[] = [
  {
    id: "read",
    title: "Read the two tables",
    desc: "Only one of them gets a vote",
    steps: [
      {
        title: "Start on the right",
        pre: "The actual table is what the registers really rang: a price, how many transactions carried it, and over how many days.",
        anchor: "actual",
      },
      {
        title: "Use the left as context, not as evidence",
        pre: "The estimated table divides a day's dollars by a day's units. It is a fair observation and a bad recommendation — nineteen rings at $13.99 and one at $12.99 produce a $13.88 nobody was ever charged.",
        anchor: "estimated",
      },
      {
        title: "Read the gap between them",
        pre: "The two tables share their first columns so your eye can run across. A price on the left with no counterpart on the right was never charged — except on an item sold by weight in random-weight packs, where the left is per pound and the right is per pack, and the two never line up.",
        see: "That gap is usually the finding.",
      },
    ],
  },
  {
    id: "suggestion",
    title: "Use the suggestion",
    desc: "Where the item moves fastest",
    steps: [
      {
        title: "Read what it says",
        pre: "The strip above the tables names the price the item sold quickest at, its price type, and how many a day that was over how long.",
        anchor: "suggestion",
      },
      {
        title: "Check what is behind it",
        pre: "It reads the actual side only. Find that price in the right-hand table and look at how many transactions and how many days sit behind it.",
        anchor: "actual",
      },
      {
        title: "Decide",
        pre: "A fast price over two days and four transactions is a coincidence. The same price over three weeks is a finding.",
      },
    ],
    issues: [
      {
        q: "There is no suggestion",
        a: "One of three things. The item sold at one price all period, so there is nothing to compare. Or no two prices have enough behind them: a price needs at least 3 days and 5 receipts to be a candidate, so a one-day spike can't win. Or it sells by weight in random-weight packs, where the receipts record pack totals and not weights — the panel says so in place of the suggestion.",
      },
      {
        q: "The suggestion is lower than I would like",
        a: "It answers how fast the item moves, not what it earns. Read it beside the margin before acting — fastest and best are not the same question.",
      },
    ],
  },
  {
    id: "transactions",
    title: "Check the individual sales",
    desc: "When a price point looks wrong",
    steps: [
      {
        title: "Open them",
        pre: "Press",
        chip: "Show transactions",
        post: "on a price row.",
        anchor: "actual",
        see: "Every sale at that price — date, cashier, terminal, quantity and amount.",
      },
      {
        title: "Look for the explanation",
        pre: "One cashier, one terminal or one day behind an odd price is usually a key error rather than a pricing decision.",
      },
    ],
  },
];

const SHARED_FIXES: HelpFix[] = [
  {
    id: "mismatch",
    title: "The two tables do not agree",
    questions: [
      {
        id: "q-shape",
        title: "What does the disagreement look like?",
        options: [
          { label: "A price on the left is missing on the right", result: "r-phantom" },
          { label: "The right has prices the left does not", result: "r-promo" },
          { label: "Both have the price, the counts differ", result: "r-counts" },
        ],
      },
    ],
    results: [
      {
        id: "r-phantom",
        badge: "Expected",
        tone: "ok",
        title: "That price was never charged",
        why: "The estimated side is an average of a day's takings over a day's units, so it invents prices that sit between the real ones. A left-hand price with no counterpart on the right is usually exactly that. The exception is an item sold by weight in random-weight packs: the left is per pound, the right is per pack, and none of them will match.",
        todo: [
          "Ignore it and work from the right-hand table.",
          "If it is the only price on the left, the item sold at several prices that day.",
        ],
      },
      {
        id: "r-promo",
        badge: "Expected",
        tone: "ok",
        title: "The day's average hid them",
        why: "Several real prices in one day roll up into a single estimated figure, so the actual side always carries more detail than the estimated one.",
        todo: ["Work from the right-hand table — it is the one with the evidence."],
      },
      {
        id: "r-counts",
        badge: "Look closer",
        tone: "warn",
        title: "Check the period, then the transactions",
        why: "The two sides are built from different sources over the same dates. Counts that differ usually mean a day at the edge of the range landed in one and not the other.",
        todo: [
          "Narrow the dates by a day at each end and see whether it settles.",
          "Open the transactions on the price and check for one odd day.",
        ],
      },
    ],
  },
];

const SHARED_TERMS: HelpTerm[] = [
  {
    term: "Estimated price",
    def: "A day's dollars divided by a day's units. Useful as an observation, disqualified as a recommendation — it produces prices nobody was ever charged.",
    anchor: "estimated",
  },
  {
    term: "Actual price",
    def: "What the registers rang, read from the lines themselves. The only side the suggestion reads.",
    anchor: "actual",
  },
  {
    term: "Moves fastest at",
    def: "The price with the highest sales per day behind it, on the actual side, among prices that rang on at least 3 days and 5 receipts. It answers speed, not profit.",
    anchor: "suggestion",
  },
  {
    term: "Trans",
    def: "How many separate receipts carried that price. A receipt that rang the item three times counts once. Two is a coincidence; two hundred is a pattern.",
    anchor: "actual",
  },
  {
    term: "Cost / unit",
    def: "What the store paid for one unit, from the latest invoice in the last 90 days. The line under it says which: \"invoice\" and its date, or \"item file\" when there is no invoice to read, or the item is sold by weight. Every margin on the item is held against this one figure.",
  },
  {
    term: "Days",
    def: "How many days that price was seen on. A price that only ever rang on one day is not a price the shelf held.",
    anchor: "actual",
  },
  {
    term: "Type",
    def: "How the price was set — regular, a temporary reduction, an ad, and so on. A fast price that is always promotional is not a shelf price you can move to.",
    anchor: "actual",
  },
];

export const PRICE_OPT_SUB_DEPT_HELP: HelpContent = {
  screen: "Price Opt — Sub Department",
  purpose:
    "What an item actually sold at against what it was estimated to sell at, reached by opening a sub department.",
  guides: [openItem("sub department", "sub departments"), ...SHARED_GUIDES],
  fixes: SHARED_FIXES,
  terms: SHARED_TERMS,
};

export const PRICE_OPT_VENDOR_HELP: HelpContent = {
  screen: "Price Opt — Vendor",
  purpose:
    "What an item actually sold at against what it was estimated to sell at, reached by opening a vendor.",
  guides: [openItem("vendor", "vendors"), ...SHARED_GUIDES],
  fixes: SHARED_FIXES,
  terms: SHARED_TERMS,
};
