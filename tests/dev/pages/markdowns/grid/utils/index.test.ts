import { describe, expect, it } from "vitest";
import { markdownTotals, sortLabel, unitsOf } from "@/pages/markdowns/dev/grid/utils";

// Interfaces
import type { MarkdownItem } from "@/interfaces/markdowns";

const row = (over: Partial<MarkdownItem>) =>
  ({
    product_code: "100",
    original_price: 4,
    markdown: 1,
    qty: 10,
    weight: null,
    scalable: 0,
    type: "Price",
    ...over,
  }) as MarkdownItem;

describe("unitsOf", () => {
  it("counts a scaled item by weight and anything else by quantity", () => {
    expect(unitsOf(row({ qty: 3 }))).toBe(3);
    expect(unitsOf(row({ scalable: 1, qty: 1, weight: 2.5 }))).toBe(2.5);
    expect(unitsOf(row({ scalable: 1, qty: 2, weight: null }))).toBe(2);
    expect(unitsOf(row({ qty: null }))).toBe(0);
  });
});

describe("markdownTotals", () => {
  it("counts different items and adds up markdown dollars", () => {
    const t = markdownTotals([
      row({ product_code: "100", markdown: 1, qty: 10 }),
      row({ product_code: "100", markdown: 0.5, qty: 4 }),
      row({ product_code: "200", markdown: 3, qty: 2, type: "Waste" }),
    ]);
    expect(t.items).toBe(2);
    expect(t.dollars).toBe(18);
  });

  it("adds up retail and lists each store once, A to Z", () => {
    const t = markdownTotals([
      row({ storename: "Kennett", retail: 10 }),
      row({ storename: "Hayti", retail: 2.5 }),
      row({ storename: "Kennett", retail: null }),
    ]);
    expect(t.retail).toBe(12.5);
    expect(t.stores).toEqual(["Hayti", "Kennett"]);
  });

  it("weights the average percent by dollars, not by line", () => {
    // $10 off $40, and $1 off $1: 11 / 41, not the average of 25% and 100%.
    const t = markdownTotals([
      row({ original_price: 4, markdown: 1, qty: 10 }),
      row({ original_price: 1, markdown: 1, qty: 1 }),
    ]);
    expect(t.avgPct).toBeCloseTo((11 / 41) * 100);
  });

  it("leaves lines without both prices out of the average, and has no average with none", () => {
    expect(markdownTotals([row({ original_price: null })]).avgPct).toBeNull();
    expect(markdownTotals([]).avgPct).toBeNull();
    const t = markdownTotals([row({}), row({ original_price: null, markdown: 5, qty: 1 })]);
    expect(t.avgPct).toBeCloseTo(25);
    expect(t.dollars).toBe(15);
  });
});

describe("sortLabel", () => {
  it("says date order with no sort, the backend's own order", () => {
    expect(sortLabel(null)).toBe("In date order");
  });

  it("names the column and the direction in words that suit it", () => {
    expect(sortLabel({ col: "markdown_percent", dir: "desc" })).toBe("Sorted by MD %, high to low");
    expect(sortLabel({ col: "qty", dir: "asc" })).toBe("Sorted by Qty, low to high");
    expect(sortLabel({ col: "order_date", dir: "desc" })).toBe("Sorted by Date, newest first");
    expect(sortLabel({ col: "storename", dir: "asc" })).toBe("Sorted by Store, A to Z");
  });
});
