import { describe, it, expect } from "vitest";
import {
  avgPrice,
  grossProfit,
  pointsFor,
  promoShare,
  rankBySales,
  topItemInsight,
} from "./topItems";
import type { TopItemRow, TopItemPricePoint } from "../../../../api/topItems";

const row = (over: Partial<TopItemRow> = {}): TopItemRow => ({
  storeid: 1,
  store_number: "001",
  store_name: "IGA GLASGOW KY",
  product_code: "7800004110",
  product_description: "RC 24 PK",
  qty: 46,
  total_sales: 439.5,
  ext_cost: 478.3,
  cost_coverage: 100,
  margin: -8.8,
  qty_regular: 0,
  qty_promo: 46,
  qty_deal_item: 0,
  qty_unknown: 0,
  ...over,
});

describe("rankBySales", () => {
  it("reorders a units-ranked list onto sales", () => {
    const items = [
      row({ product_code: "A", qty: 100, total_sales: 90 }),
      row({ product_code: "B", qty: 5, total_sales: 480 }),
      row({ product_code: "C", qty: 40, total_sales: 200 }),
    ];
    expect(rankBySales(items, 3).map((r) => r.product_code)).toEqual([
      "B",
      "C",
      "A",
    ]);
  });

  it("cuts to the count asked for", () => {
    const items = [1, 2, 3, 4, 5].map((n) =>
      row({ product_code: String(n), total_sales: n }),
    );
    expect(rankBySales(items, 2)).toHaveLength(2);
  });

  it("breaks ties the same way every time, so the list cannot reshuffle", () => {
    const items = [
      row({ product_code: "Z", total_sales: 10, qty: 4 }),
      row({ product_code: "A", total_sales: 10, qty: 4 }),
    ];
    expect(rankBySales(items, 2).map((r) => r.product_code)).toEqual(["A", "Z"]);
    expect(rankBySales([...items].reverse(), 2).map((r) => r.product_code)).toEqual(
      ["A", "Z"],
    );
  });

  it("leaves the caller's array alone", () => {
    const items = [
      row({ product_code: "A", total_sales: 1 }),
      row({ product_code: "B", total_sales: 2 }),
    ];
    rankBySales(items, 2);
    expect(items.map((r) => r.product_code)).toEqual(["A", "B"]);
  });
});

describe("promoShare", () => {
  it("counts deal items as off regular — for those stores the deal is the item", () => {
    expect(
      promoShare(row({ qty_regular: 0, qty_promo: 0, qty_deal_item: 10 })),
    ).toBe(1);
  });

  it("ignores units whose price type the POS never sent", () => {
    // Sonic sends no price_type at all; counting those as regular would
    // report every one of their items as selling at full price.
    expect(
      promoShare(
        row({ qty_regular: 5, qty_promo: 5, qty_deal_item: 0, qty_unknown: 90 }),
      ),
    ).toBe(0.5);
  });

  it("is zero rather than NaN when nothing is classified", () => {
    expect(
      promoShare(
        row({ qty_regular: 0, qty_promo: 0, qty_deal_item: 0, qty_unknown: 7 }),
      ),
    ).toBe(0);
  });
});

describe("avgPrice and grossProfit", () => {
  it("averages what a unit fetched", () => {
    expect(avgPrice(row({ total_sales: 439.5, qty: 46 }))?.toFixed(2)).toBe(
      "9.55",
    );
  });

  it("does not divide by a zero unit count", () => {
    expect(avgPrice(row({ qty: 0 }))).toBeNull();
  });

  it("refuses a profit when the margin was withheld", () => {
    // The server nulls the margin on thin cost coverage; a profit computed
    // from the same ext_cost would be exactly as untrustworthy.
    expect(grossProfit(row({ margin: null }))).toBeNull();
  });

  it("is sales less cost when the margin stands", () => {
    expect(grossProfit(row({ total_sales: 100, ext_cost: 80, margin: 20 }))).toBe(
      20,
    );
  });
});

describe("pointsFor", () => {
  const points: TopItemPricePoint[] = [
    { storeid: 1, product_code: "A", product_description: "x", price: 8.99, units: 46, net_sales: 413.54 },
    { storeid: 1, product_code: "A", product_description: "x", price: 15.99, units: 2, net_sales: 31.98 },
    { storeid: 2, product_code: "A", product_description: "x", price: 8.99, units: 4, net_sales: 35.96 },
    { storeid: 1, product_code: "B", product_description: "y", price: 1.0, units: 9, net_sales: 9 },
  ];

  it("takes only the item asked for", () => {
    expect(pointsFor(points, "B")).toEqual([
      { price: 1, units: 9, netSales: 9 },
    ]);
  });

  it("adds the same price across stores rather than listing it twice", () => {
    const got = pointsFor(points, "A");
    expect(got[0]).toEqual({ price: 8.99, units: 50, netSales: 449.5 });
  });

  it("puts the busiest price first", () => {
    expect(pointsFor(points, "A").map((p) => p.price)).toEqual([8.99, 15.99]);
  });

  it("is empty for an item with no points, not undefined", () => {
    expect(pointsFor(points, "nope")).toEqual([]);
  });
});

describe("topItemInsight", () => {
  it("says the margin is unknown rather than showing a number", () => {
    const got = topItemInsight(row({ margin: null, cost_coverage: 29 }), []);
    expect(got.tone).toBe("unknown");
    expect(got.detail).toContain("29% of lines");
  });

  it("names no coverage figure when none came back", () => {
    const got = topItemInsight(row({ margin: null, cost_coverage: null }), []);
    expect(got.detail).toContain("no line carried a cost");
  });

  it("blames the promotion when the units went out off regular", () => {
    const got = topItemInsight(row(), [{ price: 8.99, units: 46 }]);
    expect(got.tone).toBe("critical");
    expect(got.label).toBe("Promotion under water");
    expect(got.detail).toContain("$9.55");
    expect(got.detail).toContain("$10.40");
  });

  it("blames the cost when the losses are not a promotion", () => {
    const got = topItemInsight(
      row({ qty_regular: 46, qty_promo: 0 }),
      [{ price: 9.55, units: 46 }],
    );
    expect(got.tone).toBe("critical");
    expect(got.label).toBe("Selling below cost");
  });

  it("flags an item that never sells at its regular price, even in profit", () => {
    const got = topItemInsight(
      row({ margin: 22.4, total_sales: 500, ext_cost: 388 }),
      [{ price: 8.99, units: 46 }],
    );
    expect(got.tone).toBe("watch");
    expect(got.label).toBe("Only sells on promo");
  });

  it("leaves a healthy item alone", () => {
    const got = topItemInsight(
      row({ margin: 22.4, total_sales: 500, ext_cost: 388, qty_regular: 46, qty_promo: 0 }),
      [],
    );
    expect(got.tone).toBe("healthy");
  });

  it("never reports a negative dollar figure as negative twice", () => {
    // The sentence already says "given away"; a minus sign on top of it reads
    // as a double negative.
    const got = topItemInsight(row(), [{ price: 8.99, units: 46 }]);
    expect(got.detail).not.toContain("-$");
  });
});
