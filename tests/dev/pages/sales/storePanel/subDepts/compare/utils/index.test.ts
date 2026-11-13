import { describe, expect, it } from "vitest";
import {
  bucketCells,
  bucketHead,
  bucketItems,
  bucketOf,
  compareFileName,
  csvHeaders,
  csvRows,
  hotBuckets,
  leadBucket,
  netVsLw,
  problemOf,
  rowOf,
  salesRows,
  standRows,
  totalsOf,
  verdictCta,
  verdictOf,
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

describe("the verdict", () => {
  it("finds each list's problem: gone since last year, or selling less and stopping", () => {
    expect(problemOf(cells[0])).toBe("lyOnly");
    expect(problemOf(cells[1])).toBe("recent");
    expect(hotBuckets(cells[0])).toEqual(["lyOnly"]);
    expect(hotBuckets(cells[1])).toEqual(["less", "stopped"]);
    expect(leadBucket(cells[1])).toBe("less");
  });

  it("says when the two lists have different problems, with how many items each covers", () => {
    expect(verdictOf(cells, [6, 5])).toEqual({
      lead: "Different problems",
      sides: [
        { n: "3 of 6", says: "gone since last year" },
        { n: "3 of 5", says: "sold less or stopped" },
      ],
    });
  });

  it("says when they share one, or when neither is losing ground", () => {
    expect(verdictOf([cells[1], cells[1]], [5, 5]).lead).toBe("Same problem");
    const up = bucketCells([rowOf(item("u", 20, 10, 5), "sales")]);
    expect(verdictOf([up, up], [1, 1])).toEqual({
      lead: "Both holding up",
      sides: [{ n: "1 of 1", says: "selling more" }, { n: "1 of 1", says: "selling more" }],
    });
  });
});

describe("verdictCta", () => {
  it("reads as the other tabs' Insight strip, graded watch while a list is losing ground", () => {
    expect(verdictCta(verdictOf(cells, [6, 5]), ["pepsi", "coke"])).toEqual({
      name: "pepsi vs coke",
      cta: {
        text: "Different problems. pepsi: 3 of 6 gone since last year | coke: 3 of 5 sold less or stopped.",
        severity: "watch",
      },
    });
  });

  it("goes healthy when both lists are holding up", () => {
    const up = bucketCells([rowOf(item("u", 20, 10, 5), "sales")]);
    expect(verdictCta(verdictOf([up, up], [1, 1]), ["pepsi", "coke"]).cta.severity).toBe("healthy");
  });
});

describe("netVsLw and bucketHead", () => {
  it("adds the four this-week buckets up to the list's change against last week", () => {
    expect(netVsLw(cells[1])).toBeCloseTo(totals[1].tyNet - totals[1].lwNet, 6);
  });

  it("says what the open bucket holds", () => {
    expect(bucketHead("lyOnly", 18)).toBe("18 items sold last year and nothing this week.");
    expect(bucketHead("new", 1)).toBe("1 item new this week.");
  });
});

describe("standRows", () => {
  it("gives each bucket both lists' count, what they did and their share, tinting each verdict's bucket", () => {
    const rows = standRows(cells, [6, 5], "sales");
    expect(rows.map((r) => r.label)).toEqual(["Selling more", "Selling less", "New this week", "Stopped this week", "Sold last year only"]);
    expect(rows[4].cells[0]).toMatchObject({ count: 3, amount: "$69.54 LY", tone: "plain", share: 50, hot: true });
    expect(rows[1].cells[1]).toMatchObject({ count: 2, amount: "−$97.35", tone: "down", hot: true });
    expect(rows[3].cells[1]).toMatchObject({ count: 1, hot: true });
    expect(rows[2].cells[0]).toMatchObject({ count: 0, amount: "", hot: false });
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
