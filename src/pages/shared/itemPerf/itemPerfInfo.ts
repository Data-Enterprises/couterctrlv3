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
    purpose: `Margin for one store's week against the same week last year — by ${n.one}, then down to each item and its week day by day.`,
    glossary: [
      { term: "TY margin", desc: "Gross margin this year: sales minus cost of goods, as a percentage of sales. LY margin is the same for last year." },
      { term: "Bars", desc: "Gross profit in dollars — sales minus cost — this year (TY) against last year (LY). The percentage says how healthy; the bars say how much it's worth." },
      { term: "TY sales / TY cost", desc: "This year's sales before tax, and the cost of goods sold. Cost is what was actually paid after vendor allowances, and weighted items cost by the pound." },
      { term: "TY / LY", desc: "LY is the same weekdays last year, matched day by day, so a Monday is compared with a Monday. \"No history\" means we have no record for this store last year — not that it sold nothing." },
      { term: "Tap a day", desc: "Scopes the card and the list to that day. Tap it again for the full week." },
      { term: `Tap a ${n.one}`, desc: `Opens the items in that ${n.one}. Tap an item to see its week day by day.` },
      { term: "Search", desc: "Find any item in the store's week by name or UPC, or scan a barcode." },
      { term: "Sort by", desc: "Profit puts the biggest earners first. Sales puts the biggest sellers first. GPM puts the thinnest margins first. Change vs LY puts the biggest drop in profit first; anything with no profit last year goes to the bottom. Name sorts A to Z." },
      { term: "Location", desc: "A few stores share one store ID across two locations. When that happens you can switch between them; the figures are never added together." },
    ],
  };
};
