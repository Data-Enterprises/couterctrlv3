// Interfaces
import type { SubsPricePoint, SubDeptMargin, ActionKind } from "../../../../interfaces";

// Defined in src/interfaces: Item Report actions. Re-exported for this page's files.
export type { ActionKind } from "../../../../interfaces";

/** What the cost did across the lookback, in the four shapes worth a call. */
/** One significant move between consecutive receipts. */
export interface CostStep {
  from: number;
  to: number;
  pct: number;
  /** The receipt that carried the new cost. */
  date: string;
  /** Position in the series, so a later reversal can be looked for. */
  index: number;
}

export interface CostHistory {
  first: number;
  last: number;
  firstDate: string;
  low: number;
  high: number;
  /** Steps that moved more than the rounding floor. Four cost points is three
   *  changes — the distinction the old rule missed by counting receipts. */
  changes: number;
  firstChangeDate: string | null;
  lastChangeDate: string | null;
  /**
   * The largest rise that is *still in force*.
   *
   * A rise the cost later came back down from is a bounce, not an increase, and
   * `reversals` is the trigger built for that shape. Without this, an item that
   * went $3.63 → $4.90 → $3.63 in June and has been billed $3.63 across ten
   * deliveries since was told to call the vendor about a 35% jump it is no
   * longer paying.
   */
  standingStepUp: CostStep | null;
  /** First receipt to last, as a percentage. */
  cumulative: number;
  /** How often the direction flipped between significant steps. */
  reversals: number;
}

/** How the item has been selling: what it last rang at, and whether that was a
 *  promotion or the shelf price. */
export interface PriceRead {
  /** The most recent day it sold, and what came in per unit that day. */
  price: number;
  date: string;
  units: number;
  /** True when `price` is an average rather than a figure the register rang. */
  blended: boolean;
  /** True when the most recent day rang on a promotional price type. */
  onSale: boolean;
  /** The current promotional run — first day, length, volume and money. Only
   *  meaningful when `onSale`. */
  saleStart: string;
  saleDays: number;
  saleUnits: number;
  saleRevenue: number;
  /**
   * Register discounts given during the promotional run, as a negative number.
   *
   * The "DC <vendor>" rows carry no units and never reach `price` — that stays
   * what the shelf asked. But they are real money off real units: the bacon's
   * $3.99 promotion had a further $40.00 taken at the register, and 40 of its
   * 81 units actually left at $2.99. Counting the promotion without them
   * understated what it cost by nearly half.
   */
  saleDiscount: number;
  /** The posted price from the most recent day's rows — what the POS says the
   *  item costs, whatever it actually rang at. */
  shelfPrice: number | null;
  /** The last regular ring in the window, if there was one. */
  regularPrice: number | null;
  /** The first regular ring, so shelf-price movement can be measured without
   *  promotional days dragging it. */
  firstRegularPrice: number | null;
  /** Every day that carried a promotional ring. Lets a comparison skip the
   *  stretch where a promotion was running. */
  promoDays: Set<string>;
  /** The dearest price seen. A last-resort stand-in for the regular price when
   *  nothing rang REG and the invoice carries no intended retail. */
  highestPrice: number;
}

/** One day of one item: what it sold, and what it was selling at. */
export interface DayPoint {
  date: string;
  units: number;
  netSales: number;
  price: number;
  cogs: number;
}

/** One period's totals. Null anywhere means the item did not sell in that
 *  period, which is not the same as selling zero. */
export interface PeriodTotals {
  sales: number;
  units: number;
}

/**
 * Stock movement over a window where receipts and sales are both known.
 *
 * Not an inventory level — nothing in the API reports one, and there is no
 * opening balance to start from. This is the *change*: what came in against
 * what went out. An item can show +40 and still have an empty shelf if the
 * opening position was −40, which is why nothing here is labelled "on hand".
 *
 * It is also blind to shrink, damage, theft, transfers and markdowns to zero,
 * all of which leave through the back door without a sales row. Net movement
 * therefore reads high rather than low when something is going missing.
 */
