import type { ItemLookupHistory } from "../../../features/itemLookupSlice";

export interface DayBucket {
  date: string;
  label: string;
  qty: number;
  revenue: number;
  cost: number;
  listPrice: number;
  hasSale: boolean;
}

export const buildDayBuckets = (
  history: ItemLookupHistory[],
  daysBack = 14,
): DayBucket[] => {
  const byDate = new Map<string, { qty: number; revenue: number; cost: number; listPrice: number }>();
  history.forEach((h) => {
    const d = h.sale_date.split("T")[0];
    const existing = byDate.get(d) ?? { qty: 0, revenue: 0, cost: 0, listPrice: 0 };
    existing.qty += h.qty;
    existing.revenue += h.total_sales;
    existing.cost += h.extended_cost;
    existing.listPrice = h.price;
    byDate.set(d, existing);
  });

  const buckets: DayBucket[] = [];
  const today = new Date();
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    const agg = byDate.get(iso);
    buckets.push({
      date: iso,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      qty: agg?.qty ?? 0,
      revenue: agg?.revenue ?? 0,
      cost: agg?.cost ?? 0,
      listPrice: agg?.listPrice ?? 0,
      hasSale: (agg?.qty ?? 0) > 0,
    });
  }
  return buckets;
};

export interface TrendResult {
  firstHalfQty: number;
  secondHalfQty: number;
  isSlowing: boolean;
}

export const computeTrend = (buckets: DayBucket[]): TrendResult => {
  const half = Math.floor(buckets.length / 2);
  const firstHalfQty = buckets.slice(0, half).reduce((acc, b) => acc + b.qty, 0);
  const secondHalfQty = buckets.slice(half).reduce((acc, b) => acc + b.qty, 0);
  return { firstHalfQty, secondHalfQty, isSlowing: secondHalfQty < firstHalfQty };
};

export interface MarginResult {
  totalCost: number;
  marginPct: number | null;
  avgSoldAt: number;
  listPrice: number;
  caseCost: number;
}

export const computeMargin = (
  history: ItemLookupHistory[],
  totalSales: number,
  totalQty: number,
): MarginResult => {
  const totalCost = history.reduce((acc, h) => acc + h.extended_cost, 0);
  const marginPct = totalSales > 0 ? ((totalSales - totalCost) / totalSales) * 100 : null;
  const avgSoldAt = totalQty > 0 ? totalSales / totalQty : 0;
  const last = history[history.length - 1];
  return {
    totalCost,
    marginPct,
    avgSoldAt,
    listPrice: last ? last.price : 0,
    caseCost: last ? last.casecost : 0,
  };
};

// Only resolved (closed) gaps — a run of no-sale days still open as of today
// is surfaced separately via computeActiveGap, since "no sales as of today"
// is a live, urgent signal rather than a passive historical stat.
export const findGaps = (buckets: DayBucket[]): { start: string; end: string; days: number }[] => {
  const gaps: { start: string; end: string; days: number }[] = [];
  let runStartIndex = -1;

  for (let i = 0; i < buckets.length; i++) {
    if (!buckets[i].hasSale) {
      if (runStartIndex === -1) runStartIndex = i;
    } else if (runStartIndex !== -1) {
      gaps.push({
        start: buckets[runStartIndex].label,
        end: buckets[i - 1].label,
        days: i - runStartIndex,
      });
      runStartIndex = -1;
    }
  }

  return gaps.filter((g) => g.days >= 2);
};

// Consecutive no-sale days counting back from the most recent bucket. 0 if
// the most recent day had a sale (no active dry spell).
export const computeActiveGap = (buckets: DayBucket[]): number => {
  let days = 0;
  for (let i = buckets.length - 1; i >= 0; i--) {
    if (buckets[i].hasSale) break;
    days++;
  }
  return days;
};
