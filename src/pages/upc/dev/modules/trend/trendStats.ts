import type { UpcTrend } from "../../../../../interfaces";

export type TrendStatus = "accelerating" | "declining" | "reduced-availability" | "growing";

// impact_units < 0 alone conflates two different stories: real demand loss
// vs. an item that's simply had fewer active selling days (availability/
// stocking issue). pct_change_mean's sign is what tells them apart — if the
// per-day rate held or improved, the volume drop can only be explained by
// fewer days to sell it, not weaker demand.
export function getTrendStatus(t: UpcTrend): TrendStatus {
  if (t.impact_units >= 0) return "growing";
  if (t.pct_change_mean >= 0) return "reduced-availability";
  return t.slope_change > 0 ? "accelerating" : "declining";
}

// How much faster the decline is now vs before, e.g. 4x. Only meaningful
// when there was an actual decline rate to begin with.
export function accelerationFactor(t: UpcTrend): number | null {
  if (t.slope_before <= 0) return null;
  return t.slope_after / t.slope_before;
}
