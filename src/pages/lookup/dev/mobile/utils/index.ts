// Interfaces
import type { DayBucket } from "../../interfaces";
import type { WindowTotals } from "../interfaces";

/**
 * The figures the report layout reads, kept out of the components (testable)
 * and out of the page's utils (so removing the dev view takes this with it).
 */

export const windowTotals = (buckets: DayBucket[]): WindowTotals => ({
  revenue: buckets.reduce((acc, b) => acc + b.revenue, 0),
  units: buckets.reduce((acc, b) => acc + b.units, 0),
  cost: buckets.reduce((acc, b) => acc + b.cost, 0),
  sellingDays: buckets.filter((b) => b.hasSale).length,
  windowDays: buckets.length,
  hasCost: buckets.some((b) => b.hasCost),
});

/** The biggest day by takings, or null when nothing sold. Ties go to the
 *  earlier day, so the tile is stable. */
export const bestDay = (buckets: DayBucket[]): DayBucket | null =>
  buckets.reduce<DayBucket | null>(
    (best, b) => (b.hasSale && (!best || b.revenue > best.revenue) ? b : best),
    null,
  );

/** What share of the window's takings one day was. Null when the window took
 *  nothing, rather than a division by zero dressed up as 0%. */
export const dayShare = (day: DayBucket, total: number): number | null =>
  total > 0 ? (day.revenue / total) * 100 : null;

/**
 * How far a day sits from a typical selling day, as a percentage, against the
 * mean of the days that sold (not the window).
 */
export const vsSellingAverage = (
  day: DayBucket,
  buckets: DayBucket[],
): number | null => {
  const selling = buckets.filter((b) => b.hasSale);
  if (!selling.length || !day.hasSale) return null;
  const mean = selling.reduce((acc, b) => acc + b.revenue, 0) / selling.length;
  if (mean <= 0) return null;
  return ((day.revenue - mean) / mean) * 100;
};

/** Margin for one day, or null without a sale or a cost to measure it by. */
export const dayMargin = (day: DayBucket): number | null =>
  day.hasSale && day.hasCost && day.revenue > 0
    ? ((day.revenue - day.cost) / day.revenue) * 100
    : null;

/**
 * "Mon Sep 15" from a YYYY-MM-DD, built from the parts: `new Date(iso)` parses
 * UTC midnight, the day before in the US.
 */
export const dayLabel = (iso: string): string => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

/** Just the day of the month, for a chart column too narrow for a date. */
export const dayNumber = (iso: string): string =>
  String(Number(iso.split("-")[2]));

/** Signed, so a flat day reads as flat rather than as a gain of nothing. */
export const formatSignedPct = (pct: number): string =>
  `${pct > 0 ? "+" : ""}${pct.toFixed(pct >= 100 || pct <= -100 ? 0 : 1)}%`;

/** A margin's text colour: red below zero, green above, plain when unknown. */
export const marginColor = (marginPct: number | null) => {
  if (marginPct === null) return "text-content/95";
  return marginPct < 0 ? "text-delta_negative_text" : "text-delta_positive_text";
};
