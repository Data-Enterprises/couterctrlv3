import { describe, expect, it } from "vitest";
import type { HourlySale } from "../../../../../interfaces";
import { hoursForDay } from "./recapHours";

const hour = (sale_date: string, hr: number, net: number) =>
  ({
    sale_date: `${sale_date}T00:00:00`,
    hour: hr,
    total_sales: net + 1,
    total_tax: 1,
    transactions: 1,
  }) as HourlySale;

describe("a day's shape by hour", () => {
  const day = [
    hour("2026-10-30", 6, 40),
    hour("2026-10-30", 7, 95),
    hour("2026-10-30", 9, 120),
    hour("2026-10-30", 18, 410),
    hour("2026-10-30", 23, 22),
    hour("2026-10-29", 12, 9999),
  ];

  it("runs from the first trading hour to the last, gaps at zero", () => {
    const s = hoursForDay(day, "2026-10-30");
    expect(s.first).toBe(6);
    expect(s.last).toBe(23);
    expect(s.hours).toHaveLength(18);
    expect(s.hours.find((h) => h.hour === 8)?.net).toBe(0);
  });

  it("names the busiest hour by net sales, net of tax", () => {
    expect(hoursForDay(day, "2026-10-30").peak).toEqual({ hour: 18, net: 410 });
  });

  it("never calls the opening or closing part-hour the slowest", () => {
    // 11 PM ($22) and 6 AM ($40) are part-hours; 8 AM sold nothing in between.
    expect(hoursForDay(day, "2026-10-30").slowest).toEqual({ hour: 8, net: 0 });
  });

  it("has no shape on a day with no hourly rows", () => {
    expect(hoursForDay(day, "2026-10-28")).toEqual({
      hours: [],
      peak: null,
      slowest: null,
      first: null,
      last: null,
    });
  });
});
