import { describe, expect, it } from "vitest";
import type { UpcTrend } from "../../../../../interfaces";
import { accelerationFactor, getTrendStatus, impactUnits, isDecline } from "./trendStats";
import { getTrendInsight } from "./trendPhrase";
import { trendRequest } from "./trendWindow";

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

describe("trend window", () => {
  // Read on 9/17, the day after the live answer above was taken.
  const sept17 = new Date(2026, 8, 17, 15, 30);

  it("asks for the days since the start date plus the baseline", () => {
    // The endpoint counts back from today, so 90 alone would leave 74 days
    // of "before" for a 9/1 search read on 9/17.
    const { periods, window } = trendRequest("9/1/2026", 90, sept17);
    expect(periods).toBe(106);
    expect(window.beforeDays).toBe(90);
  });

  it("counts the after window from the start date through yesterday", () => {
    // 9/1 - 9/16: bananas sold on 15 of those 16 days.
    const { window } = trendRequest("9/1/2026", 90, sept17);
    expect(window.afterDays).toBe(16);
    expect(BANANAS.active_days_after).toBeLessThanOrEqual(window.afterDays);
  });

  it("keeps a full baseline however old the search is", () => {
    // A start date 200 days back used to leave no "before" at all.
    const { periods, window } = trendRequest("3/1/2026", 90, sept17);
    expect(window.afterDays).toBe(200);
    expect(periods).toBe(290);
    expect(window.beforeDays).toBe(90);
  });
});

describe("an item that stopped selling", () => {
  // Bananas' before half, and not a sale since.
  const STOPPED: UpcTrend = {
    ...BANANAS,
    slope_after: 0,
    mean_after: 0,
    pct_change_mean: -100,
    total_after: 0,
    active_days_after: 0,
  };
  const window = { pivot: "9/1/2026", beforeDays: 90, afterDays: 16 };

  it("is Stopped selling, not Growing", () => {
    // The old formula gave (0 - 112.72) x 0 = 0, and 0 counted as growing.
    expect(getTrendStatus(STOPPED, true, window)).toBe("stopped");
    expect(isDecline("stopped")).toBe(true);
  });

  it("lost what it would have sold at its old pace", () => {
    // 8228.4 units over 90 days, for 16 days: about 1,463 not sold.
    expect(Math.round(impactUnits(STOPPED, true, window))).toBe(-1463);
  });

  it("says so in plain words", () => {
    const text = getTrendInsight(STOPPED, "stopped", true, window);
    expect(text).toContain("nothing since 9/1");
    expect(text).toContain("1,463 units not sold");
  });
});

describe("reduced availability", () => {
  const window = { pivot: "9/1/2026", beforeDays: 90, afterDays: 16 };
  // 10 a day on 85 of 90 days before; 11 a day since, but on 8 of 16 days.
  const SHORT: UpcTrend = {
    ...BANANAS,
    mean_before: 10,
    total_before: 850,
    active_days_before: 85,
    mean_after: 11,
    total_after: 88,
    active_days_after: 8,
    pct_change_mean: 10,
  };

  it("comes up when it sold faster on the days it sold, but on fewer days", () => {
    // 9.4 a calendar day before, 5.5 since. It used to be unreachable.
    expect(getTrendStatus(SHORT, true, window)).toBe("reduced-availability");
    expect(Math.round(impactUnits(SHORT, true, window))).toBe(-63);
  });

  it("is growing when it sold on as many days too", () => {
    const steady = { ...SHORT, active_days_after: 16, total_after: 176 };
    expect(getTrendStatus(steady, true, window)).toBe("growing");
  });

  it("describes the drop as a share of days", () => {
    const text = getTrendInsight(SHORT, "reduced-availability", true, window);
    expect(text).toContain("50% of days since, down from 94% before");
  });
});

