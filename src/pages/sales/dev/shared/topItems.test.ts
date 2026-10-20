import { describe, it, expect } from "vitest";
import {
  priceScale,
  amountOf,
  amountText,
  amountUnit,
  deptAmountText,
  weighed,
  contributionGap,
  contributionOf,
  avgPrice,
  deptRollups,
  deptSeverity,
  deptSeverityCounts,
  topItemsTotals,
  type DeptRollup,
  deptName,
  deptOptions,
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
  weight: 0,
  sub_department: 21,
  sub_department_description: "Soft Drinks",
  sub_department_count: 1,
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
    { storeid: 1, product_code: "A", product_description: "x", price: 8.99, units: 46, weight: 0, net_sales: 413.54 },
    { storeid: 1, product_code: "A", product_description: "x", price: 15.99, units: 2, weight: 0, net_sales: 31.98 },
    { storeid: 2, product_code: "A", product_description: "x", price: 8.99, units: 4, weight: 0, net_sales: 35.96 },
    { storeid: 1, product_code: "B", product_description: "y", price: 1.0, units: 9, weight: 0, net_sales: 9 },
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

describe("deptName and deptOptions", () => {
  it("uses the description the POS sent", () => {
    expect(deptName(row())).toBe("Soft Drinks");
  });

  it("falls back to the number when the description is blank", () => {
    expect(
      deptName(row({ sub_department: 14, sub_department_description: "  " })),
    ).toBe("Dept 14");
  });

  it("calls a filing-less item what it is, rather than leaving a gap", () => {
    expect(
      deptName(row({ sub_department: null, sub_department_description: null })),
    ).toBe("No department");
  });

  it("counts the items in each department", () => {
    const rows = [
      { ty: row({ product_code: "A" }), lw: null, ly: null, vsLW: null, vsLY: null },
      { ty: row({ product_code: "B" }), lw: null, ly: null, vsLW: null, vsLY: null },
      {
        ty: row({
          product_code: "C",
          sub_department: 7,
          sub_department_description: "Meat",
        }),
        lw: null,
        ly: null,
        vsLW: null,
        vsLY: null,
      },
    ];
    expect(deptOptions(rows).map((o) => o.label)).toEqual([
      "Meat (1)",
      "Soft Drinks (2)",
    ]);
  });

  it("offers nothing for an empty list rather than an empty option", () => {
    expect(deptOptions([])).toEqual([]);
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

describe("deptRollups", () => {
  const cmp = (
    dept: string,
    ty: number,
    tyQty: number,
    lw: number | null,
    ly: number | null,
    promo = 0,
    regular = 0,
  ) => ({
    ty: row({
      product_code: `${dept}-${ty}`,
      sub_department_description: dept,
      total_sales: ty,
      qty: tyQty,
      qty_regular: regular,
      qty_promo: promo,
      qty_deal_item: null,
      qty_unknown: null,
    }),
    lw: lw === null ? null : row({ total_sales: lw, qty: 10 }),
    ly: ly === null ? null : row({ total_sales: ly, qty: 12 }),
    vsLW: null,
    vsLY: null,
  });

  it("adds the items filed under each department", () => {
    const got = deptRollups([
      cmp("Meat", 100, 5, null, null),
      cmp("Meat", 50, 3, null, null),
      cmp("Grocery", 70, 7, null, null),
    ]);
    expect(got.map((d) => [d.name, d.ty, d.items, d.tyUnits])).toEqual([
      ["Meat", 150, 2, 8],
      ["Grocery", 70, 1, 7],
    ]);
  });

  it("ranks on sales", () => {
    const got = deptRollups([
      cmp("Small", 10, 1, null, null),
      cmp("Big", 900, 2, null, null),
    ]);
    expect(got[0].name).toBe("Big");
  });

  it("leaves a baseline null when no item had one", () => {
    // Absent is not zero: a department with no last year has not collapsed,
    // it has nothing to be compared against.
    const [d] = deptRollups([cmp("Meat", 100, 5, null, null)]);
    expect(d.ly).toBeNull();
    expect(d.vsLY).toBeNull();
  });

  it("compares against the items that DID have a baseline", () => {
    const [d] = deptRollups([
      cmp("Meat", 100, 5, 80, null),
      cmp("Meat", 100, 5, null, null),
    ]);
    expect(d.lw).toBe(80);
    expect(d.vsLW).toBeCloseTo(150, 5);
  });

  it("works out the off-regular share across the department", () => {
    const got = deptRollups([
      cmp("Meat", 100, 10, null, null, 6, 4),
      cmp("Meat", 100, 10, null, null, 0, 10),
    ]);
    expect(got[0].offRegular).toBeCloseTo(6 / 20, 5);
  });
});

describe("deptSeverity", () => {
  const dept = (vsLW: number | null, vsLY: number | null): DeptRollup => ({
    name: "Meat",
    items: 1,
    ty: 100,
    tyUnits: 10,
    tyWeight: 0,
    lw: vsLW === null ? null : 90,
    lwUnits: null,
    ly: vsLY === null ? null : 90,
    lyUnits: null,
    vsLW,
    vsLY,
    offRegular: 0,
  });

  it("grades on last year when there is one", () => {
    // LY is the longer view and catches a seasonal collapse LW calls normal.
    expect(deptSeverity(dept(5, -30), 9)).toBe("critical");
  });

  it("falls back to last week when there is no last year", () => {
    expect(deptSeverity(dept(-30, null), 9)).toBe("critical");
  });

  it("refuses a verdict when neither baseline exists", () => {
    // Ungraded is not healthy: nobody can compare it.
    expect(deptSeverity(dept(null, null), 9)).toBeNull();
  });

  it("counts only the graded ones in the chips", () => {
    const counts = deptSeverityCounts(
      [dept(null, -30), dept(null, -2), dept(null, 10), dept(null, null)],
      9,
    );
    expect(counts).toEqual({ critical: 1, watch: 1, healthy: 1 });
  });
});

describe("topItemsTotals", () => {
  const cmp = (ty: number, lw: number | null, ly: number | null) => ({
    ty: row({ total_sales: ty, qty: 1 }),
    lw: lw === null ? null : row({ total_sales: lw, qty: 1 }),
    ly: ly === null ? null : row({ total_sales: ly, qty: 1 }),
    vsLW: null,
    vsLY: null,
  });

  it("totals the set and both baselines", () => {
    const t = topItemsTotals([cmp(100, 80, 50), cmp(100, 20, 50)]);
    expect([t.ty, t.lw, t.ly]).toEqual([200, 100, 100]);
    expect(t.vsLW).toBeCloseTo(100, 5);
    expect(t.vsLY).toBeCloseTo(100, 5);
  });

  it("leaves a baseline null when nothing had one, not zero", () => {
    const t = topItemsTotals([cmp(100, null, null)]);
    expect(t.lw).toBeNull();
    expect(t.vsLY).toBeNull();
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

describe("contributionOf", () => {
  it("is the share of the period's net sales", () => {
    expect(contributionOf(47_426.29, 116_555.61)).toBeCloseTo(40.69, 2);
  });

  it("has no answer without a period to be a share of", () => {
    expect(contributionOf(1000, 0)).toBeNull();
    expect(contributionOf(1000, null)).toBeNull();
    expect(contributionOf(null, 1000)).toBeNull();
  });

  it("refuses a negative denominator rather than flipping the sign", () => {
    expect(contributionOf(1000, -500)).toBeNull();
  });
});

describe("contributionGap", () => {
  it("is the difference in points", () => {
    expect(contributionGap(41, 38)).toBe(3);
    expect(contributionGap(38, 41)).toBe(-3);
  });

  it("needs both sides", () => {
    expect(contributionGap(41, null)).toBeNull();
    expect(contributionGap(null, 38)).toBeNull();
  });
});

describe("weighed items", () => {
  const scale = (over: Partial<TopItemRow> = {}) =>
    row({ qty: 0, weight: 507.23, total_sales: 5981.29, ...over });

  it("knows a row by its weight, not by its qty", () => {
    expect(weighed(scale())).toBe(true);
    expect(weighed(row({ qty: 265, weight: 0 }))).toBe(false);
  });

  it("prices a weighed row per pound", () => {
    // Food Giant rings every scale item at qty 0, so dividing by qty gave
    // null and dividing by rings elsewhere gave the price of a basket.
    expect(avgPrice(scale())).toBeCloseTo(11.79, 2);
  });

  it("still prices a packaged row per unit", () => {
    expect(avgPrice(row({ qty: 100, weight: 0, total_sales: 250 }))).toBe(2.5);
  });

  it("has no price for a row that sold nothing either way", () => {
    expect(avgPrice(row({ qty: 0, weight: 0, total_sales: 0 }))).toBeNull();
  });

  it("reports the amount in the unit the item has", () => {
    expect(amountOf(scale())).toBe(507.23);
    expect(amountUnit(scale())).toBe("lb");
    // Two decimals, the shared rule's: pounds are what the invoice is
    // denominated in, and the second decimal is money.
    expect(amountText(scale())).toBe("507.23 lb");
    expect(amountText(row({ qty: 1988, weight: 0 }))).toBe("1,988 units");
  });
});

describe("deptAmountText", () => {
  it("prints both when a department holds both", () => {
    expect(deptAmountText({ tyUnits: 1200, tyWeight: 507.2 })).toBe(
      "1,200 u · 507 lb",
    );
  });

  it("prints pounds alone for a department of scale items", () => {
    expect(deptAmountText({ tyUnits: 0, tyWeight: 507.2 })).toBe("507 lb");
  });

  it("prints units alone for a packaged department", () => {
    expect(deptAmountText({ tyUnits: 1200, tyWeight: 0 })).toBe("1,200 u");
  });

  it("prints a dash rather than a nought", () => {
    expect(deptAmountText({ tyUnits: 0, tyWeight: 0 })).toBe("—");
  });
});

describe("priceScale", () => {
  const pt = (price: number, units: number) => ({
    price,
    units,
    netSales: price * units,
  });
  const byUnits = (x: { units: number }) => x.units;

  it("is null below two prices, which is the normal case on a scale item", () => {
    expect(priceScale([pt(3.39, 187)], 4.2, false, byUnits)).toBeNull();
    expect(priceScale([], 4.2, false, byUnits)).toBeNull();
  });

  it("marks the prices that sold below cost", () => {
    const scale = priceScale(
      [pt(3.39, 187), pt(4.69, 10), pt(5.49, 3)],
      4.2,
      false,
      byUnits,
    );
    expect(scale?.dots.map((d) => d.under)).toEqual([true, false, false]);
    expect(scale?.underAmount).toBe(187);
  });

  it("runs the axis low price to high, whatever order they arrive in", () => {
    const scale = priceScale(
      [pt(5.49, 3), pt(3.39, 187), pt(4.69, 10)],
      4.2,
      false,
      byUnits,
    );
    expect(scale?.dots.map((d) => d.price)).toEqual([3.39, 4.69, 5.49]);
  });

  it("sizes by area, so the big seller does not swamp the axis", () => {
    const scale = priceScale([pt(1, 10000), pt(2, 1)], null, false, byUnits);
    const [small, big] = [scale!.dots[1], scale!.dots[0]];
    expect(big.size).toBe(30);
    // Diameter, not area: a hundredth of the amount is a tenth of the width.
    expect(small.size).toBe(8);
  });

  it("draws no cost line when the cost is not known", () => {
    const scale = priceScale([pt(3.39, 187), pt(4.69, 10)], null, false, byUnits);
    expect(scale?.costAt).toBeNull();
    expect(scale?.underAmount).toBe(0);
    expect(scale?.dots.every((d) => !d.under)).toBe(true);
  });

  it("keeps the cost inside the axis when it sits past every price", () => {
    const scale = priceScale([pt(1, 5), pt(2, 5)], 9, false, byUnits);
    const pct = Number(scale!.costAt!.replace("%", ""));
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThan(100);
  });

  it("reads a weighed item in pounds", () => {
    const scale = priceScale(
      [pt(11.79, 160), pt(9.99, 40)],
      8.44,
      true,
      (x) => x.netSales / x.price,
    );
    expect(scale?.dots.map((d) => d.amountText)).toEqual(["40 lb", "160 lb"]);
  });
});
