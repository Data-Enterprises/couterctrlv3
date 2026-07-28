import type { CouponItem, Store } from "../../../interfaces";
import { formatDateSimple } from "../../../utils";
import type {
  CouponTier,
  CouponBreakdown,
  CouponMetric,
} from "../../../features/couponSalesSlice";
import { applyStoreNumberToName, numbersByStoreId } from "../../../utils/storeIdentity";

/**
 * Coupon Sales asks two questions about the average value of a single coupon,
 * and keeps them separate because they catch different stores:
 *
 *   TREND (the grade) — how does this week's average compare with the same
 *     store's own average over the prior two weeks? This is the LP model:
 *     pick a week-ending date, fetch end-20..end-7 as the baseline, and grade
 *     the movement. It catches a store that changed.
 *
 *   OUTLIER (a flag) — is the average simply above a flat dollar threshold,
 *     regardless of history? It catches a store that has been high all along
 *     and so looks flat to the trend.
 *
 * A store sitting at $8 for months is invisible to the trend and obvious to
 * the outlier flag; a store moving $1 to $2 is the reverse. Neither subsumes
 * the other, so rows carry both.
 *
 * Average is per coupon LINE (sum of coupon_amount / number of coupon rows),
 * so the dollar threshold reads literally: at $3, a store is flagged when its
 * typical single coupon is worth more than three dollars.
 *
 * Note there is no halving of the baseline the way LP halves its counts. LP
 * compares two weeks of totals against one; an average is already normalised
 * per coupon, so the two averages compare directly however many weeks or
 * coupons sit behind each.
 */
export const avgCouponAmount = (amount: number, lines: number): number =>
  lines > 0 ? amount / lines : 0;

// Coupon value + null-fallback handling lives in utils/couponValue — the
// Coupons page needs the identical rule, and the two must not drift.
// Re-exported so this module stays the single import for grading callers.
import {
  couponValueOf,
  usesFallbackValue,
  sumCouponAmount,
} from "../../../utils/couponValue";
export { couponValueOf, usesFallbackValue, sumCouponAmount };

/** Percentage move of this week's average against the baseline average.
 *  null when the group had no baseline activity to compare against — a new
 *  store or a new cashier is ungraded, not healthy. */
export const couponTrendPct = (
  avgNow: number,
  avgBaseline: number | null,
): number | null =>
  avgBaseline === null || avgBaseline === 0
    ? null
    : ((avgNow - avgBaseline) / avgBaseline) * 100;

/** Up is the bad direction in both modes: coupons getting larger — than the
 *  store's own recent norm under Trend, than a flat dollar line under Avg $.
 *
 *  Avg $ has no baseline and so has no ungraded state and no middle tier: a
 *  row is either over the line or it isn't, which is why that mode reads as
 *  two tiers where Trend reads as four. */
export const couponTier = (
  opts: GradingOptions,
  avgAmount: number,
  trendPct: number | null,
): CouponTier => {
  if (opts.metric === "avg") {
    return isCouponOutlier(avgAmount, opts.threshold) ? "critical" : "ok";
  }
  if (trendPct === null) return "ungraded";
  // Rounded to 1dp before comparing, the same rule Sales uses in
  // ledgerGradePct: 2.20 against 2.00 is 10.000000000000009 in floating point,
  // which would tip an exactly-at-threshold row into critical.
  const pct = Math.round(trendPct * 10) / 10;
  if (pct > opts.trendThreshold) return "critical";
  if (pct > 0) return "watch";
  return "ok";
};

/** The flat-dollar outlier flag, independent of the trend grade. */
export const isCouponOutlier = (avg: number, threshold: number): boolean =>
  avg > threshold;

export const TIER_RANK: Record<CouponTier, number> = {
  critical: 0,
  watch: 1,
  ok: 2,
  ungraded: 3,
};

export const couponDotClass: Record<CouponTier, string> = {
  critical: "bg-red-500",
  watch: "bg-amber-500",
  ok: "bg-emerald-500",
  ungraded: "bg-gray-300",
};

