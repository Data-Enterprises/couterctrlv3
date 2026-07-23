import type { UpcPriceOpt } from "../../../../../interfaces";

export type PricePoint = { price: number; qty: number; revenue: number };

// One row per unique price — the raw API rows can repeat the same price
// (e.g. across separate periods), so qty/revenue are summed per price rather
// than shown as duplicate rows.
export function pricePoints(bestPrices: UpcPriceOpt[], code: string): PricePoint[] {
  const byPrice = new Map<number, PricePoint>();
  for (const p of bestPrices) {
    if (p.product_code !== code) continue;
    const existing = byPrice.get(p.price);
    if (existing) {
      existing.qty += p.total_qty;
      existing.revenue += p.total_revenue;
    } else {
      byPrice.set(p.price, { price: p.price, qty: p.total_qty, revenue: p.total_revenue });
    }
  }
  return Array.from(byPrice.values());
}

// No date field anywhere in this data, so there's no real "before/after" —
// elasticity is taken between the highest and lowest observed price points,
// which is well-defined regardless of how many price points exist.
export function elasticityFromPoints(points: PricePoint[]): number | null {
  if (points.length < 2) return null;
  const sorted = [...points].sort((a, b) => a.price - b.price);
  const low = sorted[0];
  const high = sorted[sorted.length - 1];
  if (low.price === high.price || low.qty === 0) return null;
  const pctQtyChange = (high.qty - low.qty) / low.qty;
  const pctPriceChange = (high.price - low.price) / low.price;
  if (pctPriceChange === 0) return null;
  return pctQtyChange / pctPriceChange;
}

export type PriceOptRowSummary = {
  code: string;
  desc: string;
  points: PricePoint[];
  bestPrice: number;
  bestQty: number;
  bestRevenue: number;
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
): PriceOptRowSummary {
  const points = pricePoints(ownBestPrices, row.product_code);
  const elasticity = elasticityFromPoints(points);

  return {
    code: row.product_code,
    desc: row.product_description,
    points,
    bestPrice: row.price,
    bestQty: row.total_qty,
    bestRevenue: row.total_revenue,
    elasticity,
  };
}
