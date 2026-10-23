import { describe, expect, it } from "vitest";
import { storeMarginDelta, type MarginRow } from "./storeMarginDelta";

/**
 * Sub Dept Margins and Vendors read the same rows and must agree on what the
 * store did. Their headline margins did; their last-week deltas were -5.36
 * and -5.39 on Bruces 361, because each matched days at its own grouping.
 * Matching once, over every row the store rang, is what makes them equal.
 */
const at = (
  sale_date: string,
  sales: number,
  cost: number,
  qty = 1,
): MarginRow => ({
  sale_date,
  total_sales: sales,
  total_tax: 0,
  net_cost: cost,
  cost,
  case_size: 0,
  qty,
  weight: 0,
});

describe("storeMarginDelta", () => {
  it("compares the two rates over the days both weeks have", () => {
    // 10/14: $100 at $70 cost -> 30%. Last week the same day: $100 at $75 -> 25%.
    const tw = [at("2026-10-14", 100, 70)];
    const lw = [at("2026-10-07", 100, 75)];
    expect(storeMarginDelta(tw, lw, "lw")).toBeCloseTo(5, 10);
  });

  it("drops a day the other week does not have, from BOTH sides", () => {
    // 10/15 has no counterpart, so it joins neither side -- otherwise a
    // seven-day rate is compared against a six-day one.
    const tw = [at("2026-10-14", 100, 70), at("2026-10-15", 500, 100)];
    const lw = [at("2026-10-07", 100, 75)];
    expect(storeMarginDelta(tw, lw, "lw")).toBeCloseTo(5, 10);
  });

  it("does not care how the rows are grouped", () => {
    // The whole point. The same day split across two departments, or two
    // vendors, or arriving as one row, is the same store day.
    const one = [at("2026-10-14", 100, 70)];
    const split = [at("2026-10-14", 60, 42), at("2026-10-14", 40, 28)];
    const lw = [at("2026-10-07", 100, 75)];
    expect(storeMarginDelta(split, lw, "lw")).toBeCloseTo(
      storeMarginDelta(one, lw, "lw")!,
      10,
    );
  });

  it("reads last year 364 days back, not 365", () => {
    // 52 whole weeks, so a Wednesday meets a Wednesday.
    const tw = [at("2026-10-14", 100, 70)];
    const ly = [at("2025-10-15", 100, 80)];
    expect(storeMarginDelta(tw, ly, "ly")).toBeCloseTo(10, 10);
    expect(storeMarginDelta(tw, [at("2025-10-14", 100, 80)], "ly")).toBeNull();
  });

  it("is null when there is nothing to compare", () => {
    const tw = [at("2026-10-14", 100, 70)];
    expect(storeMarginDelta(tw, [], "lw")).toBeNull();
    expect(storeMarginDelta([], [at("2026-10-07", 100, 75)], "lw")).toBeNull();
  });

  it("costs by weight where the item is weighed", () => {
    // The canonical rule: a scale item's qty is a scan count, not an amount.
    const weighed: MarginRow = {
      ...at("2026-10-14", 100, 2),
      qty: 10,
      weight: 25,
    };
    // 25 lb at $2 is $50 of cost against $100 -- 50%, not the 80% a count
    // of 10 would have given.
    expect(
      storeMarginDelta([weighed], [at("2026-10-07", 100, 50, 1)], "lw"),
    ).toBeCloseTo(0, 10);
  });
});
