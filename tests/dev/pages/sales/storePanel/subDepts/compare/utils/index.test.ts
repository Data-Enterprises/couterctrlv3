import { describe, expect, it } from "vitest";
import {
  accountLine,
  bucketCells,
  bucketHead,
  bucketItems,
  bucketOf,
  compareFileName,
  csvHeaders,
  csvRows,
  hotBuckets,
  leadBucket,
  pctText,
  problemOf,
  rowOf,
  salesRows,
  soldCount,
  standRows,
  totalsOf,
} from "@/pages/sales/dev/storePanel/subDepts/compare/utils";
import type { GradedItem } from "@/pages/sales/dev/storePanel/subDepts/interfaces";

const item = (upc: string, ty: number, lw: number | null, ly: number | null, over: Partial<GradedItem> = {}): GradedItem => ({
  productCode: upc, upc, desc: upc, sev: "critical",
  tyNet: ty, tyQty: ty / 2, tyWeight: 0,
  lwNet: lw, lwQty: lw === null ? null : lw / 2, lwWeight: 0,
  lyNet: ly, lyQty: ly === null ? null : ly / 2, lyWeight: 0,
  ...over,
});
const gone = (upc: string, ly: number) => item(upc, 0, null, ly, { hasTY: false });

// Pepsi: two selling less, one more, three that only sold last year.
const pepsi = [
  item("p1", 26, 28, 36.1), item("p2", 25.43, 16.05, 97.57), item("p3", 20.08, 53.52, 63.41),
  gone("p4", 26), gone("p5", 24.4), gone("p6", 19.14),
];
// Coke: still selling, mostly less; one new, one stopped.
const coke = [
  item("c1", 99.96, 174.93, 196.23), item("c2", 49.98, 41.65, 59.82), item("c3", 37.62, 60, 49.5),
  item("c4", 10, null, null), item("c5", 0, 12, 14, { hasTY: false }),
];
const rowsA = pepsi.map((i) => rowOf(i, "sales"));
const rowsB = coke.map((i) => rowOf(i, "sales"));
const cells = [bucketCells(rowsA), bucketCells(rowsB)] as [ReturnType<typeof bucketCells>, ReturnType<typeof bucketCells>];
const totals = [totalsOf(pepsi, "sales"), totalsOf(coke, "sales")] as [ReturnType<typeof totalsOf>, ReturnType<typeof totalsOf>];

describe("bucketOf", () => {
  it("puts every item in one place by what it sold this week, last week and last year", () => {
    expect(pepsi.map((i) => bucketOf(i, "sales"))).toEqual(["less", "more", "less", "lyOnly", "lyOnly", "lyOnly"]);
    expect(coke.map((i) => bucketOf(i, "sales"))).toEqual(["less", "more", "less", "new", "stopped"]);
  });

  it("judges more or less on this week's matched days, as grading does", () => {
    expect(bucketOf(item("x", 100, 80, null, { tyNetForLW: 60 }), "sales")).toBe("less");
  });

  it("leaves out an item that sold in none of the three", () => {
    expect(bucketOf(item("x", 0, null, null, { hasTY: false }), "sales")).toBeNull();
  });
});

describe("bucketCells", () => {
  it("counts each bucket and adds up what its items did", () => {
    expect(cells[0].less.count).toBe(2);
    expect(cells[0].less.amount).toBeCloseTo(-35.44, 6);
    expect(cells[0].more.amount).toBeCloseTo(9.38, 6);
    expect(cells[0].lyOnly.count).toBe(3);
    expect(cells[0].lyOnly.amount).toBeCloseTo(69.54, 6);
    expect(cells[1].new.amount).toBe(10);
    expect(cells[1].stopped.amount).toBe(-12);
  });

  it("adds up to the list's change against last week, last-year-only aside", () => {
    const vsLw = (["more", "less", "new", "stopped"] as const).reduce((t, b) => t + cells[1][b].amount, 0);
    expect(vsLw).toBeCloseTo(totals[1].tyNet - totals[1].lwNet, 6);
  });
});

