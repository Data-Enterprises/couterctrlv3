import type { UpcPriceOpt } from "../../../../../interfaces";
import { isWeighted } from "../../../../../utils/pricedUnits";

export type PricePoint = {
  price: number;
  qty: number;
  /** Pounds, for a scale item. Zero on everything sold by the each. */
  weight: number;
  revenue: number;
};

// One row per unique price — the raw API rows can repeat the same price
// (e.g. across separate periods), so qty/weight/revenue are summed per price
// rather than shown as duplicate rows.
export function pricePoints(bestPrices: UpcPriceOpt[], code: string): PricePoint[] {
  const byPrice = new Map<number, PricePoint>();
  for (const p of bestPrices) {
    if (p.product_code !== code) continue;
    const existing = byPrice.get(p.price);
    if (existing) {
      existing.qty += p.total_qty;
      existing.weight += p.total_weight ?? 0;
      existing.revenue += p.total_revenue;
    } else {
      byPrice.set(p.price, {
        price: p.price,
        qty: p.total_qty,
        weight: p.total_weight ?? 0,
        revenue: p.total_revenue,
      });
    }
  }
  return Array.from(byPrice.values());
}

/**
 * The figure this item is actually priced and sold in.
 *
 * A scale item's `total_qty` is a scan count — how many times it was rung —
 * while `total_weight` is what the shelf price is denominated in and what the
 * revenue was earned on. Reading qty for a by-the-pound item doesn't just
 * mis-scale the column, it silently changes what the number means from row to
 * row, and it feeds elasticity a count where the price is per pound.
 *
 * Same rule as `pricedUnits` in utils, which the item margin tables already
 * follow — weight wins whenever it is non-zero.
 */
export const pointUnits = (p: PricePoint, weighted: boolean) =>
  weighted ? p.weight : p.qty;

/**
 * The price points that count: ones that moved anything, in the item's own
 * unit.
 *
 * A price that rang and moved nothing (a sale and its refund, or a scale item
 * rung at a price with no weight behind it) is no evidence of how the item
 * sells at that price. The KPI strip already left those out while the panel
 * and the export kept them, so one item could read 2 points and elasticity
 * -1.7 in the strip and 3 points and "—" beside it. Every caller now goes
 * through computePriceOptRowSummary, which applies this once.
 */
export const livePoints = (points: PricePoint[], weighted: boolean) =>
  points.filter((p) => pointUnits(p, weighted) > 0);

// No date field anywhere in this data, so there's no real "before/after" —
// elasticity is taken between the highest and lowest observed price points,
// which is well-defined regardless of how many price points exist.
export function elasticityFromPoints(
  points: PricePoint[],
  weighted = false,
): number | null {
  if (points.length < 2) return null;
  const sorted = [...points].sort((a, b) => a.price - b.price);
  const low = sorted[0];
  const high = sorted[sorted.length - 1];
  const lowUnits = pointUnits(low, weighted);
  const highUnits = pointUnits(high, weighted);
  if (low.price === high.price || lowUnits === 0) return null;
  const pctQtyChange = (highUnits - lowUnits) / lowUnits;
  const pctPriceChange = (high.price - low.price) / low.price;
  if (pctPriceChange === 0) return null;
  return pctQtyChange / pctPriceChange;
}

export type PriceOptRowSummary = {
  code: string;
  desc: string;
  points: PricePoint[];
  bestPrice: number;
  /** Volume at the best price, in this item's own unit. */
  bestUnits: number;
  bestRevenue: number;
  /** Sold by the pound — what `bestUnits` and every point's figure mean. */
  weighted: boolean;
  elasticity: number | null;
};

// Single source of truth for a row's numbers, shared by the left list and
// the detail panel so they can never drift out of sync. Best price is the
// API's own best_prices_by_upc pick (by revenue) taken directly — there's
// no current price or cost anywhere in this data, so there's nothing to
// compare it against or compute profit from.
export function computePriceOptRowSummary(
  row: UpcPriceOpt,
  ownBestPrices: UpcPriceOpt[],
  fixes = false,
): PriceOptRowSummary {
  const all = pricePoints(ownBestPrices, row.product_code);
  // An item counts as weighted if weight ever landed on it — the best-price
  // row alone can be a week where the scale item happened to ring flat.
  const weighted =
    fixes && (isWeighted(row.total_weight) || all.some((p) => p.weight > 0));
  const points = livePoints(all, weighted);
  const elasticity = elasticityFromPoints(points, weighted);
  // The best price's volume from its price point -- every row at that price
  // summed -- in the item's own unit. The best row alone can be one of
  // several at that price, or a week the scale item rang with no weight: the
  // tile then read "0" beside a per-pound price while the export wrote the
  // ring count as "ea".
  const bestPoint = all.find((p) => p.price === row.price);
  const bestUnits = bestPoint
    ? pointUnits(bestPoint, weighted)
    : weighted
      ? row.total_weight
      : row.total_qty;

  return {
    code: row.product_code,
    desc: row.product_description,
    points,
    bestPrice: row.price,
    bestUnits,
    // From the same price point as the volume: the best row alone is one of
    // possibly several at that price (an item rung under two descriptions),
    // so its revenue sat beside a volume summed over all of them -- $120
    // next to 61.50 lb at $3.99/lb.
    bestRevenue: bestPoint ? bestPoint.revenue : row.total_revenue,
    weighted,
    elasticity,
  };
}

/** A best-price volume with its unit: pounds to two places for a weighed
 *  item, even at 0, so the figure can't be read as a count. */
export const formatBestUnits = (units: number, weighted: boolean) =>
  weighted
    ? `${units.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} lb`
    : Math.round(units).toLocaleString();
