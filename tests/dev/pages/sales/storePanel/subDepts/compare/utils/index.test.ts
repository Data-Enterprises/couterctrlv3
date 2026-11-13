import { describe, expect, it } from "vitest";
import {
  compareFileName,
  csvHeaders,
  csvRows,
  gapLine,
  rowOf,
  totalsOf,
  weekBars,
} from "@/pages/sales/dev/storePanel/subDepts/compare/utils";
import type { GradedItem } from "@/pages/sales/dev/storePanel/subDepts/interfaces";

const item = (upc: string, ty: number, lw: number | null, ly: number | null, over: Partial<GradedItem> = {}): GradedItem => ({
  productCode: upc, upc, desc: upc, sev: "critical",
  tyNet: ty, tyQty: ty / 2, tyWeight: 0,
  lwNet: lw, lwQty: lw === null ? null : lw / 2, lwWeight: 0,
  lyNet: ly, lyQty: ly === null ? null : ly / 2, lyWeight: 0,
  ...over,
});
// Sums: A 174.04 / 336.07 / 439.00, B 241.30 / 318.75 / 287.10.
const pepsi = [item("p1", 100, 200, 300), item("p2", 74.04, 136.07, 139)];
const coke = [item("c1", 141.3, 218.75, 187.1), item("c2", 100, 100, 100)];

describe("totalsOf", () => {
  it("adds a list up and takes its changes on the total", () => {
    const t = totalsOf(pepsi, "sales");
    expect(t.count).toBe(2);
    expect(t.tyNet).toBeCloseTo(174.04, 6);
    expect(t.lwPct).toBeCloseTo(-48.21, 2);
    expect(t.lyPct).toBeCloseTo(-60.36, 2);
  });

  it("takes this year over the matched days, as grading does", () => {
    const t = totalsOf([item("x", 100, 100, 100, { tyNetForLW: 50 })], "sales");
    expect(t.lwPct).toBe(-50);
    expect(t.lyPct).toBe(0);
  });

  it("has no change with nothing sold then", () => {
    const t = totalsOf([item("x", 10, null, null)], "sales");
    expect(t.hasLW).toBe(false);
    expect(t.lwPct).toBeNull();
  });
});

const names: [string, string] = ["pepsi", "coke"];

describe("gapLine", () => {
  it("names who is ahead this week, who led before, and level within a cent", () => {
    expect(gapLine(5, 2, true, "sales", names)).toBe("pepsi ahead by $3.00");
    expect(gapLine(2, 5, false, "sales", names)).toBe("coke led by $3.00");
    expect(gapLine(2, 2.001, true, "sales", names)).toBe("Level");
  });

  it("speaks in units when grading on units", () => {
    expect(gapLine(10, 30, true, "qty", names)).toBe("coke ahead by 20 units");
  });
});

describe("weekBars", () => {
  it("splits each week between the two lists, this week first, and says who is ahead", () => {
    const [tw, lw, ly] = weekBars(totalsOf(pepsi, "sales"), totalsOf(coke, "sales"), "sales", names);
    expect([tw.label, lw.label, ly.label]).toEqual(["This week", "Last week", "Last year"]);
    expect([tw.aFig, tw.bFig, tw.aPct, tw.bPct]).toEqual(["$174.04", "$241.30", "42%", "58%"]);
    expect(tw.gap).toBe("coke ahead by $67.26");
    expect(lw.gap).toBe("pepsi led by $17.32");
    expect(ly.gap).toBe("pepsi led by $151.90");
    expect(tw.aShare).toBeCloseTo(41.9, 1);
  });

  it("draws no split for a week neither list sold in", () => {
    const [, lw] = weekBars(totalsOf([item("a", 1, null, 1)], "sales"), totalsOf([item("b", 1, null, 1)], "sales"), "sales", names);
    expect(lw.aShare).toBeNull();
    expect(lw.gap).toBe("No sales last week");
  });
});

describe("the export", () => {
  it("names the measure its changes are on", () => {
    expect(csvHeaders("sales")[7]).toBe("vs LW % (sales)");
    expect(csvHeaders("qty")[10]).toBe("vs LY % (units)");
  });

  it("lists A then B in the panel's order, then a total for each", () => {
    const rows = csvRows([
      { side: "A", label: "Crit | pepsi", rows: pepsi.map((i) => rowOf(i, "sales")), totals: totalsOf(pepsi, "sales") },
      { side: "B", label: "Crit | coke", rows: coke.map((i) => rowOf(i, "sales")), totals: totalsOf(coke, "sales") },
    ]);
    expect(rows.map((r) => [r[0], r[2]])).toEqual([
      ["A: Crit | pepsi", "p1"],
      ["A: Crit | pepsi", "p2"],
      ["B: Crit | coke", "c1"],
      ["B: Crit | coke", "c2"],
      ["A: Crit | pepsi", "Total (2 items)"],
      ["B: Crit | coke", "Total (2 items)"],
    ]);
    expect(rows[0]).toEqual(["A: Crit | pepsi", "p1", "p1", "100.00", 50, "200.00", 100, "-50.00", "300.00", 150, "-66.67"]);
    expect(rows[4].slice(3)).toEqual(["174.04", 87.02, "336.07", 168.035, "-48.21", "439.00", 219.5, "-60.36"]);
  });

  it("leaves a blank, not a zero, where an item had no sale", () => {
    const [row] = csvRows([
      { side: "A", label: "All items", rows: [rowOf(item("x", 0, null, 5, { hasTY: false }), "sales")], totals: totalsOf([], "sales") },
    ]);
    expect(row.slice(3, 8)).toEqual(["", "", "", "", ""]);
  });

  it("names the file for the store, the department and the week", () => {
    expect(compareFileName("018 - PLF LOUISVILLE KY", "Soft Drinks", "Nov 6 – Nov 12")).toBe(
      "018___PLF_LOUISVILLE_KY_Soft_Drinks_compare_Nov_6___Nov_12.csv",
    );
  });
});
