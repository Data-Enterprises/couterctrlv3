import { describe, expect, it } from "vitest";
import {
  buildReport,
  focusOf,
  sentenceFor,
  splitGap,
  totalsFrom,
  type Bands,
  type DeptTotals,
} from "./deptReport";
import type { SubSale } from "../../../../interfaces";

const dept = (over: Partial<DeptTotals> = {}): DeptTotals => ({
  id: 1,
  name: "Thing",
  mine: 0,
  theirs: 0,
  mineUnits: 0,
  theirsUnits: 0,
  weighed: false,
  lwGap: 0,
  lyGap: 0,
  ...over,
});

const row = (over: Partial<SubSale> = {}): SubSale => ({
  sale_date: "2026-10-01",
  storeid: 1,
  store_name: "018 - PLF LOUISVILLE KY",
  store_number: "018",
  sub_department: 10,
  sub_department_description: "Produce",
  total_sales: 0,
  net_sales: 0,
  total_tax: 0,
  qty: 0,
  weight: 0,
  elec_instore_coupons: 0,
  elec_store_coupons: 0,
  digital_coupons: 0,
  store_coupon: 0,
  transaction_count: 0,
  ...over,
});

describe("splitting a gap", () => {
  /**
   * The whole reason the split is trustworthy: it is an identity, not a
   * model. Whatever the numbers, the two halves add back to the gap.
   */
  it("always adds back to the gap, with no residual", () => {
    const cases = [
      dept({ mine: 9284.4, mineUnits: 4012, theirs: 17704.51, theirsUnits: 5171 }),
      dept({ mine: 11600, mineUnits: 1995, theirs: 18400.77, theirsUnits: 3120 }),
      // Sold MORE and took less — the two effects pull against each other.
      dept({ mine: 4019.78, mineUnits: 2300, theirs: 8000, theirsUnits: 2050 }),
      // Ahead on both.
      dept({ mine: 9000, mineUnits: 3000, theirs: 6000, theirsUnits: 2400 }),
      // Sold nothing.
      dept({ mine: 0, mineUnits: 0, theirs: 5000, theirsUnits: 900 }),
    ];
    for (const d of cases) {
      const s = splitGap(d);
      expect(s).not.toBeNull();
      expect(s!.volume + s!.rate).toBeCloseTo(d.mine - d.theirs, 6);
    }
  });

  it("values the unit difference at the OTHER store's rate", () => {
    // 1,159 fewer at 020's $3.4238 a lb.
    const s = splitGap(
      dept({ mine: 9284.4, mineUnits: 4012, theirs: 17704.51, theirsUnits: 5171 }),
    );
    expect(s!.volume).toBeCloseTo(-3968.19, 1);
    expect(s!.rate).toBeCloseTo(-4451.92, 1);
  });

  it("puts the whole gap on volume when we sold none", () => {
    const d = dept({ mine: 0, mineUnits: 0, theirs: 5000, theirsUnits: 900 });
    const s = splitGap(d);
    expect(s!.volume).toBeCloseTo(-5000, 6);
    expect(s!.rate).toBe(0);
  });

  it("cannot form a split when THEY sold none", () => {
    // There is no rate to value our unit difference at. A null says so
    // rather than dividing by zero and printing a figure.
    expect(splitGap(dept({ mine: 900, mineUnits: 200, theirs: 0, theirsUnits: 0 })))
      .toBeNull();
  });
});

describe("where to look first", () => {
  it("sends a volume-shaped gap to orders and a rate-shaped one to price", () => {
    expect(focusOf({ volume: -6634, rate: -166 })).toBe("orders");
    expect(focusOf({ volume: 975, rate: -4955 })).toBe("price");
    expect(focusOf(null)).toBe("unknown");
  });
});

