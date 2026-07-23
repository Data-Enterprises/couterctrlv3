// Window-length math derived from the real marketing/trend_detector
// mechanics: "before" runs from (today - periods) to startdate, "after"
// runs from startdate through today — never through a fixed end date, so
// this always has to be computed against the actual current date rather
// than anything stored in the response.
const MIN_SAMPLE_AFTER_DAYS = 30;
const WEAK_BASELINE_R2 = 0.2;

export function getWindowDays(
  startdate: string,
  periods: number,
): { beforeWindowDays: number; afterWindowDays: number } {
  const pivot = new Date(startdate);
  const today = new Date();
  const afterWindowDays = Math.max(Math.round((today.getTime() - pivot.getTime()) / 86_400_000), 1);
  const beforeWindowDays = Math.max(periods - afterWindowDays, 1);
  return { beforeWindowDays, afterWindowDays };
}

export function activeRatePct(activeDays: number, windowDays: number): number {
  return Math.min(Math.round((activeDays / windowDays) * 100), 100);
}

// r2-before this low means the "before" line is fit to essentially noise —
// impact_units is extrapolated from that line, so it inherits the same
// unreliability.
export function isWeakBaseline(r2Before: number): boolean {
  return r2Before < WEAK_BASELINE_R2;
}

// Short after-window means few data points feed every after-based number
// (mean_after, r2-after, active rate, impact_units) regardless of trend
// direction — a distinct concern from the reduced-availability status.
export function isSmallSample(afterWindowDays: number): boolean {
  return afterWindowDays < MIN_SAMPLE_AFTER_DAYS;
}
