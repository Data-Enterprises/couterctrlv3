import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchProducts, fetchSubDepts } from "@/pages/inventory/dev/utils";
import type { SubDeptMargin, SubSale } from "@/interfaces";

const api = vi.hoisted(() => ({ daily: vi.fn(), rows: vi.fn() }));
vi.mock("@/api/sales", () => ({ getSubsDaily: api.daily }));
vi.mock("@/utils/marginRows", () => ({
  fetchSubDeptRows: api.rows,
  fetchSubDeptRowsSafe: vi.fn(),
}));

const scope = { url: "u/", token: "t", storeid: 100223, start: "2026-11-02", end: "2026-11-08" };

const dept = (n: number, d: string, sales: number) =>
  ({
    sale_date: "2026-11-02T00:00:00",
    sub_department: n,
    sub_department_description: d,
    total_sales: sales,
    total_tax: 0,
    net_sales: sales,
  }) as SubSale;

const item = (code: string, n: number, d: string) =>
  ({
    product_code: code,
    product_description: code,
    sub_department: n,
    sub_department_description: d,
    total_sales: 5,
    total_tax: 0,
    qty: 1,
    weight: 0,
  }) as SubDeptMargin;

beforeEach(() => {
  api.daily.mockReset();
  api.rows.mockReset();
});

/** ACE store 100223 files several departments under number 0. */
describe("Inventory departments", () => {
  it("lists departments that share a number separately", async () => {
    api.daily.mockResolvedValue({
      data: {
        error: 0,
        total_pages: 1,
        subs: [dept(0, "DONATION", 6), dept(0, "HHC Coupons and Certificates", 40), dept(14, "PAINT", 90)],
      },
    });
    const depts = await fetchSubDepts(scope);
    expect(depts.map((d) => d.key)).toEqual(["14|PAINT", "0|HHC Coupons and Certificates", "0|DONATION"]);
  });

  it("opens one department-0 line without the rest of the store", async () => {
    // Asking subs/subs for department 0 returns every department.
    api.rows.mockResolvedValue([item("A", 0, "DONATION"), item("B", 0, "ACE REWARDS"), item("C", 14, "PAINT")]);
    const products = await fetchProducts(scope, "0|DONATION");
    expect(api.rows.mock.calls[0][2]).toBe(0);
    expect(products.map((p) => p.productCode)).toEqual(["A"]);
  });
});
