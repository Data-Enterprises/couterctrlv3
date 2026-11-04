import { describe, expect, it } from "vitest";
import { shiftIsoDay } from "./dates";

describe("shiftIsoDay", () => {
  it("lands on the same weekday a week back across the autumn clock change", () => {
    // The UTC-midnight pattern gave 2026-10-25 here in US time zones.
    expect(shiftIsoDay("2026-11-02", -7)).toBe("2026-10-26");
    expect(shiftIsoDay("2026-11-08", -7)).toBe("2026-11-01");
  });

  it("does the same across the spring change, and forwards", () => {
    expect(shiftIsoDay("2026-03-09", -7)).toBe("2026-03-02");
    expect(shiftIsoDay("2026-03-07", 2)).toBe("2026-03-09");
  });

  it("crosses a month and a year", () => {
    expect(shiftIsoDay("2026-01-03", -7)).toBe("2025-12-27");
  });

  it("takes a timestamp and keeps only its day", () => {
    expect(shiftIsoDay("2026-11-02T00:00:00", 0)).toBe("2026-11-02");
  });
});
