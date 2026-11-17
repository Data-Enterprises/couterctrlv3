import { describe, expect, it } from "vitest";
import { compareHourRows, hourBars } from "@/pages/sales/dev/storePanel/hourly/utils";
import type { HourlySale } from "@/interfaces";

/*
 * The store-against-store hour list: every hour either store traded, and the
 * bars and gaps in money or as a share of each store's day.
 */

const hr = (hour: number, sales: number) =>
  ({ hour, total_sales: sales, total_tax: 0, qty: 1, sale_date: "2026-11-09" }) as HourlySale;
const none = { tw: [], lw: [], ly: [] };

describe("compareHourRows", () => {
  it("keeps an hour only one store traded, with the other at nothing", () => {
    const rows = compareHourRows(
      { tw: [hr(9, 100), hr(10, 50)], lw: [hr(9, 80)], ly: [] },
      { tw: [hr(10, 70), hr(11, 30)], lw: [], ly: [] },
      "sales",
    );
    expect(rows.map((r) => r.hour)).toEqual([9, 10, 11]);
    expect(rows[0]).toMatchObject({ a: 100, b: 0, tyDiff: 100, lwDiff: 80 });
    expect(rows[2]).toMatchObject({ a: 0, b: 30, tyDiff: -30 });
  });
});

describe("hourBars", () => {
  const rows = compareHourRows(
    { tw: [hr(9, 300), hr(10, 100)], lw: [], ly: [] },
    { tw: [hr(9, 100), hr(10, 100)], lw: [], ly: [] },
    "sales",
  );
  const money = (v: number) => "$" + v.toFixed(0);

  it("gives the money gap with its sign", () => {
    const { gapText } = hourBars(rows, "money", money);
    expect(gapText(rows[0])).toBe("+$200");
    expect(gapText(rows[1])).toBe("+$0");
  });

  it("gives the mix gap in points of each store's day", () => {
    const { gapText, shareMine } = hourBars(rows, "mix", money);
    expect(shareMine(rows[0])).toBe(75);
    expect(gapText(rows[0])).toBe("+25.0 pts");
    expect(gapText(rows[1])).toBe("−25.0 pts");
  });

  it("scales the widest bar to the full track", () => {
    expect(hourBars(rows, "money", money).widthOf(300)).toBe("100%");
    expect(hourBars(compareHourRows(none, none, "sales"), "money", money).widthOf(0)).toBe("0%");
  });
});
