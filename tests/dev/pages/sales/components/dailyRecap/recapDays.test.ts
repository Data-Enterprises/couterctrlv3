import { describe, expect, it } from "vitest";
import type { DayDot, HourlySale, SubSale } from "@/interfaces";
import {
  avgBasket,
  avgItemPrice,
  buildRecapDays,
  itemsPerBasket,
  perTradingHour,
  sellsByWeight,
  tradingHours,
  weekOf,
} from "@/pages/sales/dev/components/dailyRecap/recapDays";

const dot = (sale_date: string, twNet: number, twQty: number): DayDot => ({
  sale_date: `${sale_date}T00:00:00`,
  twNet,
  twQty,
  lwNet: null,
  lyNet: null,
  lwQty: null,
  lyQty: null,
});

const hour = (sale_date: string, hr: number, net: number, transactions: number) =>
  ({
    sale_date: `${sale_date}T00:00:00`,
    hour: hr,
    total_sales: net,
    total_tax: 0,
    transactions,
  }) as HourlySale;

const sub = (sale_date: string, weight: number, is_hash = false) =>
  ({
    sale_date: `${sale_date}T00:00:00`,
    sub_department: 1,
    sub_department_description: "Meat",
    total_sales: 10,
    total_tax: 0,
    qty: 1,
    weight,
    is_hash,
  }) as SubSale;

describe("the day rows", () => {
  const dates = ["2026-10-29", "2026-10-30"];

  it("take net sales and units from the day card, not from sub depts", () => {
    const [, fri] = buildRecapDays(dates, [dot("2026-10-30", 3412.62, 1904)], [], []);
    expect(fri.net).toBe(3412.62);
    expect(fri.units).toBe(1904);
    expect(fri.hasSales).toBe(true);
  });

  it("keep a day the card list has no row for, at zero", () => {
    const [thu] = buildRecapDays(dates, [dot("2026-10-30", 1, 1)], [], []);
    expect(thu).toMatchObject({ date: "2026-10-29", net: 0, hasSales: false });
    expect(thu.hours.peak).toBeNull();
  });

  it("count transactions across the day's hours", () => {
    const hourly = [hour("2026-10-30", 12, 500, 60), hour("2026-10-30", 18, 900, 80)];
    const [, fri] = buildRecapDays(dates, [], [], hourly);
    expect(fri.transactions).toBe(140);
    expect(fri.hours.peak?.hour).toBe(18);
  });

  it("weigh only the counted sub depts", () => {
    const subs = [sub("2026-10-30", 12.5), sub("2026-10-30", 400, true)];
    const [, fri] = buildRecapDays(dates, [], subs, []);
    expect(fri.pounds).toBe(12.5);
  });
});

describe("the week as one period", () => {
  const hourly = [
    hour("2026-10-29", 12, 300, 30),
    hour("2026-10-29", 13, 100, 10),
    hour("2026-10-30", 12, 200, 20),
    hour("2026-10-30", 14, 700, 50),
  ];
  const days = buildRecapDays(
    ["2026-10-28", "2026-10-29", "2026-10-30"],
    [dot("2026-10-29", 400, 10), dot("2026-10-30", 900, 20)],
    [sub("2026-10-29", 2), sub("2026-10-30", 3)],
    hourly,
  );
  const week = weekOf(days, hourly);

  it("sums the days' figures, the way All week's card does", () => {
    expect(week).toMatchObject({
      net: 1300,
      units: 30,
      pounds: 5,
      transactions: 110,
      hasSales: true,
    });
  });

  it("sums each hour across the days, so the busiest is the week's usual one", () => {
    expect(week.hours.hours.map((h) => [h.hour, h.net])).toEqual([
      [12, 500],
      [13, 100],
      [14, 700],
    ]);
    expect(week.hours.peak?.hour).toBe(14);
  });

  it("adds up the hours each day traded, so per hour is per hour open", () => {
    expect(tradingHours(week)).toBe(2 + 3);
    expect(perTradingHour(week.net, week)).toBe(260);
  });

  it("has no sales only when no day does", () => {
    expect(weekOf(buildRecapDays(["2026-10-28"], [], [], []), []).hasSales).toBe(false);
  });
});

describe("per-basket figures", () => {
  it("divide by baskets or units, and are absent with nothing to divide by", () => {
    expect(avgBasket(100, 4)).toBe(25);
    expect(avgBasket(100, 0)).toBeNull();
    expect(itemsPerBasket(18, 4)).toBe(4.5);
    expect(itemsPerBasket(18, 0)).toBeNull();
    expect(avgItemPrice(30, 12)).toBe(2.5);
    expect(avgItemPrice(30, 0)).toBeNull();
  });

  it("spread a figure over the hours the day traded, first to last", () => {
    const hourly = [hour("2026-10-30", 7, 10, 1), hour("2026-10-30", 19, 10, 1)];
    const [fri] = buildRecapDays(["2026-10-30"], [dot("2026-10-30", 1300, 10)], [], hourly);
    expect(tradingHours(fri)).toBe(13);
    expect(perTradingHour(1300, fri)).toBe(100);
    const [quiet] = buildRecapDays(["2026-10-28"], [], [], []);
    expect(perTradingHour(1300, quiet)).toBeNull();
  });

  it("shows Pounds only for a store that weighs a counted sub dept", () => {
    expect(sellsByWeight([sub("2026-10-30", 0)])).toBe(false);
    expect(sellsByWeight([sub("2026-10-30", 3, true)])).toBe(false);
    expect(sellsByWeight([sub("2026-10-30", 3)])).toBe(true);
  });
});
