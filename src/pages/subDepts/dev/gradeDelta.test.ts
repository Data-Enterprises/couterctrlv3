import { describe, expect, it } from "vitest";
import { getGradeDelta } from "./index";
import type { SubDeptGrade } from "../../../features/dev/devSubMarginSlice";

/**
 * The same rule Vendors needed: a margin points delta is a comparison of two
 * rates, and a rate needs sales to be a rate of.
 */
const grade = (over: Partial<SubDeptGrade>): SubDeptGrade =>
  ({
    tyMarginPct: 24,
    lwSales: 12.5,
    lwMarginPct: 24,
    lySales: 0,
    lyMarginPct: null,
    hasLW: true,
    hasLY: false,
    vsLWSalesPct: 0,
    vsLYSalesPct: 0,
    ptsDelta: null,
    lwPtsDelta: null,
    noCostCount: 0,
    tySales: 37.5,
    // Every day of the week matched last week, so LW is a valid basis.
    coverage: { dayCount: 7, lwDayCount: 7, lyDayCount: 0 },
    tyWeekOneMargins: [],
    lyWeekOneMargins: [],
    lwWeekOneMargins: [],
    ...over,
  }) as unknown as SubDeptGrade;

describe("a department the week cannot be compared for", () => {
  it("has no delta to grade on", () => {
    // Sold on different days each week: the matched day is one this week
    // sold nothing on, which used to grade as a collapse.
    expect(getGradeDelta(grade({ lwPtsDelta: null }), "margin")).toBeNull();
  });

  it("still grades on sales, which a zero week legitimately answers", () => {
    // -100% is a real and useful number: it sold last week and not this one.
    expect(
      getGradeDelta(grade({ vsLWSalesPct: -100 }), "sales"),
    ).toBeCloseTo(-100, 2);
  });

  it("passes a real margin comparison straight through", () => {
    expect(getGradeDelta(grade({ lwPtsDelta: -6.5 }), "margin")).toBeCloseTo(
      -6.5,
      2,
    );
  });
});
