// Utils
import { accelerationFactor, impactUnits } from "../trendStats";
import { activeRatePct } from "./trendWindow";

// Interfaces
import type { TrendPhrase, TrendTone, TrendStatus } from "../interfaces";
import type { UpcTrend } from "../../../../../../interfaces";
import type { UpcTrendWindow } from "../../../../../../features/dev/devUpcDevSlice";

// The list phrase is the status label. Accelerating and Declining share
// "down" (the phrase says which); Reduced availability is "flat", since it is
// not a demand problem; New is "muted", with nothing to compare.
const STATUS_LABEL: Record<TrendStatus, string> = {
  growing: "Growing",
  declining: "Declining",
  accelerating: "Accelerating",
  stopped: "Stopped selling",
  "reduced-availability": "Reduced availability",
  new: "New since pivot",
};

const STATUS_TONE: Record<TrendStatus, TrendTone> = {
  growing: "up",
  declining: "down",
  accelerating: "down",
  stopped: "down",
  "reduced-availability": "flat",
  new: "muted",
};

export function getTrendPhrase(status: TrendStatus): TrendPhrase {
  return { text: STATUS_LABEL[status], tone: STATUS_TONE[status] };
}

// Fewer selling days can explain part of any decline, so it is checked
// independently of status. Compared as shares of each window's days, not
// counts (the windows differ in length): flags when the share since is under
// half the share before.
export function hasAvailabilityFlag(t: UpcTrend, window: UpcTrendWindow | null): boolean {
  if (!window || t.active_days_before <= 0) return false;
  const before = t.active_days_before / window.beforeDays;
  const after = t.active_days_after / window.afterDays;
  return after / before < 0.5;
}

// Daily rates here use mean_before/mean_after (plain daily averages), not
// slope_*, which is the rate of change of the daily rate.
export function getTrendInsight(
  t: UpcTrend,
  status: TrendStatus,
  fixes = false,
  window: UpcTrendWindow | null = null,
): string {
  const confidencePct = Math.round(t["r2-after"] * 100);
  const reliability = t["r2-after"] >= 0.5 ? "fairly consistent" : "not very consistent";
  const meanAfter = t.mean_after.toFixed(2);
  const meanBefore = t.mean_before.toFixed(2);
  const impact = Math.round(impactUnits(t, fixes, window));
  const availabilityNote = window && hasAvailabilityFlag(t, window)
    ? ` It also sold on far fewer days (${activeRatePct(t.active_days_after, window.afterDays)}% of days since, down from ${activeRatePct(t.active_days_before, window.beforeDays)}% before), which may be an availability issue layered on top of the demand decline.`
    : "";

  switch (status) {
    case "accelerating": {
      const factor = accelerationFactor(t, fixes);
      return `Sales declining at ${meanAfter} units/day, down from ${meanBefore} before — the decline has accelerated${
        factor !== null ? ` roughly ${factor.toFixed(1)}×` : ""
      } and is ${reliability} (${confidencePct}% confidence).${availabilityNote}`;
    }
    case "stopped": {
      const since = window ? ` since ${window.pivot.split("/").slice(0, 2).join("/")}` : " since";
      const lost = impact < 0 ? ` At its old pace that's about ${Math.abs(impact).toLocaleString()} units not sold.` : "";
      return `Sold ${meanBefore} units a day on ${t.active_days_before} selling days before, and nothing${since}.${lost}`;
    }
    case "declining":
      return `Sales declining at ${meanAfter} units/day, down from ${meanBefore} before — the pace of decline isn't speeding up, and is ${reliability} (${confidencePct}% confidence).${availabilityNote}`;
    case "reduced-availability": {
      const rate = `${t.pct_change_mean >= 0 ? "+" : ""}${t.pct_change_mean.toFixed(1)}%`;
      // Shares of each window's days, so the two counts are comparable: 15
      // selling days of 16 is not a drop from 73 of 90.
      const days = window
        ? `it sold on ${activeRatePct(t.active_days_after, window.afterDays)}% of days since, down from ${activeRatePct(t.active_days_before, window.beforeDays)}% before`
        : "it sold on fewer days";
      const lost = impact < 0 ? `, about ${Math.abs(impact).toLocaleString()} units` : "";
      return `Sales per selling day held steady or improved (${rate}), but ${days}, so total volume fell${lost}. This looks like a stocking or availability issue, not weaker demand.`;
    }
    // No baseline to measure against, so the sentence reports what the item
    // has done since it started rather than inventing a comparison.
    case "new":
      return `No sales on record before this date, so there's nothing to compare against. Since then it has sold ${t.total_after.toLocaleString()} units over ${t.active_days_after} active days, averaging ${meanAfter} a day.`;
    case "growing":
      return `Sales are up ${t.pct_change_mean >= 0 ? "+" : ""}${t.pct_change_mean.toFixed(1)}% per day, ${impact.toLocaleString()} more units than before.`;
  }
}

/** Each tone's text colour in the list. */
export const TONE_TEXT: Record<TrendTone, string> = {
  up: "text-severity_healthy_text",
  down: "text-severity_critical_text",
  flat: "text-content/95",
  muted: "text-content/95",
};
