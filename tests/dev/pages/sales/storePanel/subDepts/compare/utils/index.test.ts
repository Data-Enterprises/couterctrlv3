import { describe, expect, it } from "vitest";
import {
  answerLine,
  gapLine,
  rowOf,
  sortRows,
  totalsOf,
  weekBoxes,
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
const dates = { tw: "Nov 6 – Nov 12", lw: "Oct 30 – Nov 5", ly: "Nov 7 – Nov 13" };

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

describe("answerLine", () => {
  it("says who sold more this week, and who led before", () => {
    expect(answerLine(totalsOf(pepsi, "sales"), totalsOf(coke, "sales"), "sales")).toBe(
      "B outsold A by $67.26 this week. Last week A led by $17.32, and last year by $151.90.",
    );
  });

  it("names each leader when they differ", () => {
    const a = [item("a", 10, 20, 5)];
    const b = [item("b", 20, 10, 30)];
    expect(answerLine(totalsOf(a, "sales"), totalsOf(b, "sales"), "sales")).toBe(
      "B outsold A by $10.00 this week. Last week A led by $10.00, and last year B led by $25.00.",
    );
  });

  it("speaks in units when grading on units", () => {
    const a = [item("a", 10, 10, null)];
    const b = [item("b", 30, 10, null)];
    expect(answerLine(totalsOf(a, "qty"), totalsOf(b, "qty"), "qty")).toBe(
      "B outsold A by 10 units this week. Last week they were level.",
    );
  });
});

describe("gapLine", () => {
  it("says ahead this week, led before, and level within a cent", () => {
    expect(gapLine(5, 2, true, "sales")).toBe("A ahead by $3.00");
    expect(gapLine(2, 5, false, "sales")).toBe("B led by $3.00");
    expect(gapLine(2, 2.001, true, "sales")).toBe("Level");
  });
});

describe("weekBoxes", () => {
  it("gives each week both lists, their change to this week, and who is ahead", () => {
    const [tw, lw, ly] = weekBoxes(totalsOf(pepsi, "sales"), totalsOf(coke, "sales"), "sales", dates);
    expect(tw.lines.map((l) => [l.side, l.value, l.pct])).toEqual([["A", "$174.04", null], ["B", "$241.30", null]]);
    expect(tw.gap).toBe("B ahead by $67.26");
    expect(lw.lines[0].value).toBe("$336.07");
    expect(lw.lines[0].pct).toBeCloseTo(-48.21, 2);
    expect(lw.gap).toBe("A led by $17.32");
    expect(ly.dates).toBe("Nov 7 – Nov 13");
  });

  it("says when neither list sold that week", () => {
    const [, lw] = weekBoxes(totalsOf([item("a", 1, null, 1)], "sales"), totalsOf([item("b", 1, null, 1)], "sales"), "sales", dates);
    expect(lw.gap).toBe("No sales last week");
    expect(lw.lines[0].value).toBe("—");
  });
});

describe("sortRows", () => {
  const rows = [item("a", 10, 20, null), item("b", 30, 31, 10), item("c", 0, 5, 5, { hasTY: false })].map((i) => rowOf(i, "sales"));

  it("ranks this week biggest first, an item with no sale this week last", () => {
    expect(sortRows(rows, "ty", "sales").map((r) => r.key)).toEqual(["b", "a", "c"]);
  });

  it("ranks a change biggest drop first, nothing to compare last", () => {
    expect(sortRows(rows, "vsLW", "sales").map((r) => r.key)).toEqual(["c", "a", "b"]);
    expect(sortRows(rows, "vsLY", "sales").map((r) => r.key)).toEqual(["c", "b", "a"]);
  });
});
