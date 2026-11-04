import { describe, expect, it } from "vitest";
import { datesBetween } from "./recapRange";

describe("an export's dates", () => {
  it("is one day, or every day of a range, inclusive", () => {
    expect(datesBetween("2026-11-03", "2026-11-03")).toEqual(["2026-11-03"]);
    expect(datesBetween("2026-11-01", "2026-11-03")).toEqual([
      "2026-11-01",
      "2026-11-02",
      "2026-11-03",
    ]);
  });

  it("crosses a month and the clock change without losing a day", () => {
    expect(datesBetween("2026-10-31", "2026-11-02")).toEqual([
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
  });

  it("is empty backwards or without dates", () => {
    expect(datesBetween("2026-11-03", "2026-11-01")).toEqual([]);
    expect(datesBetween("", "2026-11-01")).toEqual([]);
  });
});
