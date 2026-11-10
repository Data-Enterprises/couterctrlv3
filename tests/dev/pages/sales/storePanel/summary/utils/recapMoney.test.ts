import { describe, expect, it } from "vitest";
import type { SubSale } from "@/interfaces";
import { moneyForDates } from "@/pages/sales/dev/storePanel/summary/utils/recapMoney";

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

describe("a period's money", () => {
  const subs = [
    row("2026-10-30", "Grocery", 1080, 80),
    row("2026-10-30", "Deli", 540, 40),
    row("2026-10-30", "Fuel", 900, 0, true),
    row("2026-10-30", "Lottery", 300, 0, true),
    row("2026-10-29", "Grocery", 5000, 400),
  ];

  it("adds the counted tax to the day card's net, so the sum is exact", () => {
    const m = moneyForDates(subs, ["2026-10-30"], 1500);
    expect(m).toMatchObject({ net: 1500, tax: 120, withTax: 1620 });
  });

  it("takes every day's counted tax for the week", () => {
    const m = moneyForDates(subs, ["2026-10-29", "2026-10-30"], 6000);
    expect(m).toMatchObject({ net: 6000, tax: 520, withTax: 6520 });
  });
});