describe("a list's problem", () => {
  it("finds each list's problem: gone since last year, or selling less and stopping", () => {
    expect(problemOf(cells[0])).toBe("lyOnly");
    expect(problemOf(cells[1])).toBe("recent");
    expect(hotBuckets(cells[0])).toEqual(["lyOnly"]);
    expect(hotBuckets(cells[1])).toEqual(["less", "stopped"]);
    expect(leadBucket(cells[1])).toBe("less");
  });
});

describe("pctText and soldCount", () => {
  it("gives a change to a tenth with a real minus", () => {
    expect([pctText(-26.714), pctText(5.12)]).toEqual(["−26.7%", "+5.1%"]);
  });

  it("counts the items that sold this week or last", () => {
    expect([soldCount(cells[0]), soldCount(cells[1])]).toEqual([3, 5]);
  });
});

describe("accountLine", () => {
  it("gives each list's size and how much of it has not sold since last year", () => {
    expect(accountLine(cells, ["pepsi", "coke"])).toBe(
      "pepsi 6 items, 3 not sold since last year | coke 5 items, 0 not sold since last year",
    );
  });
});

describe("bucketHead", () => {
  it("says what the open bucket holds", () => {
    expect(bucketHead("lyOnly", 18)).toBe("18 items sold last year and nothing this week.");
    expect(bucketHead("new", 1)).toBe("1 item new this week.");
  });
});

describe("standRows", () => {
  it("gives each bucket both lists' count and what those items did", () => {
    const rows = standRows(cells, "sales");
    expect(rows.map((r) => r.label)).toEqual(["Selling more", "Selling less", "New this week", "Stopped this week", "Sold last year only"]);
    expect(rows[4].cells[0]).toEqual({ side: "A", count: 3, amount: "$69.54", tone: "plain" });
    expect(rows[1].cells[1]).toEqual({ side: "B", count: 2, amount: "−$97.35", tone: "down" });
    expect(rows[2].cells[0]).toEqual({ side: "A", count: 0, amount: "", tone: "plain" });
  });
});

describe("salesRows", () => {
  it("leads with this week, then each list's change against last week and last year", () => {
    const [tw, lw] = salesRows(totals[0], totals[1], "sales");
    expect([tw.cells[0].fig, tw.cells[0].pct]).toEqual(["$71.51", null]);
    expect(tw.cells[0].value).toBeCloseTo(71.51, 6);
    expect([lw.label, lw.cells[0].fig]).toEqual(["Last week", "$97.57"]);
    expect(lw.cells[0].value).toBeCloseTo(97.57, 6);
    expect(lw.cells[0].pct).toBeCloseTo(-26.71, 2);
  });
});

describe("the open tab", () => {
  it("lists a bucket's items from both lists, biggest first", () => {
    const items = bucketItems(rowsA, rowsB, "less");
    expect(items.map((i) => [i.side, i.row.key])).toEqual([["B", "c1"], ["A", "p3"], ["B", "c3"], ["A", "p1"]]);
  });
});

describe("the export", () => {
  it("names the measure its changes are on, and where each item stands", () => {
    expect(csvHeaders("sales")[3]).toBe("Where it stands");
    expect(csvHeaders("qty")[11]).toBe("vs LY % (units)");
  });

  it("lists A then B, then a total for each, blank where an item had no sale", () => {
    const rows = csvRows([
      { side: "A", label: "Crit | pepsi", rows: rowsA, totals: totals[0] },
      { side: "B", label: "Crit | coke", rows: rowsB, totals: totals[1] },
    ]);
    expect(rows).toHaveLength(13);
    expect(rows[3].slice(0, 9)).toEqual(["A: Crit | pepsi", "p4", "p4", "Sold last year only", "", "", "", "", ""]);
    expect(rows[11][2]).toBe("Total (6 items)");
    expect(rows[11][5]).toBe(35.755);
  });

  it("names the file for the store, the department and the week", () => {
    expect(compareFileName("018 - PLF LOUISVILLE KY", "Soft Drinks", "Nov 6 – Nov 12")).toBe(
      "018___PLF_LOUISVILLE_KY_Soft_Drinks_compare_Nov_6___Nov_12.csv",
    );
  });
});
