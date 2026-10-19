import type { HelpContent } from "../helpTypes";

/**
 * Help for the sub department investigation.
 *
 * It is its own screen rather than a section of Sales help: you arrive from a
 * comparison report already holding a symptom, and everything here is about
 * turning that symptom into something somebody can act on. The Sales panel
 * describes the page you came from.
 */
export const SALES_INVESTIGATE_HELP: HelpContent = {
  screen: "Sub department investigation",
  purpose:
    "One department at two stores, item by item, with the orders and receipts behind it — so a gap in the sales can be handed to the person who can close it.",

  guides: [
    {
      id: "four-tabs",
      title: "Work a department",
      desc: "Four tabs, in the order the question gets answered",
      steps: [
        {
          title: "Start on Summary",
          pre: "It says whether the department-level shape holds up once the items are read. A department can be down overall and have no item behind it worth chasing, and that is a finding.",
          see: "The tab itself carries the verdict — Holds or Doesn't hold — so you can read it without opening it.",
          anchor: "tabs",
        },
        {
          title: "Items names the causes",
          pre: "Every item in the department, both stores, biggest difference first. The chips above the grid are the causes, each with how many items and what they are worth.",
          see: "Clicking a chip narrows the grid to that cause. Clicking a row opens its evidence on the right — what it sold for at each store, what it cost, and every order and receipt that touched it.",
          anchor: "causes",
        },
        {
          title: "Supply shows the documents",
          pre: "What each store ordered and what it received, over a longer window than the sales week. Orders first, then receipts, with the lines on each.",
          anchor: "tabs",
        },
        {
          title: "Hand-off is the list you send",
          pre: "The causes grouped by who owns the fix. A buyer's list, a vendor's list and the ones nothing in this data can name.",
          see: "Lists nobody owns are still shown rather than dropped — a shortfall that quietly vanishes is one somebody finds again next week.",
          anchor: "tabs",
        },
      ],
      issues: [
        {
          q: "Two tabs are greyed out",
          a: "Summary needs sales alone and draws straight away. Items, Supply and Hand-off wait on the orders and receipts, which are separate reads. A tab that is not ready says what it is waiting for rather than showing a figure that will move.",
        },
        {
          q: "The totals do not match the Sub depts tab",
          a: "That tab is the department's whole week. This is the items in it, read against the other store, and the comparison periods are matched day for day.",
        },
      ],
    },
  ],

  fixes: [],

  terms: [
    {
      term: "Ordered and Received",
      def: "The two halves of supply, and the two kinds of document behind them. A store orders — those are orders — and it receives — those are receipts. Both are read over a longer window than the sales week, because a delivery three weeks ago is what explains an empty shelf today.",
      anchor: "supply-window",
    },
    {
      term: "The 42-day window",
      def: "How far back the orders and receipts are read. It does not line up with the sales week on purpose: supply explains this week, not last week or last year, so the LW and LY columns are never answered by a cause.",
      anchor: "supply-window",
    },
    {
      term: "Never ordered",
      def: "No order for it here in the window, nothing received, nothing sold — and the other store sold it. A buyer's item. It only appears when there is order history to say so.",
      anchor: "causes",
    },
    {
      term: "Not carried here",
      def: "The same shape as Never ordered, without the claim. Shown when no orders came back for either store over the whole window — a department delivered straight off the vendor's truck has none, so every item would otherwise read as a missed order. The other store sells it and nothing here says we ever had it.",
      anchor: "causes",
    },
    {
      term: "Didn't arrive",
      def: "Ordered here and never received, with sales behind the other store. A vendor's item. It cannot appear at all where there are no orders, since there is nothing to have gone unfilled.",
      anchor: "causes",
    },
    {
      term: "Costing more",
      def: "Both stores sold it and this one buys it for more. Settled before the sales gap is looked at, because an item can sell more here and still make less — reading the sales gap first calls that a win.",
      anchor: "causes",
    },
    {
      term: "Not moving",
      def: "It was here, it was priced like theirs, and it still sold less. Merchandising, or simply different customers — nothing in this data says which, and the label does not pretend otherwise.",
      anchor: "causes",
    },
    {
      term: "Price / mix",
      def: "It sold here and took less per unit than at the other store. The units did not go missing; the money per unit did.",
      anchor: "causes",
    },
    {
      term: "Streamlined",
      def: "The department's quiet majority: items the two stores are level on, within $5 either way, plus the tail nothing here separates. Nothing to chase.",
      anchor: "causes",
    },
    {
      term: "We're ahead",
      def: "This store sold more of it, by more than the $5 floor. An exact tie is not ahead — it is the same week rung twice, and it sits in Streamlined.",
      anchor: "causes",
    },
    {
      term: "Dept lines",
      def: "How many lines on that order or receipt belong to this department, not how many are on the whole document. An invoice carrying one of our items and ninety of somebody else's shows 1.",
    },
    {
      term: "Export",
      def: "Every row the grid is currently showing, as a CSV — the filter and the sort travel with it, so what you export is what you were looking at.",
      anchor: "export",
    },
  ],

  contact:
    "If a cause looks wrong on an item, the evidence rail on the right shows everything the verdict was built from — start there.",
};
