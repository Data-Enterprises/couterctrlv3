// Interfaces
import type { Severity } from "../../../components/LedgerRow";

/** One hour in the left list: this week, last week, last year. */
export type HourRow = {
  hour: number;
  tw: number;
  lw: number;
  ly: number;
  trans: number;
  lwTrans: number;
  lyTrans: number;
  qty: number;
  lwQty: number;
  lyQty: number;
  vsLWPct: number;
  vsLYPct: number;
  vsLWQtyPct: number;
  vsLYQtyPct: number;
  hasLW: boolean;
  hasLY: boolean;
};

export type HourSortColumn = "ty" | "vsLW" | "vsLY";
export type HourSortState = {
  column: HourSortColumn;
  direction: "desc" | "asc";
} | null;

/** The insight line under the open hour. */
export type HourCta = { text: string; severity: Severity | null };

/** One day on the hour's week chart. */
export type WeekHourDay = { label: string; tw: number; lw: number; ly: number };
