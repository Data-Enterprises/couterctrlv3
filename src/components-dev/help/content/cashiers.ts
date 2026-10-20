import type { HelpContent } from "../helpTypes";

/** Help for Cashiers — the exception explorer. */
export const CASHIERS_HELP: HelpContent = {
  screen: "Cashiers",
  purpose:
    "Groups exceptions such as voids and refunds so you can tell whether a pattern comes from one person, or from an item or a lane.",

  guides: [
    {
      id: "search",
      title: "Find exceptions",
      desc: "Pick a scope and a range, then open what it found",
      steps: [
        {
          title: "Pick a store or group",
          pre: "Choose Store or Group and pick one. The button reads",
          chip: "Select Store",
          post: "or Select Group until you have.",
          anchor: "search",
        },
        {
          title: "Set the dates",
          pre: "Up to 14 days. Ask for more and the search card tells you to narrow it before it will run.",
          anchor: "search",
        },
        {
          title: "Search",
          pre: "Press",
          chip: "Find exceptions",
          post: ".",
          see: "A list of exceptions, with the figures across the top covering everything the search found.",
        },
        {
          title: "Open one",
          pre: "Choose an exception and press",
          chip: "Explore transactions",
          post: "to work through what is behind it.",
        },
      ],
      issues: [
        {
          q: "It says “No exceptions recorded”",
          a: "Nothing was found for that store or group in those dates. Try a different scope or range.",
        },
        {
          q: "The header says “capped”",
          a: "A very large search loads only part of the transactions, and the note says how many were left out. Pick a shorter range or a single store to see everything.",
        },
      ],
    },
    {
      id: "regroup",
      title: "Tell a person problem from an item problem",
      desc: "Regroup the same exceptions four ways",
      steps: [
        {
          title: "Switch the grouping",
          pre: "Use",
          chip: "Store",
          post: ", Cashier, Item or Terminal. The same exceptions are regrouped instantly — nothing is re-fetched.",
          anchor: "grouping",
        },
        {
          title: "Read the tag on each row",
          pre: "It counts how many cashiers are involved — or how many items, when you are grouped by cashier.",
          see: "One cashier suggests one person's habit. Many cashiers suggests an item or a lane.",
        },
        {
          title: "Open the receipts",
          pre: "Click a row to list its transactions, then a transaction to open the full receipt.",
          see: "“1 of 13” counts how many of that receipt's lines were exceptions. “last” means the exception was the final line of the sale.",
        },
      ],
    },
  ],

  fixes: [
    {
      id: "pattern",
      title: "I don't know whether this is a person or an item",
      questions: [
        {
          id: "spread",
          title: "Grouped by item, how many cashiers does the tag show?",
          options: [
            { label: "One cashier", result: "one-person" },
            { label: "Several cashiers", result: "many" },
            { label: "The item has no description", result: "unmapped" },
          ],
        },
      ],
      results: [
        {
          id: "one-person",
          tone: "warn",
          badge: "Worth a look",
          title: "One person, one item",
          why: "An exception that only ever happens for one cashier is a habit rather than a property of the item — which may be training, or may be nothing.",
          todo: [
            "Group by Cashier and see whether the same person shows other exceptions.",
            "Open a receipt and read the whole sale before drawing a conclusion.",
          ],
        },
        {
          id: "many",
          tone: "ok",
          badge: "Likely the item",
          title: "Many cashiers, same item",
          why: "When everyone hits the same exception on the same item, the item is usually the cause — a bad tag, a wrong price, or a label that will not scan.",
          todo: [
            "Check the item's price and tag at the shelf.",
            "Group by Terminal as well — if it is also one lane, the register is worth checking.",
          ],
        },
        {
          id: "unmapped",
          tone: "warn",
          badge: "Data gap",
          title: "“unmapped upc”",
          why: "The item has no description on file, so the exception cannot be named. It points at the item record rather than at anyone's conduct.",
          todo: ["Have the UPC added to the item file, then look again."],
        },
      ],
    },
  ],

  terms: [
    {
      term: "Lines and transactions",
      def: "One receipt can hold several exception lines — the same item voided repeatedly in one sale. Each row shows both counts, as lines · transactions.",
    },
    {
      term: "The figures across the top",
      def: "They cover everything the search found, not the row you have selected: exception lines, transactions, amount, and how many stores, cashiers and items are involved.",
      anchor: "kpis",
    },
    {
      term: "The tag on a row",
      def: "How many cashiers are involved, or how many items when you are grouped by cashier. It says where to look. It does not accuse anyone.",
    },
    {
      term: "Terminal",
      def: "Groups by lane, which is what shows a register problem rather than a person or an item.",
      anchor: "grouping",
    },
    {
      term: "capped",
      def: "A search too large to load in full. The note says how many transactions were left out; a shorter range or a single store returns everything.",
    },
  ],
};
