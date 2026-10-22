import { describe, expect, it } from "vitest";
import { groupProducts, isUnweighedPacks } from "./inventoryData";
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

describe("isUnweighedPacks", () => {
  const weighed = [row({ weight: 2.7 })];
  const each = [row({ weight: 0 })];

  it("flags a weighed item whose receipts read as whole packs", () => {
    // Ground Beef Fam Pak: the sales rows carry weight, the register lines are
    // quantity 1 at each pack's total.
    expect(isUnweighedPacks(203, false, weighed)).toBe(true);
  });

  it("leaves an item weighed at the till alone", () => {
    // Fractional quantities on the receipts: actual already prices per pound.
    expect(isUnweighedPacks(40, true, weighed)).toBe(false);
  });

  it("leaves an each-priced item alone", () => {
    expect(isUnweighedPacks(26, false, each)).toBe(false);
  });

  it("does not decide before the receipts have arrived", () => {
    expect(isUnweighedPacks(0, false, weighed)).toBe(false);
  });
});