describe("the sentence", () => {
  const d = (o: Partial<DeptTotals>) => {
    const x = dept(o);
    return sentenceFor(x, splitGap(x), "020");
  };

  it("names both sides when both are material", () => {
    expect(
      d({ mine: 9284.4, mineUnits: 4012, theirs: 17704.51, theirsUnits: 5171 }),
    ).toBe("Sold 1,159 fewer units, and took less for every unit it did sell.");
  });

  /** $166 against $6,635 is not a price problem, and saying so would send
   *  somebody to look at a price that is fine. */
  it("suppresses a side worth under a tenth of the other", () => {
    expect(
      d({ mine: 11600, mineUnits: 1995, theirs: 18400.77, theirsUnits: 3120 }),
    ).toBe("Sold 1,125 fewer units, at much the same take per unit.");
  });

  it("says BUT when the two pull against each other", () => {
    expect(d({ mine: 4019.78, mineUnits: 2300, theirs: 8000, theirsUnits: 2050 })).toBe(
      "Sold 250 more units, but took less for every unit it did sell.",
    );
  });

  it("counts a weighed department in pounds", () => {
    expect(
      d({
        weighed: true,
        mine: 9284.4,
        mineUnits: 4012,
        theirs: 17704.51,
        theirsUnits: 5171,
      }),
    ).toContain("1,159 fewer lb");
  });

  it("says so when there is nothing to compare against", () => {
    expect(d({ mine: 900, mineUnits: 200, theirs: 0, theirsUnits: 0 })).toBe(
      "020 sold none of this department.",
    );
  });

  /**
   * The identity puts the whole gap on volume and leaves rate at zero, which
   * is right — but "at much the same take per unit" then claims a pricing
   * fact about a department that never rang a single unit.
   */
  it("says nothing about price when we sold none of it", () => {
    expect(d({ mine: 0, mineUnits: 0, theirs: 4211.21, theirsUnits: 548 })).toBe(
      "Sold none of this department.",
    );
  });
});

describe("what the report prints", () => {
  const bands: Bands = { cut: 0.6, steep: 0.4 };

  /** Shares of a 100 shortfall: 30, 20, 10, 10, 10, 10, 10. */
  const spread = () =>
    [30, 20, 10, 10, 10, 10, 10].map((loss, i) =>
      dept({
        id: i,
        name: `D${i}`,
        mine: 100 - loss,
        mineUnits: 10,
        theirs: 100,
        theirsUnits: 10,
      }),
    );

  it("prints the department that carries the cut past the line", () => {
    // 30 -> 50 -> 60. The third is tested at a running total of 50%, which
    // is under the cut, so it prints even though it takes the total past it.
    const r = buildReport(spread(), "020", bands);
    expect(r.shown.map((x) => x.name)).toEqual(["D0", "D1", "D2"]);
    expect(r.shownShare).toBeCloseTo(0.6, 6);
  });

  it("prints one row when one department is the whole problem", () => {
    const depts = [
      dept({ id: 1, name: "Big", mine: 10, mineUnits: 5, theirs: 1000, theirsUnits: 50 }),
      dept({ id: 2, name: "Small", mine: 95, mineUnits: 10, theirs: 100, theirsUnits: 10 }),
    ];
    expect(buildReport(depts, "020", bands).shown.map((x) => x.name)).toEqual(["Big"]);
  });

  it("separates over from under and nets them", () => {
    const depts = [
      dept({ id: 1, mine: 60, mineUnits: 6, theirs: 100, theirsUnits: 10 }),
      dept({ id: 2, mine: 130, mineUnits: 13, theirs: 100, theirsUnits: 10 }),
    ];
    const r = buildReport(depts, "020", bands);
    expect(r.underTotal).toBeCloseTo(40, 6);
    expect(r.overTotal).toBeCloseTo(30, 6);
    expect(r.netGap).toBeCloseTo(-10, 6);
  });

  /**
   * The case the dollar ranking is blind to by construction: a department
   * running at a third of its counterpart, too small to ever make the cut.
   */
  it("names a folded department that is a long way behind in its own terms", () => {
    const depts = spread().concat([
      dept({ id: 99, name: "Halved", mine: 4, mineUnits: 2, theirs: 12, theirsUnits: 6 }),
    ]);
    const r = buildReport(depts, "020", bands);
    expect(r.shown.map((x) => x.name)).not.toContain("Halved");
    expect(r.steep.map((x) => x.name)).toEqual(["Halved"]);
    expect(r.steep[0].dropoff).toBeCloseTo(2 / 3, 6);
  });

  it("never names a printed department as steep — it is already on screen", () => {
    const depts = [
      dept({ id: 1, name: "Big", mine: 10, mineUnits: 5, theirs: 1000, theirsUnits: 50 }),
    ];
    const r = buildReport(depts, "020", bands);
    expect(r.shown.map((x) => x.name)).toEqual(["Big"]);
    expect(r.steep).toEqual([]);
  });

  it("prints everything when there is nothing to apportion", () => {
    const r = buildReport([dept({ id: 1, mine: 100, theirs: 100 })], "020", bands);
    expect(r.underTotal).toBe(0);
    expect(r.shownShare).toBe(0);
  });
});

