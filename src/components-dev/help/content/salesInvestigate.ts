import type { HelpContent } from "../helpTypes";

/**
 * Help for the sub department investigation.
 *
 * It is its own screen rather than a section of Sales help: you arrive from a
 * comparison report already holding a symptom, and everything here is about
 * turning that symptom into something somebody can act on. The Sales panel
 * describes the page you came from.
 *
 * Written the way the Sales guides are: one guide per thing somebody came
 * here to do, each step naming the control it is about so the panel can point
 * at it, and each step saying what the screen does once it is done. A guide
 * that walks the four tabs in order is a tour; these are tasks.
 */
export const SALES_INVESTIGATE_HELP: HelpContent = {
  screen: "Sub department investigation",
  purpose:
    "One department at two stores, item by item, with the orders and receipts behind it — so a gap in the sales can be handed to the person who can close it.",

  guides: [
    {
      id: "is-it-real",
      title: "Find out whether the gap is real",
      desc: "Start on Summary — a department can be down with nothing behind it",
      steps: [
        {
          title: "Read the verdict on the tab",
          pre: "You land on",
          chip: "Summary",
          post: ". The tab carries its own answer — Holds or Doesn't hold — so you can read it without opening anything.",
          see: "Holds means the department's shortfall is still there once the items are read. Doesn't hold means it is not, and that is a finding: there is nothing here to chase.",
          anchor: "tabs",
        },
        {
          title: "Check the week it covers",
          pre: "The header carries the department and the sales week beside it.",
          see: "Every sales figure on this screen is that week at both stores, matched day for day.",
          anchor: "supply-window",
        },
        {
          title: "Follow the summary into the items",
          pre: "The cards on Summary are clickable. Picking a vendor, an item or Show all moves you to the Items tab already filtered to it.",
          see: "The Items tab opens with the filter applied, rather than on the whole department.",
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

    {
      id: "find-the-items",
      title: "Find the items behind it",
      desc: "Narrow by cause, then read one item's evidence",
      steps: [
        {
          title: "Pick a cause",
          pre: "The chips above the grid are the causes, each with how many items it holds and what they are worth.",
          chip: "Never ordered",
          post: "and the rest narrow the grid to themselves. Click the lit one again to clear it.",
          see: "The chip lights and the grid below shows only that cause.",
          anchor: "causes",
        },
        {
          title: "Read the grid",
          pre: "Every item in the department, both stores, biggest difference first. Search by UPC or description, or filter the vendor and cause columns.",
          see: "This store's week, the other store's week, and the difference between them — with the margin gap beside it once the costs are in.",
          anchor: "grid",
        },
        {
          title: "Open one item's evidence",
          pre: "Click a row. The rail opens on the right with everything the cause was built from.",
          see: "What it sold for at each store, what each store paid for it, and every order and receipt that touched it in the window.",
          anchor: "evidence",
        },
        {
          title: "Take the list with you",
          pre: "Press",
          chip: "Export CSV",
          post: "to take what the grid is showing.",
          see: "The filter and the sort travel with it — what you export is what you were looking at, not the whole department.",
          anchor: "export",
        },
      ],
      issues: [
        {
          q: "A cause looks wrong on an item",
          a: "Open its evidence. The rail shows the orders, the receipts and both stores' prices — the three things every cause is decided from. If the documents disagree with the label, that is worth reporting.",
        },
        {
          q: "The grid is empty",
          a: "A chip is still lit, or a search is still in the box. Click the lit chip again, or clear the search, to get the whole department back.",
        },
      ],
    },

    {
      id: "supply",
      title: "Check what was ordered and what arrived",
      desc: "The documents behind the shortfall, over a longer window",
      steps: [
        {
          title: "Open Supply",
          pre: "Choose the",
          chip: "Supply",
          post: "tab. Ordered comes first, then Received, each with the lines on every document.",
          see: "One line per order or receipt, with how many of its lines belong to this department.",
          anchor: "tabs",
        },
        {
          title: "Mind the window",
          pre: "Orders and receipts are read over 42 days, not over the sales week — a delivery three weeks ago is what explains an empty shelf today.",
          see: "The header carries the sales week. The supply window is wider on purpose, which is why it can never explain the LW or LY columns.",
          anchor: "supply-window",
        },
        {
          title: "Trace specific items",
          pre: "Paste UPCs into the box above the lists to see only the documents carrying them.",
          see: "Both lists narrow to the orders and receipts that touched those codes.",
        },
      ],
      issues: [
        {
          q: "It says neither store ordered anything",
          a: "That is a real answer, not a gap: some departments are delivered straight off the vendor's truck and never carry an order. When it happens, Never ordered is withheld and those items read as Not carried here instead — the shape without the claim.",
        },
      ],
    },

    {
      id: "hand-off",
      title: "Hand it to the person who can fix it",
      desc: "The causes grouped by who owns them",
      steps: [
        {
          title: "Open Hand-off",
          pre: "Choose the",
          chip: "Hand-off",
          post: "tab. The causes are grouped into the buyer's list, the vendor's list, and the ones nothing in this data can name.",
          see: "Each list carries its item count and what it is worth, with a line you can send as it stands.",
          anchor: "tabs",
        },
        {
          title: "Check a list before you send it",
          pre: "Show in grid takes you back to Items with that cause already filtered, so you can read the evidence behind any line on it.",
          anchor: "causes",
        },
        {
          title: "Send it",
          pre: "Each list exports on its own, so the buyer gets the buyer's items and nobody else's.",
          anchor: "export",
        },
      ],
      issues: [
        {
          q: "A list has no owner",
          a: "It is still shown rather than dropped. A shortfall that quietly vanishes is one somebody finds again next week.",
        },
      ],
    },
  ],

  fixes: [
    {
      id: "cause-looks-wrong",
      title: "An item's cause does not look right",
      questions: [
        {
          id: "which",
          title: "Which cause is it wearing?",
          options: [
            { label: "We're ahead, but the two look level", result: "floor" },
            { label: "Streamlined, and I expected a cause", result: "streamlined" },
            { label: "Not carried here, but we do carry it", result: "no-orders" },
            { label: "Never ordered, but it was ordered", result: "window" },
          ],
        },
      ],
      results: [
        {
          id: "floor",
          tone: "ok",
          badge: "Working as intended",
          title: "Ahead means ahead by more than $5",
          why: "An exact tie is the same week rung twice, not a win. Anything inside $5 either way is level and sits in Streamlined, so We're ahead is only items this store genuinely sold more of.",
          todo: [
            "Open the item's evidence and compare the two Sold for figures.",
            "If the difference is under $5, it is level and the label is right.",
          ],
        },
        {
          id: "streamlined",
          tone: "ok",
          badge: "Working as intended",
          title: "Streamlined is the quiet majority",
          why: "It holds the items the two stores are level on, plus the tail nothing in this data separates. It is not a list of mysteries somebody owes an answer for — it is everything with nothing to chase.",
          todo: [
            "Open the item's evidence. If both stores sold it at a similar price for similar money, there is no cause to find.",
            "If the evidence shows a real difference, report it — that is a cause that should have been named.",
          ],
        },
        {
          id: "no-orders",
          tone: "ok",
          badge: "Working as intended",
          title: "No orders came back for either store",
          why: "Not carried here is Never ordered without the claim. When the whole window holds no orders for either store — a department delivered off the truck, say — every item would otherwise read as a missed order, so the claim is withheld.",
          todo: [
            "Open Supply and check whether either store has any order at all in the window.",
            "If both are empty, the label is doing its job.",
          ],
        },
        {
          id: "window",
          tone: "warn",
          badge: "Check the window",
          title: "The order may be outside the 42 days",
          why: "Orders are read over 42 days back from the end of the sales week. A slow category ordered monthly or less can have its last order fall outside that, and the item then reads as never ordered.",
          todo: [
            "Open Supply and look for the item in the Ordered list.",
            "If it is not there, the order is older than the window — worth saying so rather than treating it as a buyer's miss.",
          ],
        },
      ],
    },
  ],

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
      term: "The evidence rail",
      def: "What one item's cause was built from: both stores' prices, both stores' costs, and every order and receipt that touched it. If a label looks wrong, this is where to check it.",
      anchor: "evidence",
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
