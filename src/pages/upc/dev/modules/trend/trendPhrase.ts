import type { UpcTrend } from "../../../../../interfaces";
import { accelerationFactor, type TrendStatus } from "./trendStats";

export type TrendTone = "up" | "down" | "flat" | "muted";
export type TrendPhrase = { text: string; tone: TrendTone };

// Trend already has a real 4-way categorical diagnosis, unlike Sales Comp/
// Price Opt where a phrase had to be synthesized from raw signals — the
// list phrase is just the status label itself. Accelerating and Declining
// share "down" (the shared tone system only has 4 states); the phrase text
// itself still carries which is which. Reduced availability gets "flat"
// deliberately, since the whole point of that status is "not a demand
// problem" — it shouldn't read with the same alarm color as a real decline.
const STATUS_LABEL: Record<TrendStatus, string> = {
  growing: "Growing",
  declining: "Declining",
  accelerating: "Accelerating",
  "reduced-availability": "Reduced availability",
};

const STATUS_TONE: Record<TrendStatus, TrendTone> = {
  growing: "up",
  declining: "down",
  accelerating: "down",
  "reduced-availability": "flat",
};

export function getTrendPhrase(status: TrendStatus): TrendPhrase {
  return { text: STATUS_LABEL[status], tone: STATUS_TONE[status] };
}

// Fewer active selling days can explain part of a decline even when the
// item is genuinely losing demand too — checked independently of status so
// it can flag on top of Declining/Accelerating, not just inside
// Reduced-availability's own definition.
export function hasAvailabilityFlag(t: UpcTrend): boolean {
  return t.active_days_before > 0 && t.active_days_after / t.active_days_before < 0.5;
}

// Daily rates in this sentence use mean_before/mean_after (the item's own
// plain daily average), not slope_before/slope_after. Slope is a rate of
// CHANGE — how fast the daily rate itself is moving — not a sales rate, so
// plugging it into a "declining at X units/day" sentence describes the
// wrong quantity. The server's own plain-language tooltip field uses the
// same mean-based phrasing, which is what confirmed this.
export function getTrendInsight(t: UpcTrend, status: TrendStatus): string {
  const confidencePct = Math.round(t["r2-after"] * 100);
  const reliability = t["r2-after"] >= 0.5 ? "fairly consistent" : "not very consistent";
  const meanAfter = t.mean_after.toFixed(2);
  const meanBefore = t.mean_before.toFixed(2);
  const availabilityNote = hasAvailabilityFlag(t)
    ? ` Active selling days also dropped sharply (${t.active_days_before} → ${t.active_days_after}), which may be an availability issue layered on top of the demand decline.`
    : "";

  switch (status) {
    case "accelerating": {
      const factor = accelerationFactor(t);
      return `Sales declining at ${meanAfter} units/day, down from ${meanBefore} before — the decline has accelerated${
        factor !== null ? ` roughly ${factor.toFixed(1)}×` : ""
      } and is ${reliability} (${confidencePct}% confidence).${availabilityNote}`;
    }
    case "declining":
      return `Sales declining at ${meanAfter} units/day, down from ${meanBefore} before — the pace of decline isn't speeding up, and is ${reliability} (${confidencePct}% confidence).${availabilityNote}`;
    case "reduced-availability":
      return `Per-day sales rate held steady or improved (${t.pct_change_mean >= 0 ? "+" : ""}${t.pct_change_mean.toFixed(1)}%), but total volume fell because this item was only actively sold ${t.active_days_after} of ${t.active_days_before} prior active days. This looks like a stocking or availability issue, not weaker demand.`;
    case "growing":
      return `Sales are up ${t.pct_change_mean >= 0 ? "+" : ""}${t.pct_change_mean.toFixed(1)}% per day, ${t.impact_units.toLocaleString()} more units than before.`;
  }
}
