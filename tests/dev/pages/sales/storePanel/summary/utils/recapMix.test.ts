import { describe, expect, it } from "vitest";
import type { SubDeptMargin } from "@/interfaces";
import { mixForDay, priceShares } from "@/pages/sales/dev/storePanel/summary/utils/recapMix";

const row = (over: Partial<SubDeptMargin>) =>
  ({
    product_code: "1",
    sale_type: "Sale",
    price_type: "REG",
    total_sales: 10,
    total_tax: 0,
    qty: 1,
    ...over,
  }) as SubDeptMargin;

describe("a day's refunds and price mix", () => {
  it("keeps the codes it counted, refunds aside, so a week can merge them", () => {
    const mix = mixForDay([
      row({ product_code: "a" }),
      row({ product_code: "a" }),
      row({ product_code: "b" }),
      row({ product_code: "c", sale_type: "Refund", total_sales: -1 }),
    ]);
    expect(mix.items).toBe(2);
    expect([...mix.codes].sort()).toEqual(["a", "b"]);
  });

  it("reports refunds as the units and money given back", () => {
    const mix = mixForDay([
      row({}),
      row({ sale_type: "Refund", total_sales: -12.5, qty: -2 }),
      row({ sale_type: "refunded", total_sales: -5, qty: -1 }),
    ]);
    expect(mix.refunds).toEqual({ units: 3, net: 17.5 });
    expect(mix.regular).toBe(10);
  });

  it("calls REG and Regular regular, any other type a promotion, none unknown", () => {
    const mix = mixForDay([
      row({ price_type: "REG", total_sales: 60 }),
      row({ price_type: "Regular", total_sales: 10 }),
      row({ price_type: "TPR", total_sales: 20 }),
      row({ price_type: "Managers Special", total_sales: 10 }),
      row({ price_type: "", total_sales: 7 }),
    ]);
    expect(mix).toMatchObject({ regular: 70, promo: 30, unknown: 7 });
  });

  it("shares the mix out of the sales whose type is known", () => {
    const shares = priceShares({
      items: 0,
      codes: [],
      refunds: { units: 0, net: 0 },
      regular: 70,
      promo: 30,
      unknown: 25,
    });
    expect(shares?.regular).toBeCloseTo(70);
    expect(shares?.promo).toBeCloseTo(30);
    expect(shares?.unreported).toBeCloseTo(20);
  });

  it("reads a price type sent as a number instead of falling over", () => {
    const mix = mixForDay([
      row({ price_type: 1 as unknown as string, total_sales: 10 }),
      row({ sale_type: 7 as unknown as string, price_type: null as unknown as string }),
    ]);
    expect(mix).toMatchObject({ promo: 10, unknown: 10 });
  });

  it("counts the different items sold, leaving refunds out", () => {
    const mix = mixForDay([
      row({ product_code: "1" }),
      row({ product_code: "1", price_type: "TPR" }),
      row({ product_code: "2" }),
      row({ product_code: "3", sale_type: "Refund", total_sales: -4, qty: -1 }),
    ]);
    expect(mix.items).toBe(2);
  });

  it("has no mix at all when no row carries a price type", () => {
    const mix = mixForDay([row({ price_type: "" }), row({ price_type: undefined })]);
    expect(priceShares(mix)).toBeNull();
  });
});
