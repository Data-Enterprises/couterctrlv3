import { describe, expect, it } from "vitest";
import type { TopItemRow } from "../../../../api/topItems";
import {
  amountTextOf,
  compareTopItems,
  compareTotals,
  divergence,
  divergenceByDept,
  divergenceSigned,
  filterCompared,
  sortCompared,
} from "./topItemsCompare";

/**
 * Two stores' top 200, joined.
 *
 * The rules worth holding: an absent row is not a zero, the share gap is null
 * unless both sides are known, and amounts are never compared across a store
 * that weighs an item against one that does not.
 */

const row = (over: Partial<TopItemRow> = {}): TopItemRow =>
  ({
    storeid: 1105,
    store_number: "1105",
    store_name: "Chapel Hill",
    product_code: "4011",
    product_description: "BANANAS",
    sub_department: 9,
    sub_department_description: "Produce",
    sub_department_count: 1,
    qty: 0,
    weight: 0,
    total_sales: 100,
    ext_cost: null,
    cost_coverage: null,
    margin: null,
    qty_regular: null,
    qty_promo: null,
    qty_deal_item: null,
    qty_unknown: null,
    ...over,
  }) as TopItemRow;

describe("joining two stores' lists", () => {
  it("pairs an item both stores sell", () => {
    const [r] = compareTopItems(
      [row({ total_sales: 600 })],
      [row({ total_sales: 400 })],
    );
    expect(r.only).toBeNull();
    expect(r.mineSales).toBe(600);
    expect(r.theirsSales).toBe(400);
    expect(r.pair).toBe(1000);
  });

  it("keeps an item only one store lists, and says which", () => {
    const rows = compareTopItems(
      [row({ product_code: "A", total_sales: 500 })],
      [row({ product_code: "B", total_sales: 300 })],
    );
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.code === "A")!.only).toBe("mine");
    expect(rows.find((r) => r.code === "B")!.only).toBe("theirs");
  });

  it("does not report an absent side as a measured zero", () => {
    // mineSales is 0 because there is nothing to add, but `only` is what a
    // caller must read -- the other store's figure is unknown, not nought.
    const [r] = compareTopItems([], [row({ total_sales: 300 })]);
    expect(r.mineSales).toBe(0);
    expect(r.mineShare).toBeNull();
    expect(r.only).toBe("theirs");
  });
});

describe("share and the gap between them", () => {
  const mine = [
    row({ product_code: "A", total_sales: 300 }),
    row({ product_code: "B", total_sales: 700 }),
  ];
  const theirs = [
    row({ product_code: "A", total_sales: 100 }),
    row({ product_code: "B", total_sales: 900 }),
  ];

  it("is each item against its own store's top-200 sales", () => {
    const rows = compareTopItems(mine, theirs);
    const a = rows.find((r) => r.code === "A")!;
    expect(a.mineShare).toBeCloseTo(30, 6);
    expect(a.theirsShare).toBeCloseTo(10, 6);
  });

  it("is the difference in points when both sides are known", () => {
    const a = compareTopItems(mine, theirs).find((r) => r.code === "A")!;
    expect(a.shareGap).toBeCloseTo(20, 6);
  });

  it("is NULL when one side is absent, never share minus zero", () => {
    // The other store's share is unknown, not nought. Subtracting an unknown
    // produces a figure that looks measured and is not.
    const [r] = compareTopItems([row({ total_sales: 500 })], []);
    expect(r.mineShare).toBeCloseTo(100, 6);
    expect(r.shareGap).toBeNull();
  });
});

