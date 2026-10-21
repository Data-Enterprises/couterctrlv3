import { describe, expect, it } from "vitest";
import { storeMarginPctOf, storeMarginDeltaOf } from "./index";
import { marginPct } from "../../../utils/grading";
import type { MarginDollars } from "../../../utils/grading";

/**
 * The store margin is weighted, not averaged.
 *
 * Tommy's test run loaded Sub Dept Margins and Vendors for store 361, week
 * ending 10/20/2026, and got 31.91% against 27.04%. Both pages read the same
 * `subs/subs` rows, so one of them had to be wrong: this screen was averaging
 * the departments' percentages, which gives a florist the same vote as a
 * wholesaler. These tests hold the weighting in place.
 */
const dept = (
  net: number,
  cogs: number,
  over: Partial<MarginDollars> = {},
): MarginDollars => ({
  net,
  cogs,
  lw: { tyNet: net, tyCogs: cogs, refNet: 0, refCogs: 0 },
  ly: { tyNet: net, tyCogs: cogs, refNet: 0, refCogs: 0 },
  ...over,
});

describe("storeMarginPctOf", () => {
  it("weights by the money each department took", () => {
    // Grocery: $90,000 at 25%. Floral: $1,000 at 70%.
    const grocery = dept(90_000, 67_500);
    const floral = dept(1_000, 300);
    const weighted = storeMarginPctOf([grocery, floral])!;

    // The store kept $23,200 of $91,000.
    expect(weighted).toBeCloseTo(25.49, 2);

    // What the mean of the two rates would have said, for contrast.
    const mean = (25 + 70) / 2;
    expect(mean).toBeCloseTo(47.5, 2);
    expect(weighted).toBeLessThan(mean - 20);
  });

  it("agrees with one margin taken over the summed dollars", () => {
    // The property that makes this screen and Vendors line up: whichever way
    // the rows are grouped, net over net gives the same number.
    const depts = [dept(1_234.56, 900.1), dept(77.4, 12.9), dept(5_000, 4_100)];
    const net = depts.reduce((a, d) => a + d.net, 0);
    const cogs = depts.reduce((a, d) => a + d.cogs, 0);
    expect(storeMarginPctOf(depts)!).toBeCloseTo(marginPct(net, cogs), 10);
  });

  it("does not let a tiny department move the store", () => {
    const big = dept(500_000, 375_000);
    const crumb = dept(2, 0);
    const withCrumb = storeMarginPctOf([big, crumb])!;
    expect(withCrumb).toBeCloseTo(25, 1);
  });

  it("is null with nothing to average and with nothing sold", () => {
    expect(storeMarginPctOf([])).toBeNull();
    expect(storeMarginPctOf([dept(0, 0)])).toBeNull();
  });

  it("reports a loss as a loss", () => {
    // Sold below cost all week. A floor at zero would hide it.
    expect(storeMarginPctOf([dept(100, 130)])!).toBeCloseTo(-30, 10);
  });
});

describe("storeMarginDeltaOf", () => {
  const withLw = (
    tyNet: number,
    tyCogs: number,
    refNet: number,
    refCogs: number,
  ) => dept(tyNet, tyCogs, { lw: { tyNet, tyCogs, refNet, refCogs } });

  it("compares two store rates, not a mean of department moves", () => {
    // Grocery held 25%. Floral fell 70% -> 40%, on $1,000 of a $91,000 week.
    const grocery = withLw(90_000, 67_500, 90_000, 67_500);
    const floral = withLw(1_000, 600, 1_000, 300);
    const delta = storeMarginDeltaOf([grocery, floral], "lw")!;

    // The store gave up $300 of $91,000: a third of a point.
    expect(delta).toBeCloseTo(-0.33, 2);

    // Averaging the two departments' moves would have called it -15.
    const meanOfMoves = (0 + (40 - 70)) / 2;
    expect(meanOfMoves).toBe(-15);
  });

  it("leaves out a department with nothing on the other side", () => {
    const compared = withLw(1_000, 700, 1_000, 700);
    // What a department with no last week actually looks like: both sides
    // zero. computeMarginDayMatched adds the TY side only on days that found
    // a counterpart, so a department with no matched day contributes to
    // neither -- which is why a store with new departments in it still reads
    // flat rather than wildly up.
    const newDept = withLw(0, 0, 0, 0);
    expect(storeMarginDeltaOf([compared, newDept], "lw")!).toBeCloseTo(0, 10);
  });

  it("is null where a side has no sales at all", () => {
    expect(storeMarginDeltaOf([withLw(100, 50, 0, 0)], "lw")).toBeNull();
    expect(storeMarginDeltaOf([withLw(0, 0, 100, 50)], "lw")).toBeNull();
    expect(storeMarginDeltaOf([], "lw")).toBeNull();
  });

  it("reads each side independently", () => {
    // LW matched, LY did not. The two must not borrow from each other.
    const d: MarginDollars = {
      net: 1_000,
      cogs: 700,
      lw: { tyNet: 1_000, tyCogs: 700, refNet: 1_000, refCogs: 750 },
      ly: { tyNet: 0, tyCogs: 0, refNet: 0, refCogs: 0 },
    };
    expect(storeMarginDeltaOf([d], "lw")!).toBeCloseTo(5, 10);
    expect(storeMarginDeltaOf([d], "ly")).toBeNull();
  });
});
