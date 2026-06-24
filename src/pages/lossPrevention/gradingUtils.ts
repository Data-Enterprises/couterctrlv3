import type { TransactionOverview, UniqueCashier } from "../../interfaces";

export type CashierSeverity = "critical" | "watch" | "ok";

export interface CashierMetric {
  value: number;
  avg: number;
  /** (value - avg) / avg * 100 — display only, not used for pass/fail */
  pct: number;
  /** true when value < avg (below = good for LP exceptions) */
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
      existing.qty   += o.qty ?? 0;
      existing.sales += o.total_sales;
    } else {
      map.set(o.cashier_number, {
        cashier_number: o.cashier_number,
        cashier_name:   o.cashier_name,
        store_number:   o.store_number,
        trans: 1,
        qty:   o.qty ?? 0,
        sales: o.total_sales,
      });
    }
  }

  // Fall back to cashiers array for any cashier not in transOverviews
  for (const c of cashiers) {
    if (!map.has(c.cashier_number)) {
      map.set(c.cashier_number, {
        cashier_number: c.cashier_number,
        cashier_name:   c.cashier_name,
        store_number:   c.store_number,
        trans: c.transaction_count,
        qty:   0,
        sales: c.total_sales,
      });
    }
  }

  return Array.from(map.values());
};

// ── Step 2: mean of each metric across all cashiers ─────────────────────────

export const computePeerAverages = (stats: RawCashierStats[]): PeerAverages => {
  if (stats.length === 0) return { trans: 0, qty: 0, sales: 0, avgTicket: 0 };

  const n = stats.length;
  const trans    = stats.reduce((s, c) => s + c.trans, 0) / n;
  const qty      = stats.reduce((s, c) => s + c.qty,   0) / n;
  const sales    = stats.reduce((s, c) => s + c.sales, 0) / n;
  const avgTicket = stats.reduce((s, c) => s + (c.trans > 0 ? c.sales / c.trans : 0), 0) / n;

  return { trans, qty, sales, avgTicket };
};

// ── Step 3: grade one cashier against peer averages ─────────────────────────

const makeMetric = (value: number, avg: number): CashierMetric => {
  const pct    = avg !== 0 ? ((value - avg) / avg) * 100 : 0;
  const isPass = value < avg;
  return { value, avg, pct, isPass };
};

export const gradeCashier = (
  stats: RawCashierStats,
  avgs: PeerAverages,
): CashierGrade => {
  const cashierAvgTicket = stats.trans > 0 ? stats.sales / stats.trans : 0;

  const trans     = makeMetric(stats.trans,          avgs.trans);
  const qty       = makeMetric(stats.qty,            avgs.qty);
  const sales     = makeMetric(stats.sales,          avgs.sales);
  const avgTicket = makeMetric(cashierAvgTicket,     avgs.avgTicket);

  const passes = [trans, qty, sales, avgTicket].filter((m) => m.isPass).length;

  const severity: CashierSeverity =
    passes >= 3 ? "ok" :
    passes === 2 ? "watch" :
    "critical";

  return {
    cashier_number: stats.cashier_number,
    cashier_name:   stats.cashier_name,
    store_number:   stats.store_number,
    trans,
    qty,
    sales,
    avgTicket,
    passes,
    severity,
  };
};

// ── Convenience: grade all cashiers, sorted Critical → Watch → OK ───────────

const SEVERITY_RANK: Record<CashierSeverity, number> = { critical: 0, watch: 1, ok: 2 };

export const gradeAllCashiers = (
  transOverviews: TransactionOverview[],
  cashiers: UniqueCashier[],
): CashierGrade[] => {
  const stats = buildCashierStats(transOverviews, cashiers);
  const avgs  = computePeerAverages(stats);
  return stats
    .map((s) => gradeCashier(s, avgs))
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
};
