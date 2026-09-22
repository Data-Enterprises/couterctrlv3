import type {
  TransactionOverview,
  UniqueCashier,
  CashierDetails,
} from "../../interfaces";
import type { Severity } from "../../utils/severity";
// Re-exported so LP's existing imports keep working; the helper itself is
// shared with Cashiers now. See utils/saleTypes.
export { pickDefaultSaleType } from "../../utils/saleTypes";

export type CashierSeverity = "critical" | "watch" | "ok" | "ungraded";

// ── Week date range (LPStorePanel + LPTransactionPanel header/export) ──────
// search.singleDate is the searched week-ending date ("m/d/yyyy") — the week
// always runs the 6 days before it through singleDate itself, matching
// LPDesktop's own start/end math for the API fetch. search.startDate/endDate
// belong to a different (multi-date-picker) search flow and are never set
// by LP's single-date search — don't read them for this.

export const weekStartDate = (singleDate: string): string => {
  const [m, d, y] = singleDate.split("/").map(Number);
  const end = new Date(y, m - 1, d);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  return `${start.getMonth() + 1}/${start.getDate()}/${start.getFullYear()}`;
};

const fmtRangePart = (mdy: string, withYear = false) => {
  const [m, d, y] = mdy.split("/");
  return withYear ? `${+m}/${+d}/${y}` : `${+m}/${+d}`;
};

export const weekRangeLabel = (singleDate: string): string =>
  `${fmtRangePart(weekStartDate(singleDate))} – ${fmtRangePart(singleDate, true)}`;

export const weekRangeFilename = (singleDate: string): string =>
  `${weekStartDate(singleDate)}–${singleDate}`;

// ── Store-level severity (LPStorePanel + LPTransactionPanel header) ─────────

export const isNoDollarType = (saleType: string) =>
  saleType.toLowerCase().replace(/[^a-z]/g, "") === "nosale";

export const storeSeverity = (
  detail: CashierDetails,
  baselineDetails: CashierDetails[],
  saleType: string,
): Severity => {
  const b = baselineDetails.find((x) => x.storeid === detail.storeid);
  if (!b) return "healthy"; // no baseline = can't grade

  const bTrans = b.transaction_count / 2;
  const bItems = b.total_items / 2;
  const bAmount = Math.abs(b.amount) / 2;
  const bAvg = Math.abs(b.average_dollars);

  if (isNoDollarType(saleType)) {
    const score = [
      detail.transaction_count <= bTrans,
      detail.total_items <= bItems,
    ].filter(Boolean).length;
    if (score === 2) return "healthy";
    if (score === 1) return "watch";
    return "critical";
  }

  const score = [
    detail.transaction_count <= bTrans,
    detail.total_items <= bItems,
    Math.abs(detail.amount) <= bAmount,
    Math.abs(detail.average_dollars) <= bAvg,
  ].filter(Boolean).length;
  if (score >= 3) return "healthy";
  if (score === 2) return "watch";
  return "critical";
};

// Exception counts are "worse" when they rise vs baseline — direction-based,
// not threshold-graded like Sales' vsLY/vsLW pills.
export const directionalPillClass = (pct: number) =>
  pct > 0
    ? "bg-severity_critical_bg text-severity_critical_text"
    : "bg-severity_healthy_bg text-severity_healthy_text";

// Pass/fail chip colour for the Store and Cashier rows on LP mobile. Literal
// Tailwind shades rather than the CSS-variable severity_* tokens above, which
// is the mobile dev convention.
export const passFailChipClass = (isPass: boolean | null): string => {
  // Soft fill with dark text, the same register every other graded pill uses
  // (Sales, Sub Dept Margins, Vendors, Categories). The saturated fill with
  // white text this used to return was the only place in the app shouting a
  // pass/fail at full strength, and on a row of four chips it read as an alarm
  // rather than a grade.
  if (isPass === null) return "bg-gray-100 text-gray-500";
  return isPass ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800";
};

// Trend pill for the KPI strips — the same soft fill and dark text
// `passFailChipClass` gives the Store and Cashier rows, so a strip and the rows
// beneath it read as one grading scale rather than two. It was a saturated
// tint-on-tint before, which made the strip look like a different system.
//
// Up is worse here: LP grades exceptions, where staying under the baseline is
// the good outcome.
export const trendPillClass = (pct: number): string =>
  pct > 0 ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800";

