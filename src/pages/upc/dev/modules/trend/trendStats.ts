// Interfaces
import type { UpcTrend } from "../../../../../interfaces";
import type { UpcTrendWindow } from "../../../../../features/dev/devUpcDevSlice";

export type TrendStatus =
  | "accelerating"
  | "declining"
  | "stopped"
  | "reduced-availability"
  | "growing"
  | "new";

/** The statuses that mean the item is selling less: what "Declining items"
 *  counts and the Declining export holds. */
export const isDecline = (s: TrendStatus) =>
  s === "declining" || s === "accelerating" || s === "stopped";

/** Sold before the pivot and not on a single day since. */
export const hasStopped = (t: UpcTrend) => hasBaseline(t) && t.active_days_after === 0;

/** Units per calendar day in each window: the total over the window's
 *  length, selling days or not. `mean_*` is per selling day. */
export const calendarRates = (t: UpcTrend, window: UpcTrendWindow) => ({
  before: t.total_before / window.beforeDays,
  after: t.total_after / window.afterDays,
});

/**
 * Sold as fast as before on the days it sold, but on fewer of them, so it
 * moved less overall: a stocking or availability problem, not weaker demand.
 *
 * Measured per calendar day. The per-selling-day rate (`pct_change_mean`)
 * held or rose, while units per calendar day fell. The old test compared that
 * rate against the impact figure, which is the same rate change times the
 * after window's selling days, so the two always had the same sign and the
 * status could never come up. Needs the windows; without them, no.
 */
export const hasReducedAvailability = (t: UpcTrend, window: UpcTrendWindow | null) => {
  if (!window || !hasBaseline(t) || t.active_days_after === 0) return false;
  if (t.pct_change_mean < 0) return false;
  const rate = calendarRates(t, window);
  return rate.after < rate.before;
};

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
export function impactUnits(
  t: UpcTrend,
  fixes = false,
  window: UpcTrendWindow | null = null,
): number {
  if (!fixes) return t.impact_units;
  if (!hasBaseline(t)) return 0;
  // An item that stopped has no selling days to multiply by, so the formula
  // below comes out at exactly 0 -- which read as Growing. What it lost is
  // what it would have sold at its old pace, per calendar day, over the days
  // since: the before window's total spread across that window, times the
  // after window. Needs the windows; without them there is no honest number.
  if (t.active_days_after === 0) {
    return window ? -(t.total_before / window.beforeDays) * window.afterDays : 0;
  }
  // Its rate per selling day held, so the formula below reads as a gain. What
  // it lost is the drop in units per calendar day, over the days since.
  if (window && hasReducedAvailability(t, window)) {
    const rate = calendarRates(t, window);
    return (rate.after - rate.before) * window.afterDays;
  }
  return (t.mean_after - t.mean_before) * t.active_days_after;
}

// impact alone conflates two different stories: real demand loss vs. an item
// that's simply had fewer active selling days (availability/stocking issue).
// pct_change_mean's sign is what tells them apart — if the per-day rate held
// or improved, the volume drop can only be explained by fewer days to sell it,
// not weaker demand.
export function getTrendStatus(
  t: UpcTrend,
  fixes = false,
  window: UpcTrendWindow | null = null,
): TrendStatus {
  // Nothing to compare against. Without this an item that is new since the
  // pivot lands on `impact_units >= 0` and reads as Growing, in green, with
  // an insight sentence that says it is up 0.0% on 0 more units than before.
  if (fixes && !hasBaseline(t)) return "new";
  // Its own status rather than a decline like any other: "it stopped" is a
  // different conversation from "it's slowing", and the rate and slope
  // figures that describe a decline are all zero here.
  if (fixes && hasStopped(t)) return "stopped";
  if (fixes && hasReducedAvailability(t, window)) return "reduced-availability";
  if (impactUnits(t, fixes, window) >= 0) return "growing";
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
