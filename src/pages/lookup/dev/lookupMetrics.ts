import type {
  ItemLookupHistory,
  SaleTypeSummary,
} from "../../../features/itemLookupSlice";
import { calculateCogs } from "../../subDepts";
import { isSaleRow } from "../../../utils/saleType";

/**
 * How many priced units a row represents.
 *
 * `qty` counts how many times the item was *rung*; `weight` is what the
 * customer was actually charged for. They're the same thing only for
 * each-priced goods. Bananas ring ~2.1 lb at a time, so costing them by qty
 * understates COGS by more than half — 67.78% margin against a real 30.93%.
 *
 * `weight` comes back 0 on an each-priced item, which is the discriminator:
 * no null handling, no heuristic. This used to derive pounds from
 * `total_sales / price` because the column wasn't returned; that guess is gone
 * along with the directional tolerance it needed to survive promoted items
 * whose shelf price wasn't their ring price.
 */
export const pricedUnits = (h: ItemLookupHistory): number =>
  h.weight > 0 ? h.weight : h.qty;

/**
 * What one unit of this item cost — after the vendor's allowance where there is
 * one, at list where there isn't. The figure Sub Dept Margins costs against,
 * and the only way the two pages can agree on a promoted item.
 *
 * Three routes, best first, so this works against whatever the endpoint
 * happens to be returning that day:
 *
 *   1. `unit_cost` — the server did it. Nothing to reconstruct.
 *
 *   2. `net_cost x casecost / cost`. `net_cost` and `cost` are both per CASE
 *      while `casecost` is per unit, so `casecost / cost` is exactly
 *      `1 / case_size` — which brings `net_cost` down to a unit without
 *      `case_size` ever being returned. On 7800003538: 11.98 x 7.50 / 15 =
 *      5.99, against the 7.50 `casecost` alone would have given.
 *
 *   3. `casecost` — list cost per unit. Correct for anything without an
 *      allowance, and low-margin-biased for anything with one.
 *
 * There is deliberately no route from `net_cost` and `casecost` alone:
 * `net_cost / casecost` is `case_size` only when cost equals net_cost, so
 * dividing by it just returns `casecost` and quietly looks like it worked.
 */
export const rowUnitCost = (h: ItemLookupHistory): number => {
  if (h.unit_cost && h.unit_cost > 0) return h.unit_cost;
  // net_cost of 0 means no allowance, not free goods — fall through to list.
  if (h.cost && h.cost > 0 && h.net_cost > 0 && h.casecost > 0) {
    return (h.net_cost * h.casecost) / h.cost;
  }
  return h.casecost;
};

/** COGS for one lookup row, through the same helper Sub Dept Margins uses.
 *  The cost is already per-unit, so it goes in on the caseSize-0 path that
 *  treats it as such. */
export const rowCogs = (h: ItemLookupHistory): number =>
  calculateCogs(0, rowUnitCost(h), 0, h.qty, pricedUnits(h));

/**
 * The item's name. The top-level `description` can come back blank while the
 * history rows carry one — an item that rang before its description was set
 * up, then got named mid-window. Falls back to the most recent row that has a
 * name.
 */
export const itemDescription = (
  description: string | null | undefined,
  history: ItemLookupHistory[],
): string => {
  if (description) return description;
  const named = history
    .filter((h) => h.product_description)
    .sort((a, b) => b.sale_date.localeCompare(a.sale_date));
  return named[0]?.product_description ?? "";
};

/**
 * Every register line type in the window: Sale first, then the rest by dollars.
 *
 * Takes every row as returned, not the Sale rows the headline figures use. Returns only
 * Sale when the response carries no `sale_type`, which the UI reads as nothing
 * to break down.
 */
