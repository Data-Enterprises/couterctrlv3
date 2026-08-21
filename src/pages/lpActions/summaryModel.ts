import type { CashierTransaction } from "../../interfaces";

/**
 * What a cashier's exceptions look like, summarised.
 *
 * Everything here comes from `cashier_table`, which carries the sale type, the
 * date, the lane and the transaction total — and nothing else. Quantity, the
 * items on the receipt and the tender used are all line-level, and reaching
 * them means walking `transaction_list` per receipt. So this is the honest
 * ceiling of what one already-downloaded request can say.
 *
 * The day-of-week split is the part worth having: an exception that only ever
 * happens on a Sunday is a different problem from one spread evenly, and the
 * weekly counts in the ledger can't show that.
 */
export const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface TypeSummary {
  saleType: string;
  /** Occurrences. `cashier_table` returns a row per exception, so six
   *  cancelled lines in one basket count as six. */
  occurrences: number;
  /** Distinct receipts those occurrences fall across. Six cancellations in one
   *  customer interaction is a different finding from six across the week, and
   *  the occurrence count alone can't tell them apart. */
  receipts: number;
  dollars: number;
  /** Mean transaction value. The interesting one for voids: many small ones
   *  reads differently from a handful of large. */
  avgDollars: number;
  largest: number;
  /** Distinct days it occurred on — a denominator for "how often". */
  days: number;
  perDay: number[];
  /** Busiest weekday, or null when it is spread evenly enough not to matter. */
  peakDay: string | null;
}

const dowOf = (saleDate: string) => {
  const [y, m, d] = saleDate.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

/** A peak is only worth naming when it stands clear of an even spread. Below
 *  this it is noise, and pointing at a Tuesday would invent a pattern. */
const PEAK_RATIO = 1.6;

export const summariseByType = (rows: CashierTransaction[]): TypeSummary[] => {
  const byType = new Map<string, CashierTransaction[]>();
  for (const r of rows) {
    const found = byType.get(r.sale_type);
    if (found) found.push(r);
    else byType.set(r.sale_type, [r]);
  }

  return [...byType.entries()]
    .map(([saleType, list]) => {
      const dollars = list.reduce((acc, r) => acc + (r.total_sales ?? 0), 0);
      const perDay = Array(7).fill(0) as number[];
      const dates = new Set<string>();
      for (const r of list) {
        perDay[dowOf(r.sale_date)] += 1;
        dates.add(r.sale_date.slice(0, 10));
      }

      const peakCount = Math.max(...perDay);
      const mean = list.length / 7;
      const peakIndex = perDay.indexOf(peakCount);

      const receipts =
        dates.size > 0 ? new Set(list.map((r) => r.sale_id)).size : 0;

      return {
        saleType,
        occurrences: list.length,
        receipts,
        dollars,
        avgDollars: list.length ? dollars / list.length : 0,
        largest: list.reduce((acc, r) => Math.max(acc, r.total_sales ?? 0), 0),
        days: dates.size,
        perDay,
        peakDay:
          mean > 0 && peakCount >= mean * PEAK_RATIO ? DOW[peakIndex] : null,
      };
    })
    .sort((a, b) => b.occurrences - a.occurrences);
};
