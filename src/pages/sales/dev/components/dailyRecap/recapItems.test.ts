import { describe, expect, it } from "vitest";
import type { SubDeptMargin } from "../../../../../interfaces";
import { avgPrice, foldItems, itemsBySubDept, matchesSearch } from "./recapItems";
import type { RecapItem } from "./recapTypes";

const row = (over: Partial<SubDeptMargin>) =>
  ({
    product_code: "100",
    product_description: "Soda",
    sub_department: 1,
    sub_department_description: "Drinks",
    total_sales: 10,
    total_tax: 0,
    qty: 5,
    weight: 0,
    ...over,
  }) as SubDeptMargin;

const item = (over: Partial<RecapItem>): RecapItem => ({
  code: "1",
  name: "Item",
  subDeptId: 1,
  subDeptName: "Drinks",
  units: 1,
  pounds: 0,
  net: 1,
  ...over,
});

describe("folding a day's item rows", () => {
  it("adds an item's price-type rows into one item, net of tax", () => {
    const [soda] = foldItems([
      row({ total_sales: 11, total_tax: 1, qty: 5 }),
      row({ total_sales: 4, total_tax: 0, qty: 2 }),
    ]);
    expect(soda).toMatchObject({ code: "100", units: 7, net: 14 });
  });

  it("names the item after the row that took the most money", () => {
    const [soda] = foldItems([
      row({ product_description: "SODA 12OZ", total_sales: 2 }),
      row({ product_description: "Soda 12 oz can", total_sales: 20 }),
    ]);
    expect(soda.name).toBe("Soda 12 oz can");
  });

  it("drops rows from sub depts the store leaves out", () => {
    expect(foldItems([row({ is_hash: true })])).toEqual([]);
  });

  it("nets a refund off the item's day", () => {
    const [soda] = foldItems([row({ total_sales: 10, qty: 5 }), row({ total_sales: -2, qty: -1 })]);
    expect(soda).toMatchObject({ units: 4, net: 8 });
  });
});

describe("grouping and finding items", () => {
  it("groups under the sub dept, biggest sales first", () => {
    const by = itemsBySubDept([
      item({ code: "a", net: 1 }),
      item({ code: "b", net: 5 }),
      item({ code: "c", subDeptId: 2 }),
    ]);
    expect(by.get(1)?.map((i) => i.code)).toEqual(["b", "a"]);
    expect(by.get(2)?.map((i) => i.code)).toEqual(["c"]);
  });

  it("matches a name or a code, ignoring case", () => {
    const corn = item({ code: "0007", name: "Corn Dog" });
    expect(matchesSearch(corn, "corn")).toBe(true);
    expect(matchesSearch(corn, "0007")).toBe(true);
    expect(matchesSearch(corn, "burger")).toBe(false);
    expect(matchesSearch(corn, "  ")).toBe(true);
  });
});

describe("average price", () => {
  it("is per pound for a weighed item", () => {
    expect(avgPrice(item({ net: 30, units: 3, pounds: 2 }))).toBe(15);
  });

  it("is per unit otherwise, and absent with nothing to divide by", () => {
    expect(avgPrice(item({ net: 30, units: 3 }))).toBe(10);
    expect(avgPrice(item({ net: 30, units: 0 }))).toBeNull();
  });
});
