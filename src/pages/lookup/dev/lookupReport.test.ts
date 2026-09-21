import { describe, expect, it } from "vitest";
import type { DayBucket } from "./lookupMetrics";
import {
  bestDay,
  dayLabel,
  dayMargin,
  dayNumber,
  dayShare,
  formatSignedPct,
  vsSellingAverage,
  windowTotals,
} from "./lookupReport";

const bucket = (
  date: string,
  revenue: number,
  units: number,
  cost = 0,
): DayBucket => ({
  date,
  label: date.slice(5),
  qty: 0,
  units,
  revenue,
  cost,
  listPrice: 7.99,
  hasSale: units > 0 || revenue !== 0,
  hasCost: cost > 0,
});

/** Picadeli Salad Bar's real shape: sells by weight, rings qty 0, no cost on
 *  file, and one dead day at the end of the window. */
const WINDOW: DayBucket[] = [
  bucket("2026-09-07", 666.31, 88.45),
  bucket("2026-09-08", 536.44, 71.2),
  bucket("2026-09-09", 391.51, 48.03),
  bucket("2026-09-10", 479.4, 66.54),
  bucket("2026-09-16", 0, 0),
];

describe("windowTotals", () => {
  it("counts selling days, not days in the window", () => {
    const t = windowTotals(WINDOW);
    expect(t.sellingDays).toBe(4);
    expect(t.windowDays).toBe(5);
  });

  it("sums takings and priced units", () => {
    const t = windowTotals(WINDOW);
    expect(t.revenue).toBeCloseTo(2073.66, 2);
    expect(t.units).toBeCloseTo(274.22, 2);
  });

  it("reports no cost when nothing on file has one", () => {
    expect(windowTotals(WINDOW).hasCost).toBe(false);
    expect(windowTotals([bucket("2026-09-07", 10, 2, 4)]).hasCost).toBe(true);
  });
});

describe("bestDay", () => {
  it("is the biggest by takings", () => {
    expect(bestDay(WINDOW)?.date).toBe("2026-09-07");
  });

  it("never picks a day that did not sell", () => {
    expect(bestDay([bucket("2026-09-16", 0, 0)])).toBeNull();
  });
});

describe("vsSellingAverage", () => {
  it("measures against the days that sold, not the window", () => {
    // Mean of the four selling days is 518.415. The dead day must not drag it
    // down to 414.73, which would turn an ordinary day into a triumph.
    const best = WINDOW[0];
    expect(vsSellingAverage(best, WINDOW)).toBeCloseTo(28.53, 1);
  });

  it("has no answer for a day that did not sell", () => {
    expect(vsSellingAverage(WINDOW[4], WINDOW)).toBeNull();
  });
});

describe("dayShare", () => {
  it("is the day against the window", () => {
    expect(dayShare(WINDOW[0], 2073.66)).toBeCloseTo(32.13, 2);
  });

  it("is null rather than zero when nothing was taken", () => {
    expect(dayShare(WINDOW[0], 0)).toBeNull();
  });
});

describe("dayMargin", () => {
  it("needs a cost, not just a sale", () => {
    expect(dayMargin(bucket("2026-09-07", 100, 10))).toBeNull();
    expect(dayMargin(bucket("2026-09-07", 100, 10, 40))).toBeCloseTo(60, 5);
  });
});

describe("dayLabel", () => {
  it("does not roll back a day in a negative UTC offset", () => {
    // `new Date("2026-09-15")` is UTC midnight, which is Sep 14 everywhere in
    // the US. Every label on the screen would be off by one.
    expect(dayLabel("2026-09-15")).toBe("Tue, Sep 15");
    expect(dayNumber("2026-09-05")).toBe("5");
  });
});

describe("formatSignedPct", () => {
  it("signs a gain and leaves a loss alone", () => {
    expect(formatSignedPct(28.5)).toBe("+28.5%");
    expect(formatSignedPct(-12.4)).toBe("-12.4%");
    expect(formatSignedPct(0)).toBe("0.0%");
  });

  it("drops the decimal once the number is large enough not to need it", () => {
    expect(formatSignedPct(240)).toBe("+240%");
  });
});
