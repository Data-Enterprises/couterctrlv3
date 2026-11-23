// Interfaces

export type ModalMode = "presets" | "custom";

export type Preset = "batch" | "daily" | "saleTypes";

export type BatchColKey =
  | "upc"
  | "description"
  | "marginPct"
  | "avgSoldAt"
  | "listPrice"
  | "caseCost"
  | "totalQty"
  | "daysSold";

export type DailyColKey =
  | "date"
  | "saleType"
  | "qty"
  | "weight"
  | "revenue"
  | "cost"
  | "caseCost"
  | "listPrice"
  | "marginPct";

export interface ColDef {
  key: string;
  label: string;
  defaultOn: boolean;
}

export type SaleTypeColKey =
  | "upc"
  | "description"
  | "saleType"
  | "days"
  | "revenue"
  | "qty"
  | "weight"
  | "pctOfSales";

export interface SaleTypeRow {
  upc: string;
  description: string;
  saleType: string;
  days: number;
  revenue: number;
  qty: number;
  /** Null on an each-priced item, which has no weight to report. */
  weight: number | null;
  /** Null on the Sale row itself. */
  pctOfSales: number | null;
}

export interface BatchRow {
  upc: string;
  description: string;
  marginPct: number | null;
  avgSoldAt: number;
  listPrice: number;
  caseCost: number;
  totalQty: number;
  daysSold: number;
}
