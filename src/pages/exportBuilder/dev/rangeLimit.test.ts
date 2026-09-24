import { describe, expect, it } from "vitest";
import { MAX_RANGE_DAYS, countDays, rangeBlock } from "./rangeLimit";

describe("the longest range the page will search", () => {
  it("is a month and a day, so a calendar month always fits", () => {
    // The figure the help page quotes. A quiet change to it is the kind that
    // surprises somebody mid-month.
    expect(MAX_RANGE_DAYS).toBe(31);
    expect(rangeBlock("2026-08-01", "2026-08-31")).toBeNull();
    expect(rangeBlock("2026-09-01", "2026-09-30")).toBeNull();
  });

  it("counts both ends", () => {
    expect(countDays("2026-09-01", "2026-09-01")).toBe(1);
    expect(countDays("2026-09-01", "2026-09-07")).toBe(7);
  });

  it("refuses the range that started this, and says how long it was", () => {
    // 1 August to 23 September: 54 days, and the card let it through.
    const why = rangeBlock("2026-08-01", "2026-09-23");
    expect(why).toMatch(/54 days/);
    expect(why).toMatch(/31 days at a time/);
  });

  it("refuses a range that runs backwards", () => {
    expect(rangeBlock("2026-09-23", "2026-08-01")).toMatch(
      /end date is before the start/,
    );
  });

  it("counts the same across a clock change", () => {
    // US DST starts 2026-03-08. Stepping a local Date by 24 hours over it
    // loses or repeats a day, and a limit that miscounts by one is worse
    // than no limit.
    expect(countDays("2026-03-01", "2026-03-31")).toBe(31);
    expect(rangeBlock("2026-03-01", "2026-03-31")).toBeNull();
  });

  it("says nothing about a range it cannot read, rather than blocking it", () => {
    expect(rangeBlock("", "")).toMatch(/before the start/);
  });
});
