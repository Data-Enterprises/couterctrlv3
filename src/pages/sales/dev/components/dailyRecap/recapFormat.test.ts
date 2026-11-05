import { describe, expect, it } from "vitest";
import { dayLabel, hourRange, hourSpan, hourTick, pounds, weight3 } from "./recapFormat";

describe("recap labels", () => {
  it("writes an hour the way the Hourly tab does", () => {
    expect(hourRange(0)).toBe("12 AM – 1 AM");
    expect(hourRange(12)).toBe("12 PM – 1 PM");
    expect(hourRange(23)).toBe("11 PM – 12 AM");
  });

  it("writes the meridiem once when both ends of an hour share it", () => {
    expect(hourSpan(12)).toBe("12 – 1 PM");
    expect(hourSpan(8)).toBe("8 – 9 AM");
    expect(hourSpan(11)).toBe("11 AM – 12 PM");
    expect(hourTick(7)).toBe("7a");
    expect(hourTick(13)).toBe("1p");
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

describe("the item view's weight", () => {
  it("shows three places, no unit", () => {
    expect(weight3(105.7)).toBe("105.700");
    expect(weight3(3323.25)).toBe("3,323.250");
  });
});
