// Interfaces
import type { UpcTrendWindow } from "../../../../../../features/dev/devUpcDevSlice";

const MIN_SAMPLE_AFTER_DAYS = 30;
const WEAK_BASELINE_R2 = 0.2;
const DAY_MS = 86_400_000;

/** Whole days from a to b, both local midnights, so a DST change in between
 *  can't make the subtraction land a day off. */
const daysBetween = (a: Date, b: Date) =>
  Math.round((b.getTime() - a.getTime()) / DAY_MS);

/** The search's m/d/yyyy as a local midnight. */
const fromMdy = (mdy: string) => {
  const [m, d, y] = mdy.split("/").map(Number);
  return new Date(y, m - 1, d);
};

/**
 * What to ask `trend_detector` for, and the window its answer describes. It
 * reads `CURRENT_DATE - periods` through today, split at the start date, and
 * never reads the end date. Asking for the days since the start date plus
 * `baselineDays` makes "before" exactly `baselineDays` long; "after" runs
 * through yesterday, since today's sales are rarely in yet.
 */
export function trendRequest(
  startMdy: string,
  baselineDays: number,
  today: Date = new Date(),
): { periods: number; window: UpcTrendWindow } {
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const since = Math.max(daysBetween(fromMdy(startMdy), midnight), 0);
  return {
    periods: since + baselineDays,
    window: { pivot: startMdy, beforeDays: baselineDays, afterDays: Math.max(since, 1) },
  };
}

export function activeRatePct(activeDays: number, windowDays: number): number {
  return Math.min(Math.round((activeDays / windowDays) * 100), 100);
}

// r2-before this low means the "before" line fits noise, and impact
// (extrapolated from it) inherits that.
export function isWeakBaseline(r2Before: number): boolean {
  return r2Before < WEAK_BASELINE_R2;
}

// A short after-window means few data points behind every after-based number,
// separate from the reduced-availability status.
export function isSmallSample(afterWindowDays: number): boolean {
  return afterWindowDays < MIN_SAMPLE_AFTER_DAYS;
}
