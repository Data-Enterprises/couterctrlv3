/**
 * The shapes the Summary tab passes between its pieces.
 *
 * A summary, not a verdict: nothing here carries a grade, a threshold or a
 * comparison period. Every figure is this week's, or one day of it, for one
 * store location.
 */

/** One hour of one day. */
export interface RecapHour {
  hour: number;
  net: number;
  transactions: number;
  qty: number;
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

/**
 * One day, or the whole week: the period Summary is showing.
 *
 * A day is the day card's own figures plus what Hourly adds; the week is the
 * seven of them combined (see recapDays.weekOf), so every card reads either
 * the same way.
 */
export interface RecapDay {
  /** yyyy-mm-dd: the day, or the week's first day. */
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
  /** Hours traded, first sale's hour to last: for the week, every day's added
   *  up, so "per hour" means per hour the store was actually trading. */
  tradedHours: number;
  /** False for a day the store has no sales row for at all (for the week,
   *  false only if no day has one). */
  hasSales: boolean;
}

/** A day's money: net sales and the tax on top of it. */
export interface RecapMoney {
  /** Net sales plus tax: what the registers took in. */
  withTax: number;
  tax: number;
  /** The day card's net sales. */
  net: number;
}

/** What the day's item rows say that nothing else in the panel does. */
export interface RecapMix {
  /** How many different items sold that day (product codes, refunds aside). */
  items: number;
  /** Those items' codes, so a week's distinct count can be the days merged:
   *  an item sold on five days is one item for the week, not five. */
  codes: string[];
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

/** One vendor's part of an item's day. */
export interface RecapVendorPart {
  /** The vendor's name, or NO_VENDOR for rows that carry none. */
  vendor: string;
  units: number;
  pounds: number;
  net: number;
}

/**
 * One item on one day, every row of it folded together: for the Items Sold
 * export, and for Summary's item view.
 */
export interface RecapItem {
  code: string;
  name: string;
  subDeptId: number;
  subDeptName: string;
  units: number;
  pounds: number;
  net: number;
  /** The same day split by vendor, biggest net first, so the item view can
   *  filter by vendor and count only that vendor's share. Sums to the item. */
  vendors: RecapVendorPart[];
}

/** Where one day's items are, for the item view. */
export type DayItemsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; items: RecapItem[] };

/** One line of the item view: an item over the period, under its filters. */
export interface RecapItemRow {
  code: string;
  name: string;
  subDeptName: string;
  /** The vendor that sold the most of it, then any others, biggest first. */
  vendors: string[];
  units: number;
  pounds: number;
  net: number;
}

export type ItemSortCol = "code" | "name" | "dept" | "vendor" | "units" | "pounds" | "net";

export interface ItemSort {
  column: ItemSortCol;
  direction: "asc" | "desc";
}

/** One exception type on one day. Qty and amount are null for a type that
 *  rings nothing (No Sale). */
export interface RecapExceptionType {
  type: string;
  label: string;
  transactions: number;
  qty: number | null;
  amount: number | null;
}

/** A day's exceptions: distinct receipts and their amount, then by type. */
export interface RecapExceptions {
  transactions: number;
  amount: number;
  types: RecapExceptionType[];
}

/** Where the week's exception lines are. */
export type WeekExceptionsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; byDay: Record<string, RecapExceptions> };