describe("reading the payload", () => {
  it("sums money net of tax and keeps qty and weight apart", () => {
    const out = totalsFrom({
      mineTw: [
        row({ total_sales: 110, total_tax: 10, qty: 5, weight: 0 }),
        row({ total_sales: 220, total_tax: 20, qty: 9, weight: 0 }),
      ],
      mineLw: [], mineLy: [], theirsTw: [], theirsLw: [], theirsLy: [],
    });
    expect(out[0].mine).toBeCloseTo(300, 6);
    expect(out[0].mineUnits).toBe(14);
  });

  /** qty counts LINES on a scale item, so money over qty is money per line.
   *  Weight is the only figure that makes a rate mean anything there. */
  it("counts a department in pounds when BOTH stores ring it by weight", () => {
    const out = totalsFrom({
      mineTw: [row({ total_sales: 100, qty: 3, weight: 42.5 })],
      theirsTw: [row({ total_sales: 120, qty: 4, weight: 50 })],
      mineLw: [], mineLy: [], theirsLw: [], theirsLy: [],
    });
    expect(out[0].weighed).toBe(true);
    expect(out[0].mineUnits).toBe(42.5);
    expect(out[0].theirsUnits).toBe(50);
  });

  it("falls back to qty when only one side rings by weight", () => {
    // Pounds against lines would be worse than lines against lines.
    const out = totalsFrom({
      mineTw: [row({ total_sales: 100, qty: 3, weight: 42.5 })],
      theirsTw: [row({ total_sales: 120, qty: 4, weight: 0 })],
      mineLw: [], mineLy: [], theirsLw: [], theirsLy: [],
    });
    expect(out[0].weighed).toBe(false);
    expect(out[0].mineUnits).toBe(3);
    expect(out[0].theirsUnits).toBe(4);
  });

  it("keeps a department only one store carries", () => {
    const out = totalsFrom({
      mineTw: [row({ sub_department: 10, total_sales: 100, qty: 2 })],
      theirsTw: [row({ sub_department: 20, sub_department_description: "Bakery", total_sales: 80, qty: 3 })],
      mineLw: [], mineLy: [], theirsLw: [], theirsLy: [],
    });
    expect(out).toHaveLength(2);
    expect(out.find((d) => d.id === 20)?.mine).toBe(0);
  });

  it("carries the same subtraction in the two earlier periods", () => {
    const out = totalsFrom({
      mineTw: [row({ total_sales: 100, qty: 2 })],
      mineLw: [row({ total_sales: 90, qty: 2 })],
      mineLy: [row({ total_sales: 70, qty: 2 })],
      theirsTw: [row({ total_sales: 120, qty: 2 })],
      theirsLw: [row({ total_sales: 100, qty: 2 })],
      theirsLy: [row({ total_sales: 60, qty: 2 })],
    });
    expect(out[0].lwGap).toBeCloseTo(-10, 6);
    expect(out[0].lyGap).toBeCloseTo(10, 6);
  });
});
