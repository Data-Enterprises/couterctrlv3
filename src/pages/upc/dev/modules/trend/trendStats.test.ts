import { describe, expect, it } from "vitest";
import type { UpcTrend } from "../../../../../interfaces";
import { accelerationFactor, getTrendStatus, impactUnits } from "./trendStats";
import { getWindowDays } from "./trendWindow";

/** Verbatim from a live `marketing/trend_detector` answer: store 545,
 *  9/1/2026 - 9/16/2026, periods 90. Both rows are real, and between them they
 *  cover the two cases the page was getting wrong. */
const BANANAS: UpcTrend = {
  product_code: "4011",
  product_description: "BANANAS",
  trend_date: "",
  slope_before: -0.22,
  slope_after: 0.3,
  slope_change: 0.52,
  trend: 0.52,
  mean_before: 112.72,
  mean_after: 106,
  pct_change_mean: -5.96,
  total_before: 8228.4,
  total_after: 1589.98,
  volatility_before: 26.75,
  volatility_after: 16.47,
  active_days_before: 73,
  active_days_after: 15,
  impact_units: -6638,
  "r2-before": 0.03,
  "r2-after": 0.01,
};

/** Sold nothing before the pivot — the endpoint answers with a zeroed before
 *  half and zeroes impact_units rather than calling the whole after period a
 *  gain. */
const PICADELI: UpcTrend = {
  product_code: "70417",
  product_description: "Picadeli Salad Bar",
  trend_date: "",
  slope_before: 0,
  slope_after: -0.77,
  slope_change: -0.77,
  trend: -0.77,
  mean_before: 0,
  mean_after: 56.38,
  pct_change_mean: 0,
  total_before: 0,
  total_after: 789.37,
  volatility_before: 0,
  volatility_after: 20.27,
  active_days_before: 0,
  active_days_after: 14,
  impact_units: 0,
  "r2-before": 0,
  "r2-after": 0.03,
};

describe("trend status", () => {
  it("does not call a reversed decline accelerating", () => {
    // slope went -0.22 -> +0.30: falling, now rising. The rate is still down
    // 5.96% year on year, so it is declining — but the decline is not
    // speeding up, which is the only thing "Accelerating" claims.
    expect(getTrendStatus(BANANAS, true)).toBe("declining");
  });

  it("reports an item with no prior history as new, not growing", () => {
    expect(getTrendStatus(PICADELI, true)).toBe("new");
  });

  it("leaves both verdicts as they were when the fixes are off", () => {
    expect(getTrendStatus(BANANAS)).toBe("accelerating");
    expect(getTrendStatus(PICADELI)).toBe("growing");
  });
});

describe("impact units", () => {
  it("measures the rate change over the days it applied to", () => {
    // (106 - 112.72) * 15 active days. The endpoint's own -6638 is
    // total_after - total_before across 15 days against 73.
    expect(Math.round(impactUnits(BANANAS, true))).toBe(-101);
  });

  it("is zero with no baseline to measure against", () => {
    expect(impactUnits(PICADELI, true)).toBe(0);
  });

  it("passes the endpoint's own figure through when the fixes are off", () => {
    expect(impactUnits(BANANAS)).toBe(-6638);
  });
});

describe("acceleration factor", () => {
  it("is undefined unless both slopes are negative", () => {
    // slope_after is positive — there is no decline to be a multiple of.
    expect(accelerationFactor(BANANAS, true)).toBeNull();
  });

  it("is the ratio of two negative slopes", () => {
    const steeper = { ...BANANAS, slope_before: -0.2, slope_after: -0.8 };
    expect(accelerationFactor(steeper, true)).toBeCloseTo(4, 5);
  });

  it("used to return null for every declining item", () => {
    const steeper = { ...BANANAS, slope_before: -0.2, slope_after: -0.8 };
    expect(accelerationFactor(steeper)).toBeNull();
  });
});

describe("window days", () => {
  it("takes the after window from the response's own two ends", () => {
    // 9/1 - 9/16 inclusive. Bananas sold on 15 of them, which is what makes
    // 16 the only divisor an active rate of <= 100% can come from.
    const { afterWindowDays } = getWindowDays(
      "2026-09-01T00:00:00",
      "2026-09-16T00:00:00",
      90,
      true,
    );
    expect(afterWindowDays).toBe(16);
    expect(BANANAS.active_days_after).toBeLessThanOrEqual(afterWindowDays);
  });

  it("falls back to measuring against today when the fixes are off", () => {
    // A pivot a decade back: the end date says 16 days, "today" says
    // thousands, so the two paths can't be confused whatever day this runs.
    const { afterWindowDays } = getWindowDays(
      "2016-09-01T00:00:00",
      "2016-09-16T00:00:00",
      90,
    );
    expect(afterWindowDays).toBeGreaterThan(1000);
  });
});
