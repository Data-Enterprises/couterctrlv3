import { describe, expect, it } from "vitest";
import type { SubDeptMargin, WeeklySale } from "@/interfaces";
import { asLastYearSlots } from "@/utils/perfPairs";
import {
  DEPT_RING_KEY,
  DEPT_RING_LABEL,
  foldDepartmentRings,
  withProductCode,
} from "@/pages/sales/dev/utils/ledgerUtils";
import {
  buildItemPairs,
  buildStorePairs,
  buildTotals,
  fmtUnits,
  mergeLastWeek,
  pairChangePct,
  pairChangePctLw,
  pickFor,
  scopeMatch,
  sortPairs,
} from "@/pages/sales/dev/mobile/perf/utils/perfData";

const S = { storeid: 695, store_number: "361", store_name: "Bruces 361" };

const week = (date: string, net: number, qty: number): WeeklySale => ({
  ...S,
  sale_date: `${date}T00:00:00`,
  net_sales: net,
  total_sales: net,
  total_tax: 0,
  qty,
  weight: 0,
});

// This week Wed 10/21 to Tue 10/27; last week the seven days before it.
const TY = ["21", "22", "23", "24", "25", "26", "27"].map((d) => `2026-10-${d}`);
const LW = ["14", "15", "16", "17", "18", "19", "20"].map((d) => `2026-10-${d}`);

const weekTy = TY.map((d) => week(d, 100, 10));
// Last week sold 80 a day, 8 units: re-dated the way the screen stores it.
const weekLw = asLastYearSlots(LW.map((d) => week(d, 80, 8)));

describe("last week beside last year", () => {
  it("totals last week on its matched days", () => {
    const t = buildTotals(weekTy, [], [], [], null, null, weekLw);
    expect(t.valueLw).toBe(560);
    expect(t.valueForLw).toBe(700);
    expect(t.noLw).toBe(false);
  });

  it("says no history when last week has nothing on file", () => {
    const t = buildTotals(weekTy, [], [], [], null, null, []);
    expect(t.noLw).toBe(true);
  });

  it("puts last week's figure on every row", () => {
    const nameOf = () => "Bruces 361";
    const merged = mergeLastWeek(
      buildStorePairs(weekTy, [], null, nameOf),
      buildStorePairs(weekTy, weekLw, null, nameOf),
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].lw).toBe(560);
    expect(pairChangePctLw(merged[0])).toBeCloseTo(25);
    // No last year here, so the last-year change has nothing to divide by.
    expect(pairChangePct(merged[0])).toBeNull();
  });

  it("keeps a row only last week had", () => {
    const merged = mergeLastWeek(
      [{ key: "a", label: "A", ty: 10, ly: 5, tyForLy: 10 }],
      [
        { key: "a", label: "A", ty: 10, ly: 8, tyForLy: 10 },
        { key: "b", label: "B", ty: 0, ly: 40, tyForLy: 0 },
      ],
    );
    expect(merged.map((p) => [p.key, p.lw])).toEqual([
      ["a", 8],
      ["b", 40],
    ]);
  });

  it("sorts by the drop against last week, rows without one last", () => {
    const rows = [
      { key: "flat", label: "", ty: 10, ly: 0, tyForLy: 10, lw: 10, tyForLw: 10 },
      { key: "down", label: "", ty: 5, ly: 0, tyForLy: 5, lw: 10, tyForLw: 5 },
      { key: "none", label: "", ty: 7, ly: 0, tyForLy: 7 },
    ];
    expect(sortPairs(rows, "changeLw").map((p) => p.key)).toEqual([
      "down",
      "flat",
      "none",
    ]);
  });
});

describe("sales or units", () => {
  it("measures units with the same matching as sales", () => {
    const t = buildTotals(weekTy, [], [], [], null, null, weekLw, pickFor("units"));
    expect(t.value).toBe(70);
    expect(t.valueLw).toBe(56);
    // The basket stays money whatever is measured.
    expect(t.sales).toBe(700);
  });

  it("prints units as a whole count", () => {
    expect(fmtUnits(1234.6)).toBe("1,235");
  });

  it("matches the same days either way", () => {
    expect(scopeMatch(weekTy, weekLw, null).lyDays).toBe(7);
  });
});

describe("the department's own sales", () => {
  const item = (code: unknown, desc: string, net: number): SubDeptMargin =>
    ({
      ...S,
      sale_date: "2026-10-22T00:00:00",
      product_code: code,
      product_description: desc,
      total_sales: net,
      total_tax: 0,
      qty: 1,
      weight: 0,
    }) as unknown as SubDeptMargin;

  const rows = [
    item(0, "Grocery", 412.18),
    item(null, "Refunded", -12.18),
    item("", "Grocery", 5),
    item("0.0", "Grocery", 5),
    item("0041000", "Cola 12pk", 9.99),
  ];

  it("is folded into one labelled row instead of dropped", () => {
    const folded = foldDepartmentRings(rows);
    expect(folded.filter((r) => r.product_code === DEPT_RING_KEY)).toHaveLength(4);
    expect(folded.find((r) => r.product_code === DEPT_RING_KEY)?.product_description).toBe(
      DEPT_RING_LABEL,
    );
    expect(folded[4].product_code).toBe("0041000");
  });

  it("pairs into a single row, refunds netted, so the list adds up", () => {
    const pairs = buildItemPairs(foldDepartmentRings(rows), [], null);
    const dept = pairs.find((p) => p.key === DEPT_RING_KEY);
    expect(dept?.label).toBe(DEPT_RING_LABEL);
    expect(dept?.ty).toBeCloseTo(410);
    expect(pairs.reduce((s, p) => s + p.ty, 0)).toBeCloseTo(419.99);
  });

  it("is still dropped by withProductCode, where a list asks for that", () => {
    expect(withProductCode(rows).map((r) => r.product_code)).toEqual(["0041000"]);
  });
});
