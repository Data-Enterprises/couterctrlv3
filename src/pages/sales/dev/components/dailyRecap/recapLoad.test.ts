import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SubDeptMargin } from "../../../../../interfaces";
import { loadDayItems, loadDayRows } from "./recapLoad";

const fetchRows = vi.fn();
vi.mock("../../../../../utils/marginRows", () => ({
  fetchSubDeptRowsOrEmpty: (...args: unknown[]) => fetchRows(...args),
}));

const row = (store_number: string, product_code: string, is_hash = false) =>
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
    is_hash,
  }) as SubDeptMargin;

describe("one day's item rows", () => {
  beforeEach(() => fetchRows.mockReset());

  it("reads one store and one day, every sub dept, this location, counted sub depts only", async () => {
    fetchRows.mockResolvedValue([row("369", "a"), row("370", "b"), row("369", "c", true)]);
    const rows = await loadDayRows("u/", "t", 685, "369", "2026-10-30");
    expect(fetchRows.mock.calls[0].slice(2)).toEqual([0, "2026-10-30", "2026-10-30", 0, 685, 1]);
    expect(rows.map((r) => r.product_code)).toEqual(["a"]);
  });

  it("folds them to one row per item for the export", async () => {
    fetchRows.mockResolvedValue([row("369", "a"), row("369", "a")]);
    const items = await loadDayItems("u/", "t", 685, "369", "2026-10-30");
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ code: "a", units: 2, net: 20 });
  });
});