/** Solid header tint for the detail panel, mirroring severityHeaderBgClass —
 *  LP and Sales both announce the selected row's grade in the panel header
 *  rather than leaving it flat navy. */
export const couponHeaderBgClass: Record<CouponTier, string> = {
  critical: "bg-red-600",
  watch: "bg-amber-500",
  ok: "bg-emerald-600",
  ungraded: "bg-[#1e2a4a]",
};

export const couponPillClass: Record<CouponTier, string> = {
  critical: "bg-severity_critical_bg text-severity_critical_text",
  watch: "bg-severity_watch_bg text-severity_watch_text",
  ok: "bg-severity_healthy_bg text-severity_healthy_text",
  ungraded: "bg-gray-100 text-gray-400",
};

/** One graded row, whatever it's grouped by. Stores, sub departments, dates
 *  and cashiers all reduce to this so the list rendering is shared. */
export type CouponRow = {
  /** Stable identity for selection and React keys. */
  key: string;
  label: string;
  /** Present on store rows only — needed to scope co-located locations. */
  storeid?: number;
  store_number?: string;
  amount: number;
  qty: number;
  /** Coupon line count. The denominator behind avgAmount. */
  lines: number;
  /** Distinct sale_id — shown, never used as the average's basis. */
  transactions: number;
  avgAmount: number;
  /** The same group's average across the two baseline weeks, or null when it
   *  had no coupons then. */
  avgBaseline: number | null;
  /** Percentage move of avgAmount against avgBaseline; null when ungraded. */
  trendPct: number | null;
  /** Flat-dollar flag, independent of tier. See the module header. */
  isOutlier: boolean;
  tier: CouponTier;
};

export type CouponTotals = {
  amount: number;
  qty: number;
  lines: number;
  transactions: number;
  avgAmount: number;
};

export const emptyTotals: CouponTotals = {
  amount: 0,
  qty: 0,
  lines: 0,
  transactions: 0,
  avgAmount: 0,
};

export const totalsFor = (rows: CouponItem[]): CouponTotals => {
  // sumCouponAmount handles the transaction-level coupon fallback.
  const amount = sumCouponAmount(rows);
  const qty = rows.reduce((acc, r) => acc + r.qty, 0);
  const transactions = new Set(rows.map((r) => r.sale_id)).size;
  return {
    amount,
    qty,
    lines: rows.length,
    transactions,
    avgAmount: avgCouponAmount(amount, rows.length),
  };
};

/** Worst first: critical above ok, then by how far over the line they sit.
 *  The list is a work queue, so the row needing attention is always on top. */
/** Worst first, by whichever question is being asked. Under Avg $ the move
 *  against the baseline is not what the user is looking at, so ordering by it
 *  would shuffle rows for a reason the screen doesn't show. */
export const sortCouponRows = (
  rows: CouponRow[],
  metric: CouponMetric = "trend",
): CouponRow[] =>
  [...rows].sort((a, b) => {
    const byTier = TIER_RANK[a.tier] - TIER_RANK[b.tier];
    if (byTier !== 0) return byTier;
    if (metric === "avg") return b.avgAmount - a.avgAmount;
    // Bigger move first; ungraded rows have no move, so they fall back to the
    // outlier flag and then the raw average.
    return (
      (b.trendPct ?? -Infinity) - (a.trendPct ?? -Infinity) ||
      Number(b.isOutlier) - Number(a.isOutlier) ||
      b.avgAmount - a.avgAmount
    );
  });

/** Generic group-and-grade. Every breakdown routes through this so a change to
 *  the grading rule lands everywhere at once. */
export type GradingOptions = {
  /** Which question is being graded — see CouponMetric. */
  metric: CouponMetric;
  /** Flat-dollar outlier threshold. Grades under Avg $; drives the badge
   *  under Trend. */
  threshold: number;
  /** Percentage move that tips a row into critical. */
  trendThreshold: number;
  /** Prior two weeks. Omit for an ungraded list. */
  baseline?: CouponItem[];
};

