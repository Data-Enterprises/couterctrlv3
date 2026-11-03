/**
 * The shapes the Daily recap tab passes between its pieces.
 *
 * A recap is a summary, not a verdict: nothing here carries a grade, a
 * threshold or a comparison period. Every figure is this week's, for one
 * store location.
 */

/** One hour of one day. */
export interface RecapHour {
  hour: number;
  net: number;
}

/** A day's hours, from the first that traded to the last, gaps filled at 0. */
export interface RecapDayHours {
  hours: RecapHour[];
  /** The hour that took the most net sales. */
  peak: RecapHour | null;
  /** The slowest FULL hour: the first and last trading hours are part-hours
   *  (opening and closing), so they are never the answer. Null with fewer
   *  than three trading hours. */
  slowest: RecapHour | null;
  /** First and last trading hour, or null on a day with no hourly rows. */
  first: number | null;
  last: number | null;
}

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
  hours: RecapDayHours;
  /** False for a day the store has no sales row for at all. */
  hasSales: boolean;
}

/** The week's headline figures. Every one is the day rows summed. */
export interface RecapWeek {
  net: number;
  units: number;
  pounds: number;
  transactions: number;
  /** Days with a sales row. */
  tradingDays: number;
  /** The single busiest day-and-hour of the week. */
  peak: { date: string; hour: number } | null;
}

/** A sub department the store leaves out of its net sales (fuel, lottery). */
export interface RecapLeftOut {
  name: string;
  net: number;
}

/** A day's money: net sales and the tax on top of it. */
export interface RecapMoney {
  /** Net sales plus tax: what the registers took in. */
  withTax: number;
  tax: number;
  /** The day card's net sales. */
  net: number;
  leftOut: RecapLeftOut[];
}

/** What the day's item rows say that nothing else in the panel does. */
export interface RecapMix {
  refunds: { units: number; net: number };
  /** Net sales by price type. `unknown` is a row with no price type at all,
   *  which is never counted as regular. */
  regular: number;
  promo: number;
  unknown: number;
}

/** Where one day's mix is. */
export type DayMixState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; mix: RecapMix };

/** One item on one day, every row of it folded together. For the export. */
export interface RecapItem {
  code: string;
  name: string;
  subDeptId: number;
  subDeptName: string;
  units: number;
  pounds: number;
  net: number;
}
