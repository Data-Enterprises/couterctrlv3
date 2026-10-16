import type {
  TopItemRow,
  TopItemPricePoint,
} from "../../../../api/topItems";

/**
 * Top items — the arithmetic, with no React in it.
 *
 * The endpoint ranks by units and this tab ranks by sales, so the reordering
 * lives here rather than in the component: it is the difference between two
 * different lists of two hundred items, not a display detail.
 */

/** Units sold at a price the POS did not call regular. */
export const promoUnits = (r: TopItemRow) => r.qty_promo;

/** The share of an item's units that moved off regular price, 0–1. Deal items
 *  count: for the stores that sell them, the deal IS the item. */
export const promoShare = (r: TopItemRow): number => {
  const known = r.qty_regular + r.qty_promo + r.qty_deal_item;
  if (known <= 0) return 0;
  return (r.qty_promo + r.qty_deal_item) / known;
};

/**
 * What a unit actually fetched, averaged over everything that rang.
 *
 * Blended across regular and promo deliberately — it is the number that
 * belongs beside cost, because it is what the week really earned. The
 * individual prices are in `price_points` and the panel shows those too.
 */
export const avgPrice = (r: TopItemRow): number | null =>
  r.qty > 0 ? r.total_sales / r.qty : null;

/** Sales less cost. Null when the cost is not trustworthy, on the same rule
 *  the server uses to null the margin. */
export const grossProfit = (r: TopItemRow): number | null =>
  r.margin === null ? null : r.total_sales - r.ext_cost;

/**
 * The top `shown` items by sales.
 *
 * Ties break on units and then product code, so the list cannot reorder
 * itself between two renders of the same data.
 */
export const rankBySales = (items: TopItemRow[], shown: number): TopItemRow[] =>
  [...items]
    .sort(
      (a, b) =>
        b.total_sales - a.total_sales ||
        b.qty - a.qty ||
        a.product_code.localeCompare(b.product_code),
    )
    .slice(0, shown);

/**
 * The prices one item rang at, biggest first.
 *
 * Grouped by price across stores, because a single-store call cannot return
 * the same price twice — and grouping anyway means the group view can reuse
 * this untouched.
 */
export const pointsFor = (
  points: TopItemPricePoint[],
  productCode: string,
): { price: number; units: number; netSales: number }[] => {
  const byPrice = new Map<number, { units: number; netSales: number }>();
  points
    .filter((p) => p.product_code === productCode)
    .forEach((p) => {
      const seen = byPrice.get(p.price);
      if (seen) {
        seen.units += p.units;
        seen.netSales += p.net_sales;
      } else {
        byPrice.set(p.price, { units: p.units, netSales: p.net_sales });
      }
    });
  return [...byPrice.entries()]
    .map(([price, v]) => ({ price, ...v }))
    .sort((a, b) => b.units - a.units || b.price - a.price);
};

export type ItemTone = "critical" | "watch" | "healthy" | "unknown";

export interface ItemInsight {
  tone: ItemTone;
  label: string;
  detail: string;
}

const money = (n: number) =>
  `$${Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const pct = (n: number) => `${Math.round(n * 100)}%`;

/**
 * The sentence the figures add up to.
 *
 * Ordered by what the reader can act on rather than by severity. Selling
 * under cost is the finding; whether a promotion caused it is what turns it
 * into something to do, so the promotion case is tested first and reads
 * differently — one is "stop the promotion", the other is "check the cost".
 *
 * Everything here comes off fields the endpoints return. Nothing is inferred
 * from a price the response does not carry.
 */
export const topItemInsight = (
  r: TopItemRow,
  points: { price: number; units: number }[],
): ItemInsight => {
  const share = promoShare(r);
  const avg = avgPrice(r);
  const gp = grossProfit(r);
  const unitCost = r.qty > 0 ? r.ext_cost / r.qty : null;

  if (r.margin === null) {
    const cov = r.cost_coverage === null ? null : Math.round(r.cost_coverage);
    return {
      tone: "unknown",
      label: "Margin not known",
      detail:
        `${money(r.total_sales)} across ${r.qty.toLocaleString()} units, but ` +
        (cov === null
          ? "no line carried a cost"
          : `only ${cov}% of lines carried a cost`) +
        ", so there is no margin to trust here. Sales and movement are unaffected.",
    };
  }

  const underWater = r.margin < 0;

  if (underWater && share >= 0.8 && avg !== null && unitCost !== null) {
    return {
      tone: "critical",
      label: "Promotion under water",
      detail:
        `${pct(share)} of units moved off regular price, at an average ` +
        `${money(avg)} against a ${money(unitCost)} cost — about ` +
        `${money(gp ?? 0)} given away this week. The promotion is the thing ` +
        `to look at, not the item.`,
    };
  }

  if (underWater && avg !== null && unitCost !== null) {
    return {
      tone: "critical",
      label: "Selling below cost",
      detail:
        `An average ${money(avg)} against a ${money(unitCost)} cost, about ` +
        `${money(gp ?? 0)} down over ${r.qty.toLocaleString()} units. Only ` +
        `${pct(share)} of them were off regular price, so this is the cost ` +
        `rather than a promotion.`,
    };
  }

  if (share >= 0.95 && points.length > 0) {
    const top = points[0];
    return {
      tone: "watch",
      label: "Only sells on promo",
      detail:
        `Every unit rang at ${money(top.price)} or another off-regular ` +
        `price. It still makes ${r.margin.toFixed(1)}%, but nothing sold at ` +
        `the regular price this week.`,
    };
  }

  return {
    tone: "healthy",
    label: "Holding up",
    detail:
      `${money(r.total_sales)} at ${r.margin.toFixed(1)}% over ` +
      `${r.qty.toLocaleString()} units` +
      (share > 0 ? `, ${pct(share)} of them off regular price.` : "."),
  };
};
