// Interfaces

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

export interface TrendResult {
  /** Priced units — pounds on a scale item, whose qty is always 0. */
  firstHalfUnits: number;
  secondHalfUnits: number;
  isSlowing: boolean;
}

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
