import type { InfoGlossaryEntry } from "../../../components/InfoPopover";
import type { ItemDimension } from "../../../features/itemPerfSlice";

const NOUN: Record<ItemDimension, { one: string; many: string }> = {
  subdept: { one: "sub department", many: "sub departments" },
  vendor: { one: "vendor", many: "vendors" },
  category: { one: "category", many: "categories" },
};

/**
 * The mobile "?" sheet for Sub Dept Margins, Vendors and Categories.
 *
 * One screen serves all three, so the copy is written once with the grouping
 * swapped in. The desktop glossaries describe grading and thresholds, which
 * mobile doesn't have.
 */
export const itemPerfMobileInfo = (
  dimension: ItemDimension,
  title: string,
): { title: string; purpose: string; glossary: InfoGlossaryEntry[] } => {
  const n = NOUN[dimension];
  return {
    title,
    purpose: `Margin for one store's week against the same week last year, by ${n.one}. Open one to see its figures, then its items, then a single item's week day by day. Nothing is graded: the two years sit side by side and you draw the conclusion.`,
    glossary: [
      {
        term: "The card at the top",
        desc: `The store you searched, for the whole week — its margin, and its sales against last year. It doesn't open, because what is inside it is the list of ${n.many} underneath.`,
      },
      {
        term: "TY margin / LY margin",
        desc: "Gross margin this year: sales minus cost of goods, as a percentage of sales. LY margin is the same for last year.",
      },
      {
        term: "Bars",
        desc: `Sales this year (TY) against last year (LY) — on the cards, the day chart and every ${n.one} and item in a list. The percentage says how healthy; the bars say how much was sold.`,
      },
      {
        term: "Gross profit / Cost",
        desc: "Sales before tax minus the cost of goods sold, and that cost — this year on the top row, last year beneath. Cost is what was actually paid after vendor allowances, and weighted items cost by the pound.",
      },
      {
        term: "TY / LY",
        desc: 'LY is the same weekdays last year, matched day by day, so a Monday is compared with a Monday. "No history" means we have no record for this store last year — not that it sold nothing.',
      },
      {
        term: `Open a ${n.one}`,
        desc: `Tap it to open its report where it sits. One opens at a time; the others shrink to a single line so the one you opened has the screen.`,
      },
      {
        term: "Tap a day",
        desc: `Inside an open ${n.one}, scopes that ${n.one} to the day — its figures and its items. It belongs to that card only, and clears when you open a different one. Tap the same day again for the full week.`,
      },
      {
        term: "View items",
        desc: `Opens that ${n.one}'s items on their own screen. Tap an item to see its week day by day. Back returns to the list with your card still open.`,
      },
      {
        term: "Find an item or scan",
        desc: `Searches every item in the store's week, not just one ${n.one} — by name, by UPC, or by scanning a barcode. Each result names the ${n.one} it came from, and tapping one goes straight to that item's week.`,
      },
      {
        term: "Filtering and scanning a list",
        desc: `The box above a list narrows it to what you type, and the scan button fills it from a barcode. Inside a ${n.one} that only covers its own items, so if a scan finds nothing the screen offers to search the whole store for it instead.`,
      },
      {
        term: "Sort by",
        desc: "Sales puts the biggest sellers first. Profit puts the biggest earners first. GPM puts the thinnest margins first. Change vs LY puts the biggest drop first; anything with no sales last year goes to the bottom. Name sorts A to Z. Tap the same one again to reverse it, and once more to put the list back the way it arrived.",
      },
      {
        term: "Each page keeps its place",
        desc: "Sub Dept Margins, Vendors and Categories each remember their own search, sort and open card. Moving between them leaves the others as you left them.",
      },
      {
        term: "Location",
        desc: "A few stores share one store ID across two locations. When that happens you can switch between them; the figures are never added together.",
      },
    ],
  };
};
