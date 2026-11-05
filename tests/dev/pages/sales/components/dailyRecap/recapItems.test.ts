import { describe, expect, it } from "vitest";
import type { SubDeptMargin } from "@/interfaces";
import { foldItems } from "@/pages/sales/dev/components/dailyRecap/recapItems";

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

describe("folding a day's item rows for the export", () => {
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

  it("keeps each vendor's share of the item, biggest first, with blank and 0 as No Vendor", () => {
    const [soda] = foldItems([
      row({ vendor_name: "Pepsi", total_sales: 4, qty: 2 }),
      row({ vendor_name: "AWG", total_sales: 10, qty: 5, weight: 1.5 }),
      row({ vendor_name: "Pepsi", total_sales: 3, qty: 1 }),
      row({ vendor_name: "", total_sales: 1, qty: 1 }),
      row({ vendor_name: "0", total_sales: 0.5, qty: 1 }),
    ]);
    expect(soda.vendors).toEqual([
      { vendor: "AWG", units: 5, pounds: 1.5, net: 10 },
      { vendor: "Pepsi", units: 3, pounds: 0, net: 7 },
      { vendor: "No Vendor", units: 2, pounds: 0, net: 1.5 },
    ]);
    expect(soda).toMatchObject({ units: 10, net: 18.5 });
  });

  it("nets a refund off the item's day", () => {
    const [soda] = foldItems([row({ total_sales: 10, qty: 5 }), row({ total_sales: -2, qty: -1 })]);
    expect(soda).toMatchObject({ units: 4, net: 8 });
  });
});
