// Utils
import {
  formatCurrency2,
  formatCurrencyCompact,
  formatBigNumber,
} from "../../../../../utils";

// Interfaces
import type { CategoryMetric } from "../../../../../interfaces";

/** A figure as the list shows it: units, or exact currency. */
export const fmtValue = (metric: CategoryMetric, n: number) =>
  metric === "qty" ? formatBigNumber(n) : formatCurrency2(n);

/** The header total only — abbreviated ($1.2K) so a store-wide figure can't
 *  crowd the pills beside it, matching Sales. Rows keep the exact amount. */
export const fmtHeaderValue = (metric: CategoryMetric, n: number) =>
  metric === "qty" ? formatBigNumber(n, 0) : formatCurrencyCompact(n);

/**
 * What the percentage beside the total was actually taken over.
 *
 * The header total is the whole week. The percentage is not: a category-day
 * with no counterpart in the compared period leaves both sides, so the base
 * is "this week, in the category-days that also exist back then". On the
 * reported example the header read $100.4K and +7.15% while the figures
 * compared were about $96.8K against $90.3K -- close enough to look like the
 * headline, so a reader back-solves a last-week total the page never used.
 *
 * Only said when the two differ. When nothing was dropped the base IS the
 * headline and the sentence would be noise.
 */
export const comparedBasis = (
  metric: CategoryMetric,
  weekTotal: number,
  twPaired: number,
  prior: number,
  period: string,
): string => {
  if (Math.abs(twPaired - weekTotal) < 0.005) return "";
  return `Compares ${fmtValue(metric, twPaired)} this week against ${fmtValue(metric, prior)} ${period} — the categories trading in both periods. The ${fmtHeaderValue(metric, weekTotal)} beside it is the whole week.`;
};

/** A header pill's hover text: the compared basis, then any coverage note. */
export const pillTitle = (basis: string, note: string | undefined) =>
  [basis, note].filter(Boolean).join(" ") || undefined;
