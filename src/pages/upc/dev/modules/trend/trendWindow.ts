const MIN_SAMPLE_AFTER_DAYS = 30;
const WEAK_BASELINE_R2 = 0.2;
const DAY_MS = 86_400_000;

/** Whole days from a to b. Both sides come from the same response and are
 *  parsed the same way ("2026-09-01T00:00:00", no zone, so local midnight),
 *  which is what makes the subtraction exact rather than off-by-one across a
 *  DST boundary. */
const daysBetween = (a: Date, b: Date) =>
  Math.round((b.getTime() - a.getTime()) / DAY_MS);

/**
 * How long the before and after windows are.
 *
 * The after window is the searched date range, and `trend_detector` hands both
 * of its ends back — `startdate` and `end_date`. It used to be measured
 * against `new Date()` instead, on the belief that after always runs through
 * today; the response disproves that. A 9/1-9/16 search read on 9/17 returned
 * `active_days_after: 15` for an item selling nearly every day, which only
 * fits a 16-day window, and the panel printed "Since pivot 17d" while every
 * active-rate percentage came out understated against the longer divisor.
 *
 * The before window is still `periods - afterWindowDays` and is still a guess
 * — the one response in hand can't separate it from "periods days ending at
 * the pivot", because with periods 90 the two land on 73 and 90 and the item
 * measured had 73 active days either way. Left as it was rather than changed
 * on a hunch; it needs one run at a different `periods` to settle.
 */
export function getWindowDays(
  startdate: string,
  enddate: string | null,
  periods: number,
  fixes = false,
): { beforeWindowDays: number; afterWindowDays: number } {
  const pivot = new Date(startdate);
  // Inclusive: a 9/1 - 9/16 range is 16 days of trading, not 15.
  const afterWindowDays =
    fixes && enddate
      ? Math.max(daysBetween(pivot, new Date(enddate)) + 1, 1)
      : Math.max(daysBetween(pivot, new Date()), 1);
  const beforeWindowDays = Math.max(periods - afterWindowDays, 1);
  return { beforeWindowDays, afterWindowDays };
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
