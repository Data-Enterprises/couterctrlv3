import type { UpcPriceOpt } from "../../../../../interfaces";
import type { UpcCurrentPriceCost } from "../../../../../features/upcDevSlice";

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

export function isOverpriced(currentPrice: number | null, bestPrice: number): boolean {
  return currentPrice !== null && currentPrice > bestPrice;
}

export type BestPrice = { price: number; qty: number; revenue: number; profit: number; byProfit: boolean };

// The price point with the highest total historical gross profit — not the
// API's revenue-based pick — since a price with more volume can win on
// total profit even at a smaller per-unit margin, and that's exactly the
// case worth surfacing. Only computable once current cost is known; falls
// back to the API's own best price (by revenue) when it isn't, e.g. Group
// mode before a store's picked.
export function bestPriceByProfit(
  points: PricePoint[],
  currentCost: number | null,
  fallbackPrice: number,
  fallbackQty: number,
  fallbackRevenue: number,
): BestPrice {
  if (currentCost === null || points.length === 0) {
    return { price: fallbackPrice, qty: fallbackQty, revenue: fallbackRevenue, profit: 0, byProfit: false };
  }
  let best: BestPrice | null = null;
  for (const p of points) {
    const profit = (p.price - currentCost) * p.qty;
    if (!best || profit > best.profit) {
      best = { price: p.price, qty: p.qty, revenue: p.revenue, profit, byProfit: true };
    }
  }
  return best!;
}

// No date field anywhere in this data, so there's no real "before/after" —
// elasticity is taken between the highest and lowest observed price points,
// which is well-defined regardless of how many price points exist and works
// the same in Store mode and Group mode (unlike current-price-based framing,
// which only exists once a store's picked).
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

export type PriceOptStatus =
  | "no-comparison-data"
  | "no-current-price"
  | "no-cost-data"
  | "overpriced"
  | "optimal";

// A price below best isn't flagged as a problem — only above-best (overpriced)
// gets a warning state; everything at or under best reads as "optimal."
export function getStatus(
  points: PricePoint[],
  currentPrice: number | null,
  currentCost: number | null,
  resolved: boolean,
  bestPrice: number,
): PriceOptStatus {
  if (points.length < 2) return "no-comparison-data";
  if (!resolved) return "no-comparison-data";
  if (currentPrice === null) return "no-current-price";
  if (currentCost === null) return "no-cost-data";
  return currentPrice > bestPrice ? "overpriced" : "optimal";
}

export type ProfitAtRisk =
  | { status: "ok"; profitAtRisk: number; profitAtCurrent: number; profitAtBest: number; unitsSuppressed: number }
  | { status: "no-current-price" }
  | { status: "not-overpriced" }
  | { status: "no-history-at-current-price" };

// Estimated profit gained by moving from the current price to the best
// historical price, using historical qty at each price as a stand-in for
// expected volume. Only meaningful when the item is actually overpriced.
export function computeProfitAtRisk(
  currentPrice: number | null,
  currentCost: number | null,
  bestPrice: number,
  bestQty: number,
  points: PricePoint[],
): ProfitAtRisk {
  if (currentPrice === null || currentCost === null) return { status: "no-current-price" };
  if (currentPrice <= bestPrice) return { status: "not-overpriced" };

  const atCurrent = points.find((p) => p.price === currentPrice);
  if (!atCurrent) return { status: "no-history-at-current-price" };

  const profitAtCurrent = (currentPrice - currentCost) * atCurrent.qty;
  const profitAtBest = (bestPrice - currentCost) * bestQty;
  return {
    status: "ok",
    profitAtRisk: profitAtBest - profitAtCurrent,
    profitAtCurrent,
    profitAtBest,
    unitsSuppressed: bestQty - atCurrent.qty,
  };
}

export type PriceOptRowSummary = {
  code: string;
  desc: string;
  points: PricePoint[];
  bestPrice: number;
  bestQty: number;
  bestRevenue: number;
  elasticity: number | null;
  // False until this item has actually been opened (and, in Group search,
  // a store picked) — current price/cost are fetched lazily per selected
  // item, never batched for the whole list. Every row starts unchecked.
  isChecked: boolean;
  currentPrice: number | null;
  currentCost: number | null;
  status: PriceOptStatus | null;
  risk: ProfitAtRisk | null;
};

// Single source of truth for a row's numbers, shared by the left list and
// the detail panel so they can never drift out of sync. `ownBestPrices` is
// whatever price-point source is already correctly scoped without a fetch —
// the initial batch in Store search (already single-store), or the
// group-wide batch in Group search before a store's picked. `storeScopedRows`
// is only ever set in Group search, once the selected item's price history
// has been re-fetched scoped to the one picked store.
export function computePriceOptRowSummary(
  row: UpcPriceOpt,
  ownBestPrices: UpcPriceOpt[],
  cpc: UpcCurrentPriceCost | undefined,
  storeScopedRows: UpcPriceOpt[] | undefined,
  hasStoreResolved: boolean,
): PriceOptRowSummary {
  const isChecked = cpc !== undefined;
  const source = storeScopedRows ?? ownBestPrices;
  const points = pricePoints(source, row.product_code);
  const currentPrice = cpc?.currentPrice ?? null;
  const currentCost = cpc?.currentCost ?? null;
  const best = bestPriceByProfit(
    points,
    isChecked ? currentCost : null,
    row.price,
    row.total_qty,
    row.total_revenue,
  );
  const elasticity = elasticityFromPoints(points);

  const base = {
    code: row.product_code,
    desc: row.product_description,
    points,
    bestPrice: best.price,
    bestQty: best.qty,
    bestRevenue: best.revenue,
    elasticity,
  };

  if (!isChecked) {
    return { ...base, isChecked: false, currentPrice: null, currentCost: null, status: null, risk: null };
  }

  const status = getStatus(points, currentPrice, currentCost, hasStoreResolved, best.price);
  const risk = computeProfitAtRisk(currentPrice, currentCost, best.price, best.qty, points);
  return { ...base, isChecked: true, currentPrice, currentCost, status, risk };
}