describe("divergence, for sorting and for the chip", () => {
  it("is the gap's size when both sides are known", () => {
    const rows = compareTopItems(
      [row({ product_code: "A", total_sales: 300 }), row({ product_code: "B", total_sales: 700 })],
      [row({ product_code: "A", total_sales: 100 }), row({ product_code: "B", total_sales: 900 })],
    );
    expect(divergence(rows.find((r) => r.code === "A")!)).toBeCloseTo(20, 6);
  });

  it("falls back to the known side's share, which is the gap's lower bound", () => {
    const [r] = compareTopItems([row({ total_sales: 500 })], []);
    expect(divergence(r)).toBeCloseTo(100, 6);
    expect(r.shareGap).toBeNull();
  });

  it("signs it by which store is bigger", () => {
    const onlyMine = compareTopItems([row({ total_sales: 500 })], [])[0];
    const onlyTheirs = compareTopItems([], [row({ total_sales: 500 })])[0];
    expect(divergenceSigned(onlyMine)).toBeGreaterThan(0);
    expect(divergenceSigned(onlyTheirs)).toBeLessThan(0);
  });

  it("puts the furthest apart first", () => {
    // Three items, not two. With only two the shares are forced to mirror
    // each other -- each is a share of a total the other half makes up -- so
    // both gaps come out identical whatever the sales are, and the test
    // proves nothing. A third item gives the denominators somewhere to sit.
    const rows = compareTopItems(
      [
        row({ product_code: "LEVEL", total_sales: 500 }),
        row({ product_code: "APART", total_sales: 500 }),
        row({ product_code: "BULK", total_sales: 1000 }),
      ],
      [
        row({ product_code: "LEVEL", total_sales: 500 }),
        row({ product_code: "APART", total_sales: 50 }),
        row({ product_code: "BULK", total_sales: 1000 }),
      ],
    );
    expect(sortCompared(rows, "divergence")[0].code).toBe("APART");
    // Sales ranks on the pair's combined size, which is a different order.
    expect(sortCompared(rows, "sales")[0].code).toBe("BULK");
  });
});

describe("units", () => {
  const scale = row({ product_code: "MEAT", qty: 0, weight: 500, total_sales: 900 });
  const packed = row({ product_code: "MEAT", qty: 120, weight: 0, total_sales: 700 });

  it("flags two stores that ring the same code differently", () => {
    const [r] = compareTopItems([scale], [packed]);
    expect(r.unitsDisagree).toBe(true);
    expect(r.mineUnit).toBe("lb");
    expect(r.theirsUnit).toBe("units");
  });

  it("does not flag two stores that agree", () => {
    expect(compareTopItems([scale], [scale])[0].unitsDisagree).toBe(false);
    expect(compareTopItems([packed], [packed])[0].unitsDisagree).toBe(false);
  });

  it("labels an amount in whatever unit the row has", () => {
    expect(amountTextOf(scale)).toBe("500.0 lb");
    expect(amountTextOf(packed)).toBe("120 units");
    expect(amountTextOf(null)).toBeNull();
  });
});

describe("the outline", () => {
  const rows = compareTopItems(
    [
      row({ product_code: "A", sub_department_description: "Fresh Meat" }),
      row({ product_code: "B", sub_department_description: "Fresh Meat" }),
      row({ product_code: "C", sub_department_description: "Beer" }),
      row({ product_code: "SHARED", sub_department_description: "Grocery" }),
    ],
    [row({ product_code: "SHARED", sub_department_description: "Grocery" })],
  );

  it("counts the three piles", () => {
    const t = compareTotals(rows);
    expect(t.both).toBe(1);
    expect(t.onlyMine).toBe(3);
    expect(t.onlyTheirs).toBe(0);
  });

  it("names where the difference sits, commonest first", () => {
    // Only one-sided rows count: an item both stores carry is not where they
    // differ in stocking, however far apart the sizes are.
    expect(divergenceByDept(rows)).toEqual([
      { dept: "Fresh Meat", count: 2 },
      { dept: "Beer", count: 1 },
    ]);
  });

  it("leaves shared departments out of the outline", () => {
    expect(divergenceByDept(rows).some((d) => d.dept === "Grocery")).toBe(false);
  });
});

describe("filtering", () => {
  const rows = compareTopItems(
    [
      row({ product_code: "A", product_description: "BANANAS" }),
      row({ product_code: "SHARED", product_description: "COKE 6PK" }),
    ],
    [
      row({ product_code: "B", product_description: "BOILED PEANUTS" }),
      row({ product_code: "SHARED", product_description: "COKE 6PK" }),
    ],
  );

  it("narrows to one pile", () => {
    expect(filterCompared(rows, "mine", "").map((r) => r.code)).toEqual(["A"]);
    expect(filterCompared(rows, "theirs", "").map((r) => r.code)).toEqual(["B"]);
    expect(filterCompared(rows, "both", "").map((r) => r.code)).toEqual(["SHARED"]);
  });

  it("searches description, code and department together", () => {
    expect(filterCompared(rows, "all", "banana")).toHaveLength(1);
    expect(filterCompared(rows, "all", "SHARED")).toHaveLength(1);
    // Three rows, not four: SHARED is one row carrying both sides.
    expect(filterCompared(rows, "all", "produce")).toHaveLength(3);
  });
});
