// Interfaces

export interface WindowTotals {
  revenue: number;
  /** Priced units — pounds on a scale item. */
  units: number;
  cost: number;
  /** Days that actually sold, not days in the window: every per-day average
   *  divides by this. */
  sellingDays: number;
  /** Days in the window, selling or not. */
  windowDays: number;
  /** A cost was on file for at least one day. */
  hasCost: boolean;
}
