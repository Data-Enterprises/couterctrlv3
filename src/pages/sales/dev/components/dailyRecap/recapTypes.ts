/**
 * The shapes the Daily recap tab passes between its pieces.
 *
 * A recap is a summary, not a verdict: nothing here carries a grade, a
 * threshold or a comparison period. Every figure is this week's, for one
 * store location.
 */

/** One day's row: the day card's own figures plus what Hourly adds. */
export interface RecapDay {
  /** yyyy-mm-dd */
  date: string;
  /** The day card's net sales. Fuel, lottery and cash are already out. */
  net: number;
  /** The day card's units. */
  units: number;
  /** Pounds sold across the counted sub depts. 0 where nothing is weighed. */
  pounds: number;
  /** Baskets, as the Hourly tab counts them: summed across the day's hours. */
  transactions: number;
  /** The hour that took the most net sales, or null with no hourly rows. */
  peakHour: number | null;
  /** False for a day the store has no sales row for at all. */
  hasSales: boolean;
}

/** The week's totals row. Every figure is the sum of the day rows above it. */
export interface RecapWeek {
  net: number;
  units: number;
  pounds: number;
  transactions: number;
  /** The single busiest day-and-hour of the week. */
  peak: { date: string; hour: number } | null;
}

/** One sub department on one day. */
export interface RecapSubDept {
  id: number;
  name: string;
  net: number;
  units: number;
  pounds: number;
  /** Share of the day's counted sub depts, 0–100. */
  share: number;
}

/** A sub department the store leaves out of its net sales (fuel, lottery). */
export interface RecapLeftOut {
  name: string;
  net: number;
}

/** One item on one day, every row of it folded together. */
export interface RecapItem {
  code: string;
  name: string;
  subDeptId: number;
  subDeptName: string;
  units: number;
  pounds: number;
  net: number;
}

/** Where one day's item rows are. */
export type DayItemsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; items: RecapItem[] };
