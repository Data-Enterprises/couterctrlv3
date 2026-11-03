import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SubDeptMargin } from "../../../../../interfaces";
import { loadWeekItems } from "./recapLoad";

const fetchRows = vi.fn();
vi.mock("../../../../../utils/marginRows", () => ({
  fetchSubDeptRowsOrEmpty: (...args: unknown[]) => fetchRows(...args),
}));

const row = (store_number: string, product_code: string) =>
  ({
    store_number,
    product_code,
    product_description: `Item ${product_code}`,
    sub_department: 1,
    sub_department_description: "Drinks",
    total_sales: 10,
    total_tax: 0,
    qty: 1,
    weight: 0,
  }) as SubDeptMargin;

describe("the week's items, for the export", () => {
  beforeEach(() => fetchRows.mockReset());

  it("reads each day on its own, every sub dept, for this location only", async () => {
    fetchRows.mockResolvedValue([row("369", "a"), row("370", "b")]);
    const week = await loadWeekItems("u/", "t", 685, "369", ["2026-10-29", "2026-10-30"]);
    expect(fetchRows.mock.calls.map((c) => c.slice(2))).toEqual([
      [0, "2026-10-29", "2026-10-29", 0, 685, 1],
      [0, "2026-10-30", "2026-10-30", 0, 685, 1],
    ]);
    expect(week.map((d) => d.items.map((i) => i.code))).toEqual([["a"], ["a"]]);
  });

  it("marks a day that failed and keeps the rest", async () => {
    fetchRows.mockResolvedValueOnce([row("369", "a")]).mockRejectedValueOnce(new Error("502"));
    const week = await loadWeekItems("u/", "t", 685, "369", ["2026-10-29", "2026-10-30"]);
    expect(week.map((d) => [d.date, d.items.length, !!d.failed])).toEqual([
      ["2026-10-29", 1, false],
      ["2026-10-30", 0, true],
    ]);
  });
});
