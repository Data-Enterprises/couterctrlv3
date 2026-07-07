import type { TransactionOverview, UniqueCashier } from "../../interfaces";

export type CashierSeverity = "critical" | "watch" | "ok" | "ungraded";

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
  const trans     = stats.reduce((s, c) => s + c.trans, 0) / n;
  const qty       = stats.reduce((s, c) => s + c.qty, 0) / n;
  const sales     = stats.reduce((s, c) => s + c.sales, 0) / n;
  const avgTicket = stats.reduce((s, c) => s + (c.trans > 0 ? c.sales / c.trans : 0), 0) / n;
  return { trans, qty, sales, avgTicket };
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const isNoSaleType = (saleType: string) =>
  saleType.toLowerCase().replace(/[^a-z]/g, "") === "nosale";

/**
 * useAbs: compare |value| vs |avg| — required for dollar metrics on refund
 * types where both sides are negative.
 */
const makeMetric = (value: number, avg: number, useAbs = false): CashierMetric => {
  const v = useAbs ? Math.abs(value) : value;
  const a = useAbs ? Math.abs(avg)   : avg;
  const pct    = a !== 0 ? ((v - a) / a) * 100 : 0;
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
  const noSale     = isNoSaleType(saleType);
  const hasBaseline = baselineStats !== null && baselineStats.trans > 0;

  // Normalize baseline to per-week so it's on the same scale as the 1-week current period
  const bTrans     = hasBaseline ? Math.round(baselineStats!.trans / baselineWeeks) : 0;
  const bQty       = hasBaseline ? Math.round(baselineStats!.qty / baselineWeeks)   : 0;
  const bSales     = hasBaseline ? baselineStats!.sales / baselineWeeks : 0;
  const bAvgTicket = hasBaseline ? baselineStats!.sales / baselineStats!.trans : 0;

  const currentAvgTicket = currentStats.trans > 0 ? currentStats.sales / currentStats.trans : 0;

  const trans     = makeMetric(currentStats.trans,  bTrans,     false);
  const qty       = makeMetric(currentStats.qty,    bQty,       !noSale);
  const sales     = makeMetric(currentStats.sales,  bSales,     !noSale);
  const avgTicket = makeMetric(currentAvgTicket,    bAvgTicket, !noSale);

  // No Sale grades only trans + qty (2-metric scale)
  const gradedMetrics = noSale ? [trans, qty] : [trans, qty, sales, avgTicket];
  const passes = gradedMetrics.filter((m) => m.isPass).length;

  // No baseline → can't grade fairly, default to ok
  const severity: CashierSeverity = !hasBaseline
    ? "ungraded"
    : noSale
    ? passes === 2 ? "ok" : passes === 1 ? "watch" : "critical"
    : passes >= 3  ? "ok" : passes === 2 ? "watch" : "critical";

  return {
    cashier_number: currentStats.cashier_number,
    cashier_name:   currentStats.cashier_name,
    store_number:   currentStats.store_number,
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

const SEVERITY_RANK: Record<CashierSeverity, number> = { critical: 0, watch: 1, ok: 2, ungraded: 3 };

/**
 * currentOverviews: 7-day window (singleDate - 6 → singleDate)
 * baselineOverviews: prior 2-week window (singleDate - 20 → singleDate - 7)
 */
export const gradeAllCashiers = (
  currentOverviews: TransactionOverview[],
  baselineOverviews: TransactionOverview[],
  cashiers: UniqueCashier[],
  saleType: string,
): CashierGrade[] => {
  const currentStats  = buildCashierStats(currentOverviews, cashiers);
  const baselineStats = buildCashierStats(baselineOverviews, []);
  const baselineMap   = new Map(baselineStats.map((s) => [s.cashier_number, s]));

  return currentStats
    .map((s) => gradeCashier(s, baselineMap.get(s.cashier_number) ?? null, 2, saleType))
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
};
