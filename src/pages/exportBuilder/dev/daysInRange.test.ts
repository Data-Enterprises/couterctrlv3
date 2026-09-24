import { describe, expect, it } from "vitest";
import { daysInRange } from "./hooks";

describe("the days a range covers", () => {
  it("includes both ends", () => {
    expect(daysInRange("2026-09-14", "2026-09-17")).toEqual([
      "2026-09-14",
      "2026-09-15",
      "2026-09-16",
      "2026-09-17",
    ]);
  });

  it("gives one day for a range that is one day", () => {
    expect(daysInRange("2026-09-14", "2026-09-14")).toEqual(["2026-09-14"]);
  });

  it("does not skip or repeat a day when the clocks move", () => {
    // US DST starts on 2026-03-08. Stepping a local Date by 24 hours across
    // that boundary lands on the same calendar day twice in one direction and
    // skips one in the other, which is why this is worked out in UTC.
    const days = daysInRange("2026-03-06", "2026-03-10");
    expect(days).toEqual([
      "2026-03-06",
      "2026-03-07",
      "2026-03-08",
      "2026-03-09",
      "2026-03-10",
    ]);
    expect(new Set(days).size).toBe(days.length);
  });

  it("offers nothing for a range too long to tick through", () => {
    // Past a year the section hides and the range itself is the filter.
    expect(daysInRange("2024-01-01", "2026-01-01")).toEqual([]);
  });

  it("offers nothing for a range that runs backwards or is not a date", () => {
    expect(daysInRange("2026-09-17", "2026-09-14")).toEqual([]);
    expect(daysInRange("", "")).toEqual([]);
  });
});