const buildRows = (
  coupons: CouponItem[],
  opts: GradingOptions,
  keyOf: (c: CouponItem) => string,
  labelOf: (c: CouponItem) => string,
  decorate?: (c: CouponItem) => Partial<CouponRow>,
  /** How a baseline row maps onto a current row's key. Defaults to keyOf,
   *  which is right for stores, sub departments and cashiers — their keys mean
   *  the same thing in both windows. Dates are the exception: no baseline date
   *  equals a current date, so the date breakdown matches on WEEKDAY instead
   *  (this Tuesday against the baseline Tuesdays), the same day-matched rule
   *  LP's day cards use. Without this the whole date tab would be ungraded. */
  baselineKeyOf: (c: CouponItem) => string = keyOf,
  /** The baseline key a current row looks itself up under. Defaults to the
   *  row's own key, and only differs where baselineKeyOf does. */
  lookupKeyOf: (c: CouponItem) => string = keyOf,
): CouponRow[] => {
  const groups = new Map<string, { label: string; rows: CouponItem[]; sample: CouponItem }>();
  for (const c of coupons) {
    const key = keyOf(c);
    const existing = groups.get(key);
    if (existing) existing.rows.push(c);
    else groups.set(key, { label: labelOf(c), rows: [c], sample: c });
  }

  // Baseline averages, bucketed the same way the current rows are so a lookup
  // is a single map hit rather than a scan per row.
  const baselineAvg = new Map<string, number>();
  if (opts.baseline?.length) {
    const bGroups = new Map<string, CouponItem[]>();
    for (const c of opts.baseline) {
      const key = baselineKeyOf(c);
      const bucket = bGroups.get(key);
      if (bucket) bucket.push(c);
      else bGroups.set(key, [c]);
    }
    for (const [key, rows] of bGroups) {
      baselineAvg.set(key, avgCouponAmount(sumCouponAmount(rows), rows.length));
    }
  }

  return sortCouponRows(
    [...groups.entries()].map(([key, { label, rows, sample }]) => {
      const t = totalsFor(rows);
      const avgBaseline = baselineAvg.get(lookupKeyOf(sample)) ?? null;
      const trendPct = couponTrendPct(t.avgAmount, avgBaseline);
      return {
        key,
        label,
        amount: t.amount,
        qty: t.qty,
        lines: t.lines,
        transactions: t.transactions,
        avgAmount: t.avgAmount,
        avgBaseline,
        trendPct,
        isOutlier: isCouponOutlier(t.avgAmount, opts.threshold),
        tier: couponTier(opts, t.avgAmount, trendPct),
        ...(decorate ? decorate(sample) : {}),
      };
    }),
    opts.metric,
  );
};

/** Weekday key for date matching — see baselineKeyOf above. */
const weekdayKeyOf = (c: CouponItem): string =>
  String(new Date(c.sale_date.split("T")[0] + "T12:00:00").getDay());

/** Keyed on storeid + store_number: a few storeids cover two physical
 *  locations, and merging them would average two different operations
 *  together. See utils/storeIdentity. */
export const storeKeyOf = (c: CouponItem): string =>
  `${c.storeid}__${c.store_number}`;

export const buildStoreRows = (
  coupons: CouponItem[],
  opts: GradingOptions,
  assignedStores: Store[] = [],
  // Group searches can return stores the user isn't individually assigned to,
  // so the name has to fall through to the group list before the API row —
  // the same chain CouponListPanel walks.
  groupStores: Store[] = [],
): CouponRow[] => {
  const numbersById = numbersByStoreId(
    coupons,
    (c) => c.storeid,
    (c) => c.store_number,
  );
  return buildRows(
    coupons,
    opts,
    storeKeyOf,
    (c) =>
      // assignedStores is the source of truth for names, and it resolves by
      // storeid — so co-located locations come back identical and the embedded
      // number has to be rewritten to match the row.
      applyStoreNumberToName(
        assignedStores.find((s) => s.storeid === c.storeid)?.store_name ??
          groupStores.find((s) => s.storeid === c.storeid)?.store_name ??
          c.store_name,
        c.store_number,
        numbersById[c.storeid] ?? [],
      ),
    (c) => ({ storeid: c.storeid, store_number: c.store_number }),
  );
};

