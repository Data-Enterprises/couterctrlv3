// Interfaces
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
    "One department at two stores, item by item, with the orders and receivers behind it — so a gap in the sales can be handed to the person who can close it.",

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
          post: ". The tab carries its own answer, Holds or Doesn't hold, so you can read it without opening anything.",
          see: "The comparison report called the gap price, volume or supply from the department's totals. Holds means the items agree with it. Doesn't hold means the items put the gap somewhere else, for example the report called it price but most of it is items this store never rang. The card's sentence says which, with the biggest row's figure under it.",
          anchor: "tabs",
        },
        {
          title: "Check the week it covers",
          pre: "The header carries the department and the sales week beside it.",
          see: "Every sales figure on this screen is that week at both stores, matched day for day.",
          anchor: "supply-window",
        },
        {
          title: "Pick a row to see its items",
          pre: "The four rows under the figure sort every item by which store rang it: rang at the other store only, rang at both with this store selling less, rang at both with this store selling more, and rang at this store only. Click one.",
          see: "The card beside it slides to that row's items, with what the row is made of above them. Every item is listed, biggest first, in sections by their share of the gap: the items making up the first half, those taking it to 80%, then the rest. Only the first starts open. Click a section's line to fold or open it. The card's own tabs pick the row back.",
          anchor: "tabs",
        },
        {
          title: "Read the charts under it",
          pre: "The card under the rows has three slides. Week by week says whether the gap is a standing difference or something that broke this week. Against the other store puts sales, units and margin on one rule, the other store at 100. Who supplies it lists every vendor in the shortfall.",
          see: "Each slide answers in a line before its bars. Picking a vendor opens Items narrowed to that vendor.",
          anchor: "tabs",
        },
        {
          title: "Follow an item into Items or Supply",
          pre: "Click an item on the card to open its evidence in Items. Right-click it to copy its UPC, copy every UPC on that slide, or view it in Supply. See every item opens the whole grid.",
          see: "Items opens on that item's evidence; View in Supply opens the Supply tab with its orders and receivers narrowed to that UPC.",
          anchor: "tabs",
        },
      ],
      issues: [
        {
          q: "Two tabs are greyed out",
          a: "Summary and Items need sales alone and draw straight away; the causes in Items sharpen as the orders and receivers land. Supply and Hand-off wait on those two reads. A tab that is not ready says what it is waiting for rather than showing a figure that will move.",
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
          see: "What it sold for at each store, what each store paid for it, and every order and receiver that touched it in the window.",
          anchor: "evidence",
        },
        {
          title: "Take the list with you",
          pre: "Press the download button in the header,",
          chip: "Export CSV",
          post: ", to take what the grid is showing.",
          see: "The filter and the sort travel with it — what you export is what you were looking at, not the whole department.",
          anchor: "export",
        },
      ],
      issues: [
        {
          q: "A cause looks wrong on an item",
          a: "Open its evidence. The rail shows the orders, the receivers and both stores' prices — the three things every cause is decided from. If the documents disagree with the label, that is worth reporting.",
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
          post: "tab. Four rows sit under the figure: ordered at this store, ordered at the other, received at this store, received at the other. Click one.",
          see: "The card beside it slides to that store's orders or receivers, newest first. Click a document to open its lines. The card's own tabs pick the row back.",
          anchor: "tabs",
        },
        {
          title: "Mind the window",
          pre: "Orders and receivers are read over 42 days, not over the sales week — a delivery three weeks ago is what explains an empty shelf today.",
          see: "The header carries the sales week. The supply window is wider on purpose, which is why it can never explain the LW or LY columns.",
          anchor: "supply-window",
        },
        {
          title: "Trace specific items",
          pre: "Paste UPCs into the box at the top of the documents card to see only the documents carrying them. View in Supply, on a Summary item's right-click menu, fills it in.",
          see: "Every list on the card narrows to the orders and receivers that touched those codes. A return is taken back off what arrived.",
        },
      ],
      issues: [
        {
          q: "It says neither store ordered anything",
          a: "That is a real answer, not a gap: some departments are delivered straight off the vendor's truck and never carry an order. When neither store has an order in this department, Never ordered is withheld and those items read as Not carried here instead — the shape without the claim.",
        },
      ],
    },

    {
      id: "hand-off",
      title: "Hand it to the person who can fix it",
      desc: "One list per person, and what nobody can be handed",
      steps: [
        {
          title: "Open Hand-off",
          pre: "Choose the",
          chip: "Hand-off",
          post: "tab. The figure says how much of the shortfall has someone to hand it to. Under it is one row per person: the buyer, receiving, whoever sets price, and the items nobody can be handed. Click one.",
          see: "The card beside it slides to that person's whole list, biggest first. A list holding more than one cause names each item's cause in its own column.",
          anchor: "tabs",
        },
        {
          title: "Check a list before you send it",
          pre: "Show in grid takes you back to Items with that cause already filtered. It sits beside Export list when the list holds one cause, and beside each cause under the headline when it holds several. Click any item to open its evidence.",
          anchor: "causes",
        },
        {
          title: "Send it",
          pre: "Export list downloads the person's whole list as one file, each line carrying its cause, so the buyer gets the buyer's items and nobody else's. Copy UPCs copies them all.",
          anchor: "export",
        },
      ],
      issues: [
        {
          q: "A list has no owner",
          a: "It is still shown rather than dropped, on the Not handed to anyone list, which says why each of its causes has no owner. A shortfall that quietly vanishes is one somebody finds again next week.",
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
            { label: "No receiver on file, but it was delivered", result: "receiver" },
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
          why: "Not carried here is Never ordered without the claim. When neither store has an order in this department over the window — a department delivered off the truck, say — every item would otherwise read as a missed order, so the claim is withheld.",
          todo: [
            "Open Supply and check whether either store has an order in this department in the window.",
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
            "Open Supply, pick this store's orders, and paste the item's UPC into the box at the top of the card.",
            "If no order carries it, the order is older than the window. Worth saying so rather than treating it as a buyer's miss.",
          ],
        },
        {
          id: "receiver",
          tone: "warn",
          badge: "Check the receiver",
          title: "The receiver may not be entered, or may be dated before the order",
          why: "An order counts as received only by a receiver dated on or after it, so a receiver from an earlier order does not count. Receivers are also sometimes keyed in later than the delivery, for example at month end.",
          todo: [
            "Open the item's evidence: it shows the order date and the newest receiver on file for the department.",
            "If the newest receiver is older than the order, the receivers simply have not been entered yet.",
            "If a receiver for it exists after the order date, report it: the item should not carry this cause.",
          ],
        },
      ],
    },
  ],

  terms: [
    {
      term: "Ordered and Received",
      def: "The two halves of supply, and the two kinds of document behind them. A store orders — those are orders — and it receives — those are receivers. Both are read over a longer window than the sales week, because a delivery three weeks ago is what explains an empty shelf today.",
      anchor: "supply-window",
    },
    {
      term: "The 42-day window",
      def: "How far back the orders and receivers are read. It does not line up with the sales week on purpose: supply explains this week, not last week or last year, so the LW and LY columns are never answered by a cause.",
      anchor: "supply-window",
    },
    {
      term: "Never ordered",
      def: "No order for it at this store in the window, nothing received, nothing sold, and the other store sold it. A buyer's item. It only appears when either store has orders in this department to say so.",
      anchor: "causes",
    },
    {
      term: "Not carried here",
      def: "The same shape as Never ordered, without the claim. Shown when neither store has an order in this department over the window — a department delivered straight off the vendor's truck has none, so every item would otherwise read as a missed order. The other store sells it and nothing on record says this store ever had it.",
      anchor: "causes",
    },
    {
      term: "No receiver on file",
      def: "Ordered at this store, and no receiver for it is on file since that order. Orders carry no expected date, so this says only what is on record, never that the order is late: the receiver may simply not be entered yet. The item's evidence shows the order date and the newest receiver on file for the department. An item this store sold only gets this when no receiver at all is on file in the window.",
      anchor: "causes",
    },
    {
      term: "Received, none sold",
      def: "Delivered to this store, and none of it rang this week, while the other store sold it.",
      anchor: "causes",
    },
    {
      term: "Receivers unavailable",
      def: "The receivers could not be read this time, so nothing says whether an item this store did not ring was ever delivered. No supply cause is named until they load.",
      anchor: "causes",
    },
    {
      term: "Costing more",
      def: "Both stores sold it and this one buys it for more. Settled before the sales gap is looked at, because an item can sell more at this store and still make less — reading the sales gap first calls that a win.",
      anchor: "causes",
    },
    {
      term: "Selling fewer",
      def: "Both stores sold it, at about the same price, and this one sold fewer units. Merchandising, or simply different customers — nothing in this data says which, and the label does not pretend otherwise.",
      anchor: "causes",
    },
    {
      term: "Price / mix",
      def: "It sold at this store and took less per unit than at the other store, by more than 8%, and the lower price is the bigger part of the difference. When fewer units carry more of it, the item reads as Selling fewer instead.",
      anchor: "causes",
    },
    {
      term: "Streamlined",
      def: "The department's quiet majority: items the two stores are level on, within $5 either way, plus the tail nothing in this data separates. Nothing to chase.",
      anchor: "causes",
    },
    {
      term: "We're ahead",
      def: "This store sold more of it, by more than the $5 floor. An exact tie is not ahead — it is the same week rung twice, and it sits in Streamlined.",
      anchor: "causes",
    },
    {
      term: "Units and price",
      def: "How a row both stores rang is split. Each item's difference is split into what selling more or fewer units was worth and what taking more or less a unit was worth, each valued at the midpoint of the two stores, so neither store is the base and the two always add up to the difference. The row's figures are the items' own splits added up. Always in dollars, even on Quantity.",
      anchor: "tabs",
    },
    {
      term: "Fewer sold, Lower price, Both",
      def: "Why one item both stores rang is apart. A price counts only when the two average prices differ by more than 8%, the same band Price / mix uses. Inside it, the item reads Fewer sold or More sold. Past it, Lower or Higher price when price is the bigger part, and Both when units are bigger still.",
      anchor: "tabs",
    },
    {
      term: "Avg price",
      def: "Sales divided by units: what customers paid on average at each store, not the shelf price. On a scale item it is per pound.",
      anchor: "tabs",
    },
    {
      term: "Sections by share of the gap",
      def: "How the Summary lists a row's items: biggest first, cut where they make up half of the row's difference and where they reach 80%. Each section line gives its share, item count and total. Only the first starts open.",
      anchor: "tabs",
    },
    {
      term: "Week by week",
      def: "This week's gap to the other store against last week's and last year's. Within a tenth of last week reads as a standing difference; wider is getting worse, narrower getting better. All three follow the Sales/Quantity switch.",
      anchor: "tabs",
    },
    {
      term: "Hand-off lists",
      def: "One list per person: the buyer, receiving, whoever sets price. Causes nobody can act on go on Not handed to anyone, with the reason. Export list downloads a person's whole list as one file with each item's cause.",
      anchor: "tabs",
    },
    {
      term: "The evidence rail",
      def: "What one item's cause was built from: both stores' prices, both stores' costs, and every order and receiver that touched it. If a label looks wrong, this is where to check it.",
      anchor: "evidence",
    },
    {
      term: "Avg per basket",
      def: "How much of the item a customer who bought it carried out — units, or pounds on a scale item. It is an average over the baskets that held it at that price, not a total, so 2.20 qty means the typical buyer took two. A store level on units can still be behind here, which says the shoppers differ rather than the shelf does.",
      anchor: "evidence",
    },
    {
      term: "Dept lines",
      def: "How many lines on that order or receiver belong to this department, not how many are on the whole document. An invoice carrying one of our items and ninety of somebody else's shows 1.",
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
