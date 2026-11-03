import { describe, expect, it } from "vitest";
import { dayLabel, hourRange, pounds } from "./recapFormat";

describe("recap labels", () => {
  it("writes an hour the way the Hourly tab does", () => {
    expect(hourRange(0)).toBe("12 AM – 1 AM");
    expect(hourRange(12)).toBe("12 PM – 1 PM");
    expect(hourRange(23)).toBe("11 PM – 12 AM");
  });

  it("names a day without letting a time zone move it", () => {
    expect(dayLabel("2026-10-30")).toBe("Fri 10/30");
    expect(dayLabel("2026-11-01")).toBe("Sun 11/1");
  });

  it("gives pounds one decimal", () => {
    expect(pounds(129)).toBe("129.0");
    expect(pounds(1234.56)).toBe("1,234.6");
  });
});
