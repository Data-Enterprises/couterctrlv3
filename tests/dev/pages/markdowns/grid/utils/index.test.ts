import { describe, expect, it } from "vitest";
import { markdownTotals, totalsRow, unitsOf } from "@/pages/markdowns/dev/grid/utils";

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
  it("adds up lines, different items, markdown dollars and waste dollars", () => {
    const t = markdownTotals([
      row({ product_code: "100", markdown: 1, qty: 10 }),
      row({ product_code: "100", markdown: 0.5, qty: 4 }),
      row({ product_code: "200", markdown: 3, qty: 2, type: "Waste" }),
    ]);
    expect(t.lines).toBe(3);
    expect(t.items).toBe(2);
    expect(t.dollars).toBe(18);
    expect(t.waste).toBe(6);
  });

  it("weights the average percent by dollars, not by line", () => {
    // $10 off $40, and $1 off $1: 11 / 41, not the average of 25% and 100%.
    const t = markdownTotals([
      row({ original_price: 4, markdown: 1, qty: 10 }),
      row({ original_price: 1, markdown: 1, qty: 1 }),
    ]);
    expect(t.avgPct).toBeCloseTo((11 / 41) * 100);
  });

  it("adds up quantity, weight and retail", () => {
    const t = markdownTotals([
      row({ qty: 10, weight: null, retail: 30 }),
      row({ qty: 1, weight: 2.25, retail: 4.5 }),
    ]);
    expect([t.qty, t.weight, t.retail]).toEqual([11, 2.25, 34.5]);
  });

  it("leaves lines without both prices out of the average, and has no average with none", () => {
    expect(markdownTotals([row({ original_price: null })]).avgPct).toBeNull();
    expect(markdownTotals([]).avgPct).toBeNull();
    const t = markdownTotals([row({}), row({ original_price: null, markdown: 5, qty: 1 })]);
    expect(t.avgPct).toBeCloseTo(25);
    expect(t.dollars).toBe(15);
  });
});

describe("totalsRow", () => {
  it("labels the row and totals markdown dollars, the average, quantity, weight and retail", () => {
    const cells = totalsRow(
      markdownTotals([
        row({ markdown: 1, qty: 10, retail: 30 }),
        row({ markdown: 2, qty: 2, retail: 6 }),
      ]),
    );
    expect(cells).toEqual({
      description: "Totals",
      markdown: "$14.00",
      markdown_percent: "29.2%",
      qty: "12",
      weight: "0.00",
      retail: "$36.00",
    });
  });
});
