// Interfaces
import type { TrendStatus } from "./interfaces";
import type { UpcTrend } from "../../../../../interfaces";
import type { UpcTrendWindow } from "../../../../../features/dev/devUpcDevSlice";

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
 * Sold as fast as before on the days it sold, but on fewer days: a stocking
 * or availability problem, not weaker demand. Measured per calendar day (the
 * per-selling-day rate held or rose while units per calendar day fell). Needs
 * the windows.
 */
export const hasReducedAvailability = (t: UpcTrend, window: UpcTrendWindow | null) => {
  if (!window || !hasBaseline(t) || t.active_days_after === 0) return false;
  if (t.pct_change_mean < 0) return false;
  const rate = calendarRates(t, window);
  return rate.after < rate.before;
};

/** Whether the item sold at all before the pivot. `trend_detector` answers a
 *  new item with zeroes (and zeroes `impact_units`), so "no baseline" is its
 *  own answer, not a zero read as flat. */
export const hasBaseline = (t: UpcTrend) =>
  t.active_days_before > 0 && t.mean_before > 0;

/**
 * Units gained or lost since the pivot, at the rate the item actually changed
 * by: the change in per-active-day rate (`mean_*`) times the after window's
 * active days. The endpoint's `impact_units` subtracts totals from windows of
 * very different lengths, so 8,228 bananas over 73 days then 1,590 over 15
 * read as -6,638, when the rate went 112.72 → 106.00 (about -101 units).
 */
export function impactUnits(
  t: UpcTrend,
  fixes = false,
  window: UpcTrendWindow | null = null,
): number {
  if (!fixes) return t.impact_units;
  if (!hasBaseline(t)) return 0;
  // An item that stopped has no selling days, so the formula gives 0. What it
  // lost is its old per-calendar-day pace times the after window. Needs the
  // windows.
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

// Impact alone mixes up demand loss and fewer selling days; pct_change_mean's
// sign tells them apart (rate held or rose: fewer days, not weaker demand).
export function getTrendStatus(
  t: UpcTrend,
  fixes = false,
  window: UpcTrendWindow | null = null,
): TrendStatus {
  // No baseline: without this a new item reads as Growing on zero.
  if (fixes && !hasBaseline(t)) return "new";
  // Its own status: "it stopped" is not "it's slowing", and the decline
  // figures are all zero here.
  if (fixes && hasStopped(t)) return "stopped";
  if (fixes && hasReducedAvailability(t, window)) return "reduced-availability";
  if (impactUnits(t, fixes, window) >= 0) return "growing";
  if (t.pct_change_mean >= 0) return "reduced-availability";
  // A decline accelerates when the after-slope is steeper downward:
  // `slope_after < slope_before`, a NEGATIVE slope_change.
  const steeper = fixes ? t.slope_change < 0 : t.slope_change > 0;
  return steeper ? "accelerating" : "declining";
}

/**
 * How much faster the decline is now than before, e.g. 4x. Only defined when
 * both slopes are negative (otherwise the ratio is a sign flip, not a multiple).
 */
export function accelerationFactor(t: UpcTrend, fixes = false): number | null {
  if (!fixes) {
    if (t.slope_before <= 0) return null;
    return t.slope_after / t.slope_before;
  }
  if (t.slope_before >= 0 || t.slope_after >= 0) return null;
  return t.slope_after / t.slope_before;
}