export interface CashierMetric {
  value: number;
  avg: number;
  /** (value - avg) / avg * 100 — display only, not used for pass/fail */
  pct: number;
  /** true when value ≤ baseline (below = good for LP exceptions) */
  isPass: boolean;
}

export interface CashierGrade {
  cashier_number: number;
  cashier_name: string;
  store_number: string;
  trans: CashierMetric;
  qty: CashierMetric;
  sales: CashierMetric;
  avgTicket: CashierMetric;
  passes: number;
  severity: CashierSeverity;
  /** false when cashier had no activity in the baseline period — grade is unreliable */
  hasBaseline: boolean;
}

export interface PeerAverages {
  trans: number;
  qty: number;
  sales: number;
  avgTicket: number;
}

// ── Step 1: aggregate transOverviews into per-cashier stats ─────────────────

interface RawCashierStats {
  cashier_number: number;
  cashier_name: string;
  store_number: string;
  trans: number;
  qty: number;
  sales: number;
}

export const buildCashierStats = (
  transOverviews: TransactionOverview[],
  cashiers: UniqueCashier[],
): RawCashierStats[] => {
  const map = new Map<number, RawCashierStats>();

  for (const o of transOverviews) {
    const existing = map.get(o.cashier_number);
    if (existing) {
      existing.trans += 1;
      existing.qty += o.qty ?? 0;
      existing.sales += o.total_sales;
    } else {
      map.set(o.cashier_number, {
        cashier_number: o.cashier_number,
        cashier_name: o.cashier_name,
        store_number: o.store_number,
        trans: 1,
        qty: o.qty ?? 0,
        sales: o.total_sales,
      });
    }
  }

  // Fall back to cashiers array for any cashier not in transOverviews
  for (const c of cashiers) {
    if (!map.has(c.cashier_number)) {
      map.set(c.cashier_number, {
        cashier_number: c.cashier_number,
        cashier_name: c.cashier_name,
        store_number: c.store_number,
        trans: c.transaction_count,
        qty: 0,
        sales: c.total_sales,
      });
    }
  }

  return Array.from(map.values());
};

// ── Kept for display/context use (peer comparison on UI) ────────────────────

