// Utils
import { isWeighted } from "../../../../../utils/pricedUnits";

// Interfaces
import type { PriceOptRowSummary, PricePoint } from "./interfaces";
import type { UpcPriceOpt } from "../../../../../interfaces";

// One row per unique price: the API can repeat a price across periods, so
// qty/weight/revenue are summed per price.
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
 * The figure the item is priced and sold in: weight wins whenever it is
 * non-zero (a scale item's `total_qty` is a ring count), the same rule as
 * `pricedUnits` in utils.
 */
export const pointUnits = (p: PricePoint, weighted: boolean) =>
  weighted ? p.weight : p.qty;

/**
 * The price points that count: ones that moved anything, in the item's own
 * unit (a sale and its refund, or a weightless scale ring, is no evidence).
 * Every caller goes through computePriceOptRowSummary, which applies this once.
 */
export const livePoints = (points: PricePoint[], weighted: boolean) =>
  points.filter((p) => pointUnits(p, weighted) > 0);

// No dates in this data, so elasticity is taken between the highest and
// lowest observed price points.
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

// One source of a row's numbers, shared by the left list and the detail panel.
// Best price is the API's best_prices_by_upc pick (by revenue).
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
  // The best price's volume, summed over every row at that price, in the
  // item's own unit (one row alone can be partial or weightless).
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
    // Revenue from the same price point as the volume, so the two describe
    // the same rows.
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
