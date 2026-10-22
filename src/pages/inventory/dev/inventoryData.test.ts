import { describe, expect, it } from "vitest";
import { groupProducts } from "./inventoryData";
import type { SubDeptMargin } from "../../../interfaces";

const row = (over: Partial<SubDeptMargin>): SubDeptMargin =>
  ({
    product_code: "4900002468",
    product_description: "COKE 6PK .5LT",
    total_sales: 100,
    total_tax: 7,
    qty: 1,
    weight: 0,
    ...over,
  }) as SubDeptMargin;

describe("groupProducts", () => {
  it("sums sales net of tax", () => {
    // Price Opt read 6-7% above Top 200 and Item Lookup for the same item and
    // week because it summed raw total_sales. Every other Sales surface
    // reconciles on total_sales - total_tax.
    const [coke] = groupProducts([
      row({ total_sales: 100, total_tax: 7 }),
      row({ total_sales: 50, total_tax: 3.5 }),
    ]);
    expect(coke.sales).toBeCloseTo(139.5, 10);
  });

  it("ranks items by net sales", () => {
    const out = groupProducts([
      row({ product_code: "A", total_sales: 100, total_tax: 60 }),
      row({ product_code: "B", total_sales: 90, total_tax: 0 }),
    ]);
    // Gross would put A first; net puts B first.
    expect(out.map((p) => p.productCode)).toEqual(["B", "A"]);
  });
});
