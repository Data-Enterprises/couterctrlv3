import type { DayBucket } from "./lookupMetrics";

/**
 * The figures the report layout reads, none of which the table layout needed.
 *
 * Kept out of the components so the arithmetic can be tested without
 * rendering, and out of `lookupMetrics` so removing the dev view later takes
 * this file with it rather than leaving orphans behind.
 */

export interface WindowTotals {
  revenue: number;
  /** Priced units — pounds on a scale item. */
  units: number;
  cost: number;
  /** Days that actually sold, not days in the window. Every per-day average
   *  divides by this: a fortnight with one selling day averages that day's
   *  takings, not a fourteenth of them. */
  sellingDays: number;
  /** Days in the window, selling or not. */
  windowDays: number;
  /** A cost was on file for at least one day. */
  hasCost: boolean;
}

export const windowTotals = (buckets: DayBucket[]): WindowTotals => ({
  revenue: buckets.reduce((acc, b) => acc + b.revenue, 0),
  units: buckets.reduce((acc, b) => acc + b.units, 0),
  cost: buckets.reduce((acc, b) => acc + b.cost, 0),
  sellingDays: buckets.filter((b) => b.hasSale).length,
  windowDays: buckets.length,
  hasCost: buckets.some((b) => b.hasCost),
});

/** The biggest day by takings, or null when nothing sold.
 *
 *  Ties go to the earlier day — arbitrary, but stable, so the tile doesn't
 *  flip between two equal days as the window rolls. */
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
 * How far a day sits from a typical selling day, as a percentage.
 *
 * Measured against the mean of the days that SOLD, not of the window — a day
 * compared against an average dragged down by closed days reads as a triumph
 * every time it opens.
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
 * "Mon Sep 15" from a YYYY-MM-DD.
 *
 * Built from the parts rather than `new Date(iso)`: that parses as UTC
 * midnight, which is the previous day everywhere in the US, so every label
 * would be off by one.
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
