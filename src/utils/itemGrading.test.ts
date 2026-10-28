import { describe, expect, it } from "vitest";
import type { SubDeptMargin } from "../interfaces";
import { collectCriticalItems } from "./itemGrading";

const row = (
  date: string,
  code: string,
  net: number,
  dept = "Grocery",
): SubDeptMargin =>
  ({
    sale_date: `${date}T00:00:00`,
    product_code: code,
    product_description: `Item ${code}`,
    total_sales: net,
    total_tax: 0,
    qty: net / 2,
    weight: 0,
    sub_department_description: dept,
  }) as unknown as SubDeptMargin;

// This week 10/21 to 10/27, last week 10/14 to 10/20. A steady item sells
// every day of both, so last week covers the whole week and grades; last year
// is left empty so nothing else muddies the basis.
const TY_DAYS = ["21", "22", "23", "24", "25", "26", "27"].map((d) => `2026-10-${d}`);
const LW_DAYS = ["14", "15", "16", "17", "18", "19", "20"].map((d) => `2026-10-${d}`);
const steady = (days: string[]) => days.map((d) => row(d, "STEADY", 10));

const codes = (ty: SubDeptMargin[], lw: SubDeptMargin[], ly: SubDeptMargin[] = []) =>
  collectCriticalItems(ty, lw, ly, 9, "sales").map((c) => c.productCode).sort();

describe("collectCriticalItems", () => {
  it("includes an item that sold last week and nothing this week", () => {
    // Down 100%: the most critical an item gets. It used to be dropped,
    // because only this week's items were walked.
    const ty = steady(TY_DAYS);
    const lw = [...steady(LW_DAYS), row("2026-10-15", "GONE", 120)];
    expect(codes(ty, lw)).toEqual(["GONE"]);
  });

  it("includes one from a department that sold nothing at all this week", () => {
    const ty = steady(TY_DAYS);
    const lw = [...steady(LW_DAYS), row("2026-10-16", "SEASONAL", 80, "Seasonal")];
    const found = collectCriticalItems(ty, lw, [], 9, "sales");
    expect(found).toContainEqual({ productCode: "SEASONAL", dept: "Seasonal" });
  });

  it("still grades the rest as before", () => {
    const ty = [...steady(TY_DAYS), row("2026-10-22", "DROP", 50), row("2026-10-23", "NEW", 40)];
    const lw = [...steady(LW_DAYS), row("2026-10-15", "DROP", 100)];
    // DROP is down 50%; STEADY is flat; NEW has nothing to compare against.
    expect(codes(ty, lw)).toEqual(["DROP"]);
  });

  it("leaves out an item that sold nothing in either week", () => {
    expect(codes(steady(TY_DAYS), steady(LW_DAYS))).toEqual([]);
  });
});
