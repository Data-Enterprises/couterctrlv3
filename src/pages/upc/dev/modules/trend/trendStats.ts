import type { UpcTrend } from "../../../../../interfaces";

export type TrendStatus =
  | "accelerating"
  | "declining"
  | "reduced-availability"
  | "growing"
  | "new";

/** Whether the item sold at all before the pivot.
 *
 *  `trend_detector` answers for items that didn't exist in the before window
 *  with a row of zeroes — mean_before 0, total_before 0, active_days_before 0
 *  — and zeroes `impact_units` rather than reporting the whole after-period as
 *  a gain. Every comparison below divides by or subtracts from that baseline,
 *  so "there isn't one" has to be its own answer rather than a zero that
 *  arithmetic quietly treats as flat. */
export const hasBaseline = (t: UpcTrend) =>
  t.active_days_before > 0 && t.mean_before > 0;

/**
 * Units gained or lost since the pivot, at the rate the item actually changed
 * by.
 *
 * The endpoint's own `impact_units` is `total_after - total_before`, and the
 * two totals cover windows of very different lengths — the before window is
 * the `periods` lookback, the after window is the searched date range. A store
 * that sold 8,228 bananas over 73 active days and 1,590 over the next 15 comes
 * back as `impact_units: -6638`, which the page headlined as units lost. The
 * same row says the per-day rate went 112.72 -> 106.00: that item is down 6%,
 * not down 6,638.
 *
 * Multiplying the change in per-active-day rate by the after window's own
 * active days answers the question the headline was asking — what the
 * rate change cost over the days it actually applied to. The bananas above
 * come out at -101 units.
 *
 * `mean_*` is per ACTIVE day, not per calendar day (8228.4 / 73 = 112.72
 * exactly), which is why this multiplies by `active_days_after` rather than
 * the window length.
 */
export function impactUnits(t: UpcTrend, fixes = false): number {
  if (!fixes) return t.impact_units;
  if (!hasBaseline(t)) return 0;
  return (t.mean_after - t.mean_before) * t.active_days_after;
}

// impact alone conflates two different stories: real demand loss vs. an item
// that's simply had fewer active selling days (availability/stocking issue).
// pct_change_mean's sign is what tells them apart — if the per-day rate held
// or improved, the volume drop can only be explained by fewer days to sell it,
// not weaker demand.
export function getTrendStatus(t: UpcTrend, fixes = false): TrendStatus {
  // Nothing to compare against. Without this an item that is new since the
  // pivot lands on `impact_units >= 0` and reads as Growing, in green, with
  // an insight sentence that says it is up 0.0% on 0 more units than before.
  if (fixes && !hasBaseline(t)) return "new";
  if (impactUnits(t, fixes) >= 0) return "growing";
  if (t.pct_change_mean >= 0) return "reduced-availability";
  // A decline accelerates when the after-slope is STEEPER downward than the
  // before-slope — that is `slope_after < slope_before`, i.e. a NEGATIVE
  // slope_change. The old test had the sign the other way up, so the label
  // landed on exactly the items whose decline had eased or reversed: bananas
  // went slope -0.22 -> +0.30 (falling, now rising) and were reported as
  // Accelerating, in red, under a KPI whose own sub-label reads "slope
  // worsening".
  const steeper = fixes ? t.slope_change < 0 : t.slope_change > 0;
  return steeper ? "accelerating" : "declining";
}

/**
 * How much faster the decline is now than before, e.g. 4x.
 *
 * Only defined when both slopes are negative. The old guard returned null for
 * `slope_before <= 0`, which is every declining item there is — so the figure
 * never appeared on the items it describes and appeared only on items that had
 * previously been RISING, where a negative-over-positive ratio is a sign flip
 * rather than a multiple.
 */
export function accelerationFactor(t: UpcTrend, fixes = false): number | null {
  if (!fixes) {
    if (t.slope_before <= 0) return null;
    return t.slope_after / t.slope_before;
  }
  if (t.slope_before >= 0 || t.slope_after >= 0) return null;
  return t.slope_after / t.slope_before;
}
