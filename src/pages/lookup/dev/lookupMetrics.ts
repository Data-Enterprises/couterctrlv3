import type { ItemLookupHistory } from "../../../features/itemLookupSlice";
import { calculateCogs } from "../../subDepts";

/**
 * How many priced units a row represents.
 *
 * Revenue = price x units by definition, so `total_sales / price` gives the
 * units the customer was actually charged for — pounds on a scale item, eaches
 * otherwise. `qty` is the number of times the item was *rung*, which is the
 * same thing only for each-priced goods. Bananas ring 80 times for 162 lb, so
 * costing them by qty understates COGS by half.
 *
 * Preference order:
 *   1. `weight` — correct and exact, but /itemlookup doesn't return it yet.
 *      Typed optional so it takes over automatically once the API adds it.
 *   2. derived units, but ONLY when they come out ABOVE qty.
 *   3. `qty` otherwise.
 *
 * The direction is the whole trick. `price` is the shelf price, not what the
 * item actually rang at, so a promoted item derives *fewer* units than it sold
 * — a 12-pack listed at $9.99 that rang at $6.99 derives 0.70, and costing it
 * as 0.70 of a case is nonsense. A scale item can only ever go the other way:
 * more pounds than scans. So treat above-qty as weight and below-qty as a
 * discount, and never let a markdown shrink the cost of goods.
 *
 * Known gap: a weighted item averaging under ~1.1 lb per scan falls back to
 * qty, which overstates cost. That understates margin rather than inflating
 * it, which is the safer direction — and the `weight` column removes the
 * guess entirely.
 */
export const pricedUnits = (h: ItemLookupHistory): number => {
  if (h.weight && h.weight > 0) return h.weight;
  if (!h.price || h.price <= 0 || h.qty <= 0) return h.qty;
  const derived = h.total_sales / h.price;
  return derived > h.qty * 1.1 ? derived : h.qty;
};

/** COGS for one lookup row, through the same helper Sub Dept Margins uses.
 *  `casecost` is already cost-per-unit (the SQL divides by case_size), so it
 *  goes in on the caseSize-0 path that treats the cost as per-unit. */
export const rowCogs = (h: ItemLookupHistory): number =>
  calculateCogs(0, h.casecost, 0, h.qty, pricedUnits(h));

export interface DayBucket {
  date: string;
  label: string;
  qty: number;
  /** Priced units — pounds on a scale item, else identical to qty. */
  units: number;
  revenue: number;
  cost: number;
  listPrice: number;
  hasSale: boolean;
}

export const buildDayBuckets = (
  history: ItemLookupHistory[],
  daysBack = 14,
): DayBucket[] => {
  const byDate = new Map<string, { qty: number; units: number; revenue: number; cost: number; listPrice: number }>();
  history.forEach((h) => {
    const d = h.sale_date.split("T")[0];
    const existing = byDate.get(d) ?? { qty: 0, units: 0, revenue: 0, cost: 0, listPrice: 0 };
    existing.qty += h.qty;
    existing.units += pricedUnits(h);
    existing.revenue += h.total_sales;
    // NOT h.extended_cost — the API builds that as casecost x qty, which is
    // wrong for anything sold by weight. See rowCogs.
    existing.cost += rowCogs(h);
    existing.listPrice = h.price;
    byDate.set(d, existing);
  });

  const buckets: DayBucket[] = [];
  // The lookup endpoint takes no date param — it's a plain daysback count —
  // and its window ends yesterday, not today (today's sales aren't final
  // yet). Mirror that here so the grid we build lines up with what the
  // API actually returned.
  const end = new Date();
  end.setDate(end.getDate() - 1);
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    const agg = byDate.get(iso);
    buckets.push({
      date: iso,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      qty: agg?.qty ?? 0,
      units: agg?.units ?? 0,
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
  /** Priced units across the window — pounds for a scale item. */
  totalUnits: number;
  /** True when the item prices by weight, so the UI can label units "lb". */
  weighed: boolean;
  listPrice: number;
  /** Cost of one priced unit. The API calls this `casecost`, but the SQL
   *  already divides by case_size — it is not the cost of a case. */
  unitCost: number;
}

export const computeMargin = (
  history: ItemLookupHistory[],
  totalSales: number,
  totalQty: number,
): MarginResult => {
  const totalCost = history.reduce((acc, h) => acc + rowCogs(h), 0);
  const marginPct = totalSales > 0 ? ((totalSales - totalCost) / totalSales) * 100 : null;
  // Per priced unit, so it stays comparable to list price. Dividing by qty
  // reads as "$1.13 on a $0.59 item" when bananas ring ~1.9 lb at a time.
  const totalUnits = history.reduce((acc, h) => acc + pricedUnits(h), 0);
  const avgSoldAt = totalUnits > 0 ? totalSales / totalUnits : 0;
  const last = history[history.length - 1];
  const weighed = totalUnits > totalQty * 1.1;
  return {
    totalCost,
    marginPct,
    avgSoldAt,
    totalUnits,
    weighed,
    listPrice: last ? last.price : 0,
    unitCost: last ? last.casecost : 0,
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
