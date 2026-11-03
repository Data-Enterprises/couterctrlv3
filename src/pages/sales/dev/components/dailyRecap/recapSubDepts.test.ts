import { describe, expect, it } from "vitest";
import type { SubSale } from "../../../../../interfaces";
import { subDeptsForDay } from "./recapSubDepts";

const row = (
  sale_date: string,
  id: number,
  name: string,
  total: number,
  tax: number,
  is_hash = false,
) =>
  ({
    sale_date: `${sale_date}T00:00:00`,
    sub_department: id,
    sub_department_description: name,
    total_sales: total,
    total_tax: tax,
    qty: 2,
    weight: 0,
    is_hash,
  }) as SubSale;

describe("a day's sub depts", () => {
  const subs = [
    row("2026-10-30", 1, "Burgers", 110, 10),
    row("2026-10-30", 2, "Hot Dogs", 330, 30),
    row("2026-10-30", 1, "Burgers", 105, 5),
    row("2026-10-30", 9, "Lottery", 500, 0, true),
    row("2026-10-29", 2, "Hot Dogs", 999, 0),
  ];

  it("lists that day's counted sub depts, biggest sales first, net of tax", () => {
    const { rows } = subDeptsForDay(subs, "2026-10-30");
    expect(rows.map((r) => [r.name, r.net, r.units])).toEqual([
      ["Hot Dogs", 300, 2],
      ["Burgers", 200, 4],
    ]);
  });

  it("gives each a share of the counted day", () => {
    const { rows } = subDeptsForDay(subs, "2026-10-30");
    expect(rows[0].share).toBeCloseTo(60);
    expect(rows[1].share).toBeCloseTo(40);
  });

  it("keeps fuel and lottery out of the list but reports them", () => {
    const { rows, leftOut } = subDeptsForDay(subs, "2026-10-30");
    expect(rows.some((r) => r.name === "Lottery")).toBe(false);
    expect(leftOut).toEqual([{ name: "Lottery", net: 500 }]);
  });
});
