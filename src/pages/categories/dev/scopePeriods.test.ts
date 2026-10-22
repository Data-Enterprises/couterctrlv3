import { describe, expect, it } from "vitest";
import { scopePeriods } from "./categoriesUtils";
import type { CatSalesDaily } from "../../../interfaces";

/**
 * cat_sales is fetched by storeid, and a few storeids cover two physical
 * stores -- 685 serves store numbers 369 and 370. Sales, Sub Dept Margins and
 * Vendors all split those; this page did not, so every category figure on it
 * was two stores at once with nothing on screen saying so.
 */
const at = (num: string, sales: number): CatSalesDaily =>
  ({
    storeid: 685,
    store_name: "Bruces Foodland 369",
    store_number: num,
    category: 1,
    category_description: "GROCERY",
    sale_date: "2026-10-14",
    total_sales: sales,
    net_sales: sales,
    total_tax: 0,
    qty: 1,
    weight: 0,
  }) as CatSalesDaily;

const raw = {
  tw: [at("369", 100), at("370", 40)],
  lw: [at("369", 90), at("370", 30)],
  ly: [at("369", 80)],
};

describe("scopePeriods", () => {
  it("keeps one location across all three periods", () => {
    const s = scopePeriods(raw, "369");
    expect(s.tw.map((r) => r.net_sales)).toEqual([100]);
    expect(s.lw.map((r) => r.net_sales)).toEqual([90]);
    expect(s.ly.map((r) => r.net_sales)).toEqual([80]);
  });

  it("returns the rows untouched for the combined view", () => {
    // Null is a real question -- what did this storeid do altogether -- and
    // the same object comes back so nothing downstream re-renders for it.
    expect(scopePeriods(raw, null)).toBe(raw);
  });

  it("gives back nothing for a period the location did not trade", () => {
    // 370 has no last year here. Empty is right: buildCategoryRows reads that
    // as no comparison, not as a collapse to zero.
    expect(scopePeriods(raw, "370").ly).toHaveLength(0);
  });

  it("is strict once a location is named", () => {
    // Deliberately not scopeToStoreNumber, which leaves an array alone when it
    // holds fewer than two numbers. That guard answers "does this response
    // need splitting"; here the question is "which location is the reader on".
    const only369 = { tw: [at("369", 10)], lw: [], ly: [] };
    expect(scopePeriods(only369, "370").tw).toHaveLength(0);
  });
});
