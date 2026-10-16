import { describe, it, expect } from "vitest";
import {
  avgPrice,
  DEFAULT_TOP_ITEM_SORT,
  nextTopItemSort,
  sortTopItems,
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

describe("null counts", () => {
  // SUM(qty) FILTER (WHERE ...) returns NULL, not 0, when nothing matches --
  // so an item that only ever sold at regular price arrives with
  // qty_promo: null. Reading one of these raw crashed the whole panel.
  const onlyRegular = row({
    qty: 46,
    qty_regular: 46,
    qty_promo: null,
    qty_deal_item: null,
    qty_unknown: null,
  });

  it("treats a null count as none rather than throwing", () => {
    expect(promoShare(onlyRegular)).toBe(0);
  });

  it("still divides by the counts that did come back", () => {
    expect(
      promoShare(
        row({ qty_regular: 30, qty_promo: 10, qty_deal_item: null, qty_unknown: null }),
      ),
    ).toBe(0.25);
  });

  it("survives every count being null", () => {
    expect(
      promoShare(
        row({ qty_regular: null, qty_promo: null, qty_deal_item: null, qty_unknown: null }),
      ),
    ).toBe(0);
  });

  it("reads a null ext_cost as no cost, not NaN", () => {
    const got = grossProfit(row({ total_sales: 100, ext_cost: null, margin: 100 }));
    expect(got).toBe(100);
    expect(Number.isNaN(got)).toBe(false);
  });

  it("builds an insight for an item with null counts", () => {
    const got = topItemInsight(onlyRegular, []);
    expect(got.detail).not.toContain("NaN");
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

describe("sorting", () => {
  const compared = (
    code: string,
    sales: number,
    vsLW: number | null,
    vsLY: number | null,
    desc = code,
  ) => ({
    ty: row({ product_code: code, product_description: desc, total_sales: sales }),
    lw: null,
    ly: null,
    vsLW,
    vsLY,
  });

  const rows = [
    compared("A", 100, 5, null, "Apples"),
    compared("B", 300, -20, 10, "Bread"),
    compared("C", 200, null, -4, "Cheese"),
  ];

  it("rests on biggest sales first", () => {
    expect(DEFAULT_TOP_ITEM_SORT).toEqual({ column: "sales", direction: "desc" });
    expect(
      sortTopItems(rows, DEFAULT_TOP_ITEM_SORT).map((r) => r.ty.product_code),
    ).toEqual(["B", "C", "A"]);
  });

  it("opens a number column on descending — 'most' is the question", () => {
    expect(nextTopItemSort(DEFAULT_TOP_ITEM_SORT, "vsLY").direction).toBe("desc");
  });

  it("opens the name column A to Z instead", () => {
    expect(nextTopItemSort(DEFAULT_TOP_ITEM_SORT, "item").direction).toBe("asc");
  });

  it("flips the column already in force", () => {
    expect(nextTopItemSort(DEFAULT_TOP_ITEM_SORT, "sales").direction).toBe("asc");
  });

  it("sinks a missing comparison in BOTH directions", () => {
    // No last year is not a fall of 100%: the item has no baseline, and
    // letting it sort as a number would put it top of the losers.
    const desc = sortTopItems(rows, { column: "vsLY", direction: "desc" });
    const asc = sortTopItems(rows, { column: "vsLY", direction: "asc" });
    expect(desc[desc.length - 1].ty.product_code).toBe("A");
    expect(asc[asc.length - 1].ty.product_code).toBe("A");
  });

  it("sorts names when asked", () => {
    expect(
      sortTopItems(rows, { column: "item", direction: "asc" }).map(
        (r) => r.ty.product_description,
      ),
    ).toEqual(["Apples", "Bread", "Cheese"]);
  });

  it("leaves the caller's array alone", () => {
    const before = rows.map((r) => r.ty.product_code);
    sortTopItems(rows, { column: "vsLW", direction: "asc" });
    expect(rows.map((r) => r.ty.product_code)).toEqual(before);
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
