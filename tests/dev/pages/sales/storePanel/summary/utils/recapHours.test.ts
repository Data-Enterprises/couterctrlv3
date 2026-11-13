import { describe, expect, it } from "vitest";
import type { HourlySale } from "@/interfaces";
import { hoursForDates, hoursForDay } from "@/pages/sales/dev/storePanel/summary/utils/recapHours";

const hour = (sale_date: string, hr: number, net: number) =>
  ({
    sale_date: `${sale_date}T00:00:00`,
    hour: hr,
    total_sales: net + 1,
    total_tax: 1,
    transactions: 2,
    qty: 3,
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
    expect(hoursForDay(day, "2026-10-30").peak).toMatchObject({ hour: 18, net: 410 });
  });

  it("carries each hour's baskets and qty for its tooltip", () => {
    const s = hoursForDay([...day, hour("2026-10-30", 18, 90)], "2026-10-30");
    expect(s.peak).toEqual({ hour: 18, net: 500, transactions: 4, qty: 6 });
  });

  it("never calls the opening or closing part-hour the slowest", () => {
    // 11 PM ($22) and 6 AM ($40) are part-hours; 8 AM sold nothing in between.
    expect(hoursForDay(day, "2026-10-30").slowest).toMatchObject({ hour: 8, net: 0 });
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

describe("several days' shape by hour", () => {
  it("sums each hour across the days and spans the widest of them", () => {
    const s = hoursForDates(
      [hour("2026-10-29", 9, 50), hour("2026-10-29", 12, 100), hour("2026-10-30", 12, 300), hour("2026-10-30", 15, 20)],
      ["2026-10-29", "2026-10-30"],
    );
    expect(s.hours.map((h) => [h.hour, h.net, h.transactions])).toEqual([
      [9, 50, 2],
      [10, 0, 0],
      [11, 0, 0],
      [12, 400, 4],
      [13, 0, 0],
      [14, 0, 0],
      [15, 20, 2],
    ]);
    expect(s.peak?.hour).toBe(12);
    expect([s.first, s.last]).toEqual([9, 15]);
  });

  it("leaves out a day it was not asked for", () => {
    const s = hoursForDates([hour("2026-10-29", 9, 50), hour("2026-10-28", 9, 70)], ["2026-10-29"]);
    expect(s.peak?.net).toBe(50);
  });
});