export interface StockMovement {
  /** Days actually covered — the movement window clamped to the sales in hand. */
  days: number;
  start: string;
  received: number;
  sold: number;
  /** Received less sold. Positive means the shelf filled over the window. */
  net: number;
  /** How many deliveries landed inside the span. Drives which of the two stock
   *  blocks the rail shows: at exactly one, this block is a contaminated copy
   *  of "since last delivery" — its `sold` counts days *before* that delivery
   *  arrived, charging pre-delivery sales against it — so the anchored block
   *  replaces it. At two or more the two answer different questions and both
   *  are shown. */
  deliveries: number;
}

/** What is left of the most recent delivery. Sharper than net movement because
 *  it is anchored to one event rather than a span, so there is no opening
 *  balance to be ignorant of — but only answerable when that delivery landed
 *  inside the days we hold sales for. */
export interface SinceDelivery {
  date: string;
  received: number;
  sold: number;
  left: number;
}

export interface ReportItem {
  productCode: string;
  description: string;
  department: string;
  vendorName: string;
  /** Found on the receipt side rather than in the upload — delivered but never
   *  scanned, so no sales row for it exists anywhere. */

  ty: PeriodTotals;
  lw: PeriodTotals | null;
  ly: PeriodTotals | null;
  /**
   * Percent change in **units**, not dollars. Null when the baseline period
   * sold none.
   *
   * Dollars conflate the two causes this page exists to separate: sales down
   * 30% is either fewer units or a lower price, while units down 30% can only
   * mean the item physically moved less. Everything else on the row — received,
   * net, unaccounted — is already in units, so this keeps one basis across the
   * whole comparison. Sales are still carried on `ty`/`lw`/`ly` for weighting
   * and for the export.
   */
  lwPct: number | null;
  lyPct: number | null;

  /** Blended cost per priced unit. Falls back to the latest receipt when the
   *  item has no sales rows to derive one from. */
  unitCost: number | null;
  marginPct: number | null;
  /** Days in the window it sold at all. */
  daysSold: number;
  series: DayPoint[];
  /**
   * The prices this item actually rang at, from `subs/subs`.
   *
   * Replaces the estimate that used to live here. Every price signal below was
   * derived by dividing a day's revenue by its units, which on a day carrying
   * two prices produces one the register never charged — a promotion starting
   * read as a price cut and a promotion ending read as a rise. These are the
   * real prices, with the units and the days each one ran.
   *
   * Empty when the endpoint returned none for this code, and every consumer
   * falls back to the row arithmetic in that case rather than reporting zero.
   */
  points: SubsPricePoint[];
  movement: StockMovement | null;
  sinceDelivery: SinceDelivery | null;
  rows: SubDeptMargin[];
}

/** A stretch of consecutive selling days at one price. "Did the price change
 *  and did demand follow" can't be read off a total — one price may have run
 *  three weeks and the other three days. */
export interface PriceEra {
  price: number;
  start: string;
  end: string;
  days: number;
  /** Pounds on a weighed item, a ring count otherwise -- the same rule the
   *  rest of the panel follows. `weighed` says which, because the column
   *  silently changes meaning without it. */
  units: number;
  weighed: boolean;
  unitsPerDay: number;
  unitCost: number | null;
  marginPct: number | null;
}

export interface Verdict {
  action: ActionKind;
  /** The sentence shown on the row. Leads with the stock-or-demand split,
   *  because that decides who owns the problem. */
  evidence: string;
  /** Units delivered on the last receipt that the window can't account for.
   *  Only computed when that receipt falls inside the sales window, since
   *  otherwise the sales before it aren't in hand. */
  unaccounted: number | null;
}

/**
 * The price table, merged by price.
 *
 * `cashiers/price_points` splits on price type and on whether the item rang
 * as a multiple, which matters to Price Opt -- it cares how a price was
 * arrived at. Here, what the item rang at is the whole question and why is a
 * column this section does not have.
 *
 * `unit_price` is per pound where the item is weighed, and the amount beside
 * it has to be pounds to match. This table used to be built by walking every
 * receipt, and a receipt line carries what the PACKAGE came to -- which is
 * how Fam Pak Breast Tenders came to list $6.14, $6.94 and $6.86 against a
 * shelf price of $3.99 a pound (finding AS).
 */
export interface MergedPrice {
  price: number;
  /** Pounds where `weighed`, a ring count otherwise. */
  qty: number;
  receipts: number;
  weighed: boolean;
}
