import { describe, it, expect } from "vitest";
import { weeksSay } from "@/pages/sales/dev/investigate/utils/weeks";

const money = (v: number) =>
  "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const weeks = (ly: number, lw: number, tw: number) => [
  { label: "Last year", gap: ly },
  { label: "Last week", gap: lw },
  { label: "This week", gap: tw },
];

describe("weeksSay", () => {
  it("calls a widening gap getting worse, against last week and last year", () => {
    const s = weeksSay(weeks(-4359.73, -8628.5, -13097.66), money);
    expect(s.tone).toBe("worse");
    expect(`${s.lead} ${s.rest}`).toBe(
      "Getting worse. $4,469.16 further behind than last week, and three times last year's gap.",
    );
  });

  it("calls a narrowing gap getting better", () => {
    const s = weeksSay(weeks(-500, -1000, -600), money);
    expect(s.tone).toBe("better");
    expect(s.rest).toBe("$400.00 less behind than last week, and about what it was last year.");
  });

  it("calls a gap within a tenth of last week's a standing difference", () => {
    const s = weeksSay(weeks(-2000, -1000, -1050), money);
    expect(s.lead).toBe("A standing difference.");
    expect(s.rest).toBe("About the same as last week, and narrower than last year.");
  });

  it("says something broke when last week was level or ahead", () => {
    const s = weeksSay(weeks(0, 200, -900), money);
    expect(s.lead).toBe("Something broke this week.");
    expect(s.rest).toBe("$900.00 behind, after being $200.00 ahead last week.");
  });

  it("says when the store is ahead this week", () => {
    expect(weeksSay(weeks(-100, -300, 50), money).rest).toBe("Up from $300.00 behind last week.");
  });
});
