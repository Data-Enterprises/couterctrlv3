import type { UpcTrend } from "../../../../../interfaces";
import type { UpcTrendWindow } from "../../../../../features/dev/devUpcDevSlice";
import { accelerationFactor, impactUnits, type TrendStatus } from "./trendStats";
import { activeRatePct } from "./trendWindow";

export type TrendTone = "up" | "down" | "flat" | "muted";
export type TrendPhrase = { text: string; tone: TrendTone };

// Trend already has a real categorical diagnosis, unlike Sales Comp/Price Opt
// where a phrase had to be synthesized from raw signals — the list phrase is
// just the status label itself. Accelerating and Declining share "down" (the
// shared tone system only has 4 states); the phrase text itself still carries
// which is which. Reduced availability gets "flat" deliberately, since the
// whole point of that status is "not a demand problem" — it shouldn't read
// with the same alarm color as a real decline. New gets "muted": there is no
// comparison to be had, and green would claim one.
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

// Fewer active selling days can explain part of a decline even when the item
// is genuinely losing demand too — checked independently of status so it can
// flag on top of Declining/Accelerating, not just inside Reduced-
// availability's own definition.
export function hasAvailabilityFlag(t: UpcTrend): boolean {
  return t.active_days_before > 0 && t.active_days_after / t.active_days_before < 0.5;
}

// Daily rates in this sentence use mean_before/mean_after (the item's own
// plain daily average), not slope_before/slope_after. Slope is a rate of
// CHANGE — how fast the daily rate itself is moving — not a sales rate, so
// plugging it into a "declining at X units/day" sentence describes the wrong
// quantity. The server's own plain-language tooltip field uses the same
// mean-based phrasing, which is what confirmed this.
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
  const availabilityNote = hasAvailabilityFlag(t)
    ? ` Active selling days also dropped sharply (${t.active_days_before} → ${t.active_days_after}), which may be an availability issue layered on top of the demand decline.`
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
