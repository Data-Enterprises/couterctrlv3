// Interfaces
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

/** Sortable columns. Total $ / Avg $ only render when the sale type carries
 *  an amount, but naming them here costs nothing and keeps the union whole. */
export type LpSortCol = "trans" | "qty" | "amount" | "avg";