// Keyed on the DESCRIPTION, not the id — that is what the Coupons page groups
// on (CouponDetailPanel allSections.subdept), and the two pages have to bucket
// identically or their sub dept counts drift apart wherever two ids share a
// description.
export const subDeptKeyOf = (c: CouponItem): string =>
  c.sub_department_description || `Sub dept ${c.sub_department}`;

export const buildSubDeptRows = (coupons: CouponItem[], opts: GradingOptions) =>
  buildRows(coupons, opts, subDeptKeyOf, subDeptKeyOf);

export const buildDateRows = (coupons: CouponItem[], opts: GradingOptions) =>
  buildRows(
    coupons,
    opts,
    // Key stays ISO — it's what sectionKeyOf matches on, and it sorts
    // chronologically. Only the label is localised.
    (c) => c.sale_date.split("T")[0],
    (c) => formatDateSimple(c.sale_date),
    undefined,
    // Day-matched: this Tuesday against the baseline Tuesdays.
    weekdayKeyOf,
    weekdayKeyOf,
  );

// Also keyed on the name, matching Coupons. Express tills in particular share
// one name across several cashier numbers, so keying on the number would split
// one row there into several here.
export const cashierKeyOf = (c: CouponItem): string =>
  c.cashier_name || "unknown";

export const buildCashierRows = (coupons: CouponItem[], opts: GradingOptions) =>
  buildRows(coupons, opts, cashierKeyOf, (c) =>
    c.cashier_name || "Unknown cashier",
  );

export const buildBreakdownRows = (
  coupons: CouponItem[],
  opts: GradingOptions,
  breakdown: CouponBreakdown,
): CouponRow[] => {
  if (breakdown === "cashier") return buildCashierRows(coupons, opts);
  return buildSubDeptRows(coupons, opts);
};

/** The section key a coupon row belongs to under a given breakdown — used to
 *  filter down to the selected sub dept / date / cashier. */
export const sectionKeyOf = (
  c: CouponItem,
  breakdown: CouponBreakdown,
): string => {
  if (breakdown === "cashier") return cashierKeyOf(c);
  return subDeptKeyOf(c);
};

/** One row per transaction, for the drill-in beneath a selected section. */
export type CouponTransaction = {
  sale_id: number;
  /** MM/DD/YYYY for display. */
  sale_date: string;
  /** Untouched ISO value — the receipt fetch needs the real date, not the
   *  localised one. */
  rawSaleDate: string;
  storeid: number;
  cashier_name: string;
  cashier_number: number;
  terminal: string;
  amount: number;
  qty: number;
  lines: number;
  avgAmount: number;
  tier: CouponTier;
  items: CouponItem[];
};

/** Transactions are graded on the flat-dollar OUTLIER rule, not the trend.
 *  A single sale has no history of its own to move against — "this receipt
 *  versus its own prior two weeks" is not a question that means anything — so
 *  the only sensible read at this level is whether the coupon coming off it
 *  was unusually large. */
export const buildTransactions = (
  coupons: CouponItem[],
  threshold: number,
): CouponTransaction[] => {
  const groups = new Map<number, CouponItem[]>();
  for (const c of coupons) {
    const existing = groups.get(c.sale_id);
    if (existing) existing.push(c);
    else groups.set(c.sale_id, [c]);
  }

  return [...groups.entries()]
    .map(([sale_id, items]) => {
      const t = totalsFor(items);
      const head = items[0];
      return {
        sale_id,
        sale_date: formatDateSimple(head.sale_date),
        rawSaleDate: head.sale_date,
        storeid: head.storeid,
        cashier_name: head.cashier_name,
        cashier_number: head.cashier_number,
        terminal: head.terminal,
        amount: t.amount,
        qty: t.qty,
        lines: t.lines,
        avgAmount: t.avgAmount,
        tier: (isCouponOutlier(t.avgAmount, threshold) ? "critical" : "ok") as CouponTier,
        items: [...items].sort((a, b) => a.line_number - b.line_number),
      };
    })
    .sort(
      (a, b) =>
        TIER_RANK[a.tier] - TIER_RANK[b.tier] || b.avgAmount - a.avgAmount,
    );
};
