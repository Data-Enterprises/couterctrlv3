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
  const points = pricePoints(ownBestPrices, row.product_code);
  // An item counts as weighted if weight ever landed on it — the best-price
  // row alone can be a week where the scale item happened to ring flat.
  const weighted =
    fixes && (isWeighted(row.total_weight) || points.some((p) => p.weight > 0));
  const elasticity = elasticityFromPoints(points, weighted);

  return {
    code: row.product_code,
    desc: row.product_description,
    points,
    bestPrice: row.price,
    bestUnits: weighted ? row.total_weight : row.total_qty,
    bestRevenue: row.total_revenue,
    weighted,
    elasticity,
  };
}
