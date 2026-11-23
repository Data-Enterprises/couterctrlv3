// Interfaces
import type { Severity } from "../../../../../utils/severity";

/** One hour's figures in this week, summed over the days in play. */
export interface HourDetail {
  v: number;
  gross: number;
  tax: number;
  qty: number;
  basket: number;
  avgPrice: number;
  n: number;
}

/** One hour across the three periods: this week's figure and its changes. */
export interface HourRow {
  hour: number;
  tw: number;
  detail: HourDetail | undefined;
  lwPct: number | null;
  lyPct: number | null;
}

/** An hour as the Hours list draws it, graded on the category's basis. */
export interface HourListRow {
  key: string;
  label: string;
  value: number;
  lp: number | null;
  yp: number | null;
  shownPct: number | null;
  sev: Severity | null;
}
