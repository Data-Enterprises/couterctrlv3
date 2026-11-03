import { describe, expect, it } from "vitest";
import type { SubSale } from "../../../../../interfaces";
import { moneyForDay } from "./recapMoney";

const row = (sale_date: string, name: string, total: number, tax: number, is_hash = false) =>
  ({
    sale_date: `${sale_date}T00:00:00`,
    sub_department: 1,
    sub_department_description: name,
    total_sales: total,
    total_tax: tax,
    qty: 1,
    weight: 0,
    is_hash,
  }) as SubSale;

describe("a day's money", () => {
  const subs = [
    row("2026-10-30", "Grocery", 1080, 80),
    row("2026-10-30", "Deli", 540, 40),
    row("2026-10-30", "Fuel", 900, 0, true),
    row("2026-10-30", "Lottery", 300, 0, true),
    row("2026-10-29", "Grocery", 5000, 400),
  ];

  it("adds the counted tax to the day card's net, so the sum is exact", () => {
    const m = moneyForDay(subs, "2026-10-30", 1500);
    expect(m).toMatchObject({ net: 1500, tax: 120, withTax: 1620 });
  });

  it("names fuel and lottery as left out of net, biggest first", () => {
    expect(moneyForDay(subs, "2026-10-30", 1500).leftOut).toEqual([
      { name: "Fuel", net: 900 },
      { name: "Lottery", net: 300 },
    ]);
  });

  it("leaves out nothing at a store with no excluded sub depts", () => {
    expect(moneyForDay([row("2026-10-30", "Burgers", 10, 1)], "2026-10-30", 9).leftOut).toEqual([]);
  });
});
