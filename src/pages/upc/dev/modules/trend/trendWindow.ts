import type { UpcTrendWindow } from "../../../../../features/dev/devUpcDevSlice";

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
 * What to ask `trend_detector` for, and the window its answer will describe.
 *
 * The endpoint reads `CURRENT_DATE - periods` through `CURRENT_DATE` and splits
 * it at the start date; it never reads the end date. So "after" always runs
 * from the start date to today, and "before" is whatever is left of `periods`
 * ahead of the start date. With a flat `periods` of 90, a search that started
 * 100 days ago had no "before" at all and every item read "New since pivot",
 * and a recent one had a "before" of whatever was left over.
 *
 * Asking for the days since the start date plus `baselineDays` makes "before"
 * exactly `baselineDays` long however old the search is. "After" is counted
 * through yesterday: today's sales are rarely in yet. A 9/1 search read on
 * 9/17 has a 16-day after window, and that is what a live answer showed
 * (bananas, 15 selling days of 16).
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

// r2-before this low means the "before" line is fit to essentially noise —
// impact is extrapolated from that line, so it inherits the same
// unreliability.
export function isWeakBaseline(r2Before: number): boolean {
  return r2Before < WEAK_BASELINE_R2;
}

// Short after-window means few data points feed every after-based number
// (mean_after, r2-after, active rate, impact) regardless of trend direction —
// a distinct concern from the reduced-availability status.
export function isSmallSample(afterWindowDays: number): boolean {
  return afterWindowDays < MIN_SAMPLE_AFTER_DAYS;
}