export const buildSaleTypeBreakdown = (
  rows: ItemLookupHistory[],
): SaleTypeSummary[] => {
  const byType = new Map<string, SaleTypeSummary & { dates: Set<string> }>();
  for (const h of rows) {
    const saleType = isSaleRow(h) ? "Sale" : h.sale_type!;
    const acc =
      byType.get(saleType) ??
      { saleType, days: 0, sales: 0, qty: 0, units: 0, dates: new Set<string>() };
    acc.sales += h.total_sales;
    acc.qty += h.qty;
    acc.units += pricedUnits(h);
    acc.dates.add(h.sale_date.split("T")[0]);
    byType.set(saleType, acc);
  }
  return [...byType.values()]
    .map(({ dates, ...s }) => ({ ...s, days: dates.size }))
    .sort((a, b) =>
      a.saleType === "Sale" ? -1 : b.saleType === "Sale" ? 1 : b.sales - a.sales,
    );
};

/** True when there's anything besides Sale to break down. False for every
 *  response from an endpoint that doesn't return `sale_type` yet. */
export const hasSaleTypeBreakdown = (saleTypes: SaleTypeSummary[]) =>
  saleTypes.some((s) => s.saleType !== "Sale");

/** One sale type's rows. "Sale" includes rows with no `sale_type`, which is
 *  what every row was before the field existed. */
export const rowsOfSaleType = (
  rows: ItemLookupHistory[],
  saleType: string,
): ItemLookupHistory[] =>
  saleType === "Sale"
    ? rows.filter(isSaleRow)
    : rows.filter((h) => h.sale_type === saleType);

export interface DayBucket {
  date: string;
  label: string;
  qty: number;
  /** Priced units — pounds on a scale item, else identical to qty. */
  units: number;
  revenue: number;
  cost: number;
  listPrice: number;
  /** Anything sold: rings, weight or dollars. A scale item rings `qty: 0` and
   *  records its sale in `weight`, so qty alone reads every day as empty. */
  hasSale: boolean;
  /** A cost was on file for the day's sales. Without one, COGS is 0 and a
   *  margin computed from it reads 100% — shown as missing instead. */
  hasCost: boolean;
}

/** Per-day margin, or null when there was no sale or no cost to measure it by. */
export const dayMarginPct = (b: DayBucket): number | null =>
  b.hasSale && b.hasCost && b.revenue > 0
    ? ((b.revenue - b.cost) / b.revenue) * 100
    : null;

/** Cost of one priced unit that day — per lb on a scale item. */
export const dayUnitCost = (b: DayBucket): number | null =>
  b.hasSale && b.hasCost && b.units > 0 ? b.cost / b.units : null;

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
      hasSale: !!agg && (agg.units > 0 || agg.revenue !== 0),
      hasCost: (agg?.cost ?? 0) > 0,
    });
  }
  return buckets;
};

export interface TrendResult {
  /** Priced units — pounds on a scale item, whose qty is always 0. */
  firstHalfUnits: number;
  secondHalfUnits: number;
  isSlowing: boolean;
}

export const computeTrend = (buckets: DayBucket[]): TrendResult => {
  const half = Math.floor(buckets.length / 2);
  const firstHalfUnits = buckets.slice(0, half).reduce((acc, b) => acc + b.units, 0);
  const secondHalfUnits = buckets.slice(half).reduce((acc, b) => acc + b.units, 0);
  return { firstHalfUnits, secondHalfUnits, isSlowing: secondHalfUnits < firstHalfUnits };
};

/** "12" for a count, "37.40 lb" for a scale item. */
export const formatUnits = (units: number, weighed: boolean): string =>
  weighed
    ? `${units.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} lb`
    : units.toLocaleString("en-US", { maximumFractionDigits: 2 });

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
  /** No cost on file for anything sold in the window. `marginPct` is null and
   *  `unitCost` is 0; the UI says so rather than showing 100% and $0.00. */
  costMissing: boolean;
}

export const computeMargin = (
  history: ItemLookupHistory[],
  totalSales: number,
  totalQty: number,
): MarginResult => {
  const totalCost = history.reduce((acc, h) => acc + rowCogs(h), 0);
  // A sale with no cost behind it costs out at $0, which is a 100% margin that
  // nobody earned. New items commonly sell before their cost is set up.
  const costMissing = history.length > 0 && totalCost <= 0;
  const marginPct =
    totalSales > 0 && !costMissing ? ((totalSales - totalCost) / totalSales) * 100 : null;
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
    unitCost: last ? rowUnitCost(last) : 0,
    costMissing,
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