export const computePeerAverages = (stats: RawCashierStats[]): PeerAverages => {
  if (stats.length === 0) return { trans: 0, qty: 0, sales: 0, avgTicket: 0 };
  const n = stats.length;
  const trans = stats.reduce((s, c) => s + c.trans, 0) / n;
  const qty = stats.reduce((s, c) => s + c.qty, 0) / n;
  const sales = stats.reduce((s, c) => s + c.sales, 0) / n;
  const avgTicket =
    stats.reduce((s, c) => s + (c.trans > 0 ? c.sales / c.trans : 0), 0) / n;
  return { trans, qty, sales, avgTicket };
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const isNoSaleType = (saleType: string) =>
  saleType.toLowerCase().replace(/[^a-z]/g, "") === "nosale";

/**
 * useAbs: compare |value| vs |avg| — required for dollar metrics on refund
 * types where both sides are negative.
 */
const makeMetric = (
  value: number,
  avg: number,
  useAbs = false,
): CashierMetric => {
  const v = useAbs ? Math.abs(value) : value;
  const a = useAbs ? Math.abs(avg) : avg;
  const pct = a !== 0 ? ((v - a) / a) * 100 : 0;
  const isPass = v <= a;
  return { value, avg, pct, isPass };
};

// ── Step 3: grade one cashier against their own baseline ─────────────────────

export const gradeCashier = (
  currentStats: RawCashierStats,
  baselineStats: RawCashierStats | null,
  baselineWeeks: number,
  saleType: string,
): CashierGrade => {
  const noSale = isNoSaleType(saleType);
  const hasBaseline = baselineStats !== null && baselineStats.trans > 0;

  // Normalize baseline to per-week so it's on the same scale as the 1-week current period
  const bTrans = hasBaseline
    ? Math.round(baselineStats!.trans / baselineWeeks)
    : 0;
  const bQty = hasBaseline ? Math.round(baselineStats!.qty / baselineWeeks) : 0;
  const bSales = hasBaseline ? baselineStats!.sales / baselineWeeks : 0;
  const bAvgTicket = hasBaseline
    ? baselineStats!.sales / baselineStats!.trans
    : 0;

  const currentAvgTicket =
    currentStats.trans > 0 ? currentStats.sales / currentStats.trans : 0;

  const trans = makeMetric(currentStats.trans, bTrans, false);
  const qty = makeMetric(currentStats.qty, bQty, !noSale);
  const sales = makeMetric(currentStats.sales, bSales, !noSale);
  const avgTicket = makeMetric(currentAvgTicket, bAvgTicket, !noSale);

  // No Sale grades only trans + qty (2-metric scale)
  const gradedMetrics = noSale ? [trans, qty] : [trans, qty, sales, avgTicket];
  const passes = gradedMetrics.filter((m) => m.isPass).length;

  // No baseline → can't grade fairly, default to ok
  const severity: CashierSeverity = !hasBaseline
    ? "ungraded"
    : noSale
      ? passes === 2
        ? "ok"
        : passes === 1
          ? "watch"
          : "critical"
      : passes >= 3
        ? "ok"
        : passes === 2
          ? "watch"
          : "critical";

  return {
    cashier_number: currentStats.cashier_number,
    cashier_name: currentStats.cashier_name,
    store_number: currentStats.store_number,
    trans,
    qty,
    sales,
    avgTicket,
    passes,
    severity,
    hasBaseline,
  };
};

// ── Convenience: grade all cashiers, sorted Critical → Watch → OK ────────────

const SEVERITY_RANK: Record<CashierSeverity, number> = {
  critical: 0,
  watch: 1,
  ok: 2,
  ungraded: 3,
};

/** YYYY-MM-DD → weekday index, parsed as UTC so the day can't shift by one for
 *  anyone west of Greenwich. */
export const weekdayOf = (isoDate: string): number => {
  const [y, m, d] = isoDate.split("T")[0].split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

/**
 * Narrow a baseline to the same weekday as the selected day, and report how
 * many of that weekday it actually contains.
 *
 * Refund volume is wildly weekday-dependent — a Saturday out-trades a Tuesday
 * by a mile — so a single Thursday has to be judged against the *other
 * Thursdays* in the baseline, not against a flat daily average. Comparing a
 * Saturday to an average day would flag every Saturday and excuse every
 * Tuesday.
 *
 * The divisor is counted from the data rather than assumed to be 2: a store
 * closed on one of those days, or a short baseline window, should divide by
 * what is actually there. Zero matches leaves the cashier ungraded, which
 * gradeCashier already handles — a missing baseline is not a zero baseline.
 */
export const matchWeekday = (
  baselineOverviews: TransactionOverview[],
  isoDate: string,
): { overviews: TransactionOverview[]; periods: number } => {
  const target = weekdayOf(isoDate);
  const overviews = baselineOverviews.filter(
    (o) => weekdayOf(o.sale_date) === target,
  );
  const periods = new Set(overviews.map((o) => o.sale_date.split("T")[0])).size;
  return { overviews, periods };
};

/**
 * currentOverviews: 7-day window (singleDate - 6 → singleDate)
 * baselineOverviews: prior 2-week window (singleDate - 20 → singleDate - 7)
 * baselinePeriods: how many current-length periods the baseline spans, so the
 *   two sides are on the same scale. 2 for the default week view; for a single
 *   day it is the number of matching weekdays found — see matchWeekday.
 */
export const gradeAllCashiers = (
  currentOverviews: TransactionOverview[],
  baselineOverviews: TransactionOverview[],
  cashiers: UniqueCashier[],
  saleType: string,
  baselinePeriods = 2,
): CashierGrade[] => {
  const currentStats = buildCashierStats(currentOverviews, cashiers);
  const baselineStats = buildCashierStats(baselineOverviews, []);
  const baselineMap = new Map(baselineStats.map((s) => [s.cashier_number, s]));

  return currentStats
    .map((s) =>
      gradeCashier(
        s,
        baselineMap.get(s.cashier_number) ?? null,
        Math.max(baselinePeriods, 1),
        saleType,
      ),
    )
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
};
