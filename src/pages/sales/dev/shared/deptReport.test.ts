import { describe, expect, it } from "vitest";
import {
  buildReport,
  chainFor,
  NOT_CHECKED,
  splitGap,
  totalsFrom,
  type Bands,
  type DeptTotals,
  type Gates,
} from "./deptReport";
import type { SubSale } from "../../../../interfaces";

const dept = (over: Partial<DeptTotals> = {}): DeptTotals => ({
  key: "thing",
  mineId: 1,
  theirsId: 1,
  // Both stores carry it unless a test says otherwise — these cases are
  // about ranking a gap, which only a comparable department has.
  matched: true,
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

describe("the chain", () => {
  const gates: Gates = { units: 0.05, rate: 0.05, mix: 0.25 };
  const run = (o: Partial<DeptTotals>) => chainFor(dept(o), gates);
  const marks = (o: Partial<DeptTotals>) => run(o).gates.map((g) => g.state);

  /** Nothing to compare: the later gates are meaningless, not failures. */
  it("stops at the first gate when nothing rang", () => {
    const c = run({ mine: 0, mineUnits: 0, theirs: 4887.47, theirsUnits: 661 });
    expect(c.finding).toBe("nothing-rung");
    expect(c.gates.map((g) => g.state)).toEqual(["fail", "skipped", "skipped"]);
    expect(c.says.lead).toBe("Nothing rung");
    expect(c.says.tail).toBe(" all week.");
    expect(c.focus).toBe("ringing");
    expect(c.cta).toBe("Check ringing");
  });

  it("calls a unit shortfall a volume problem", () => {
    const c = run({ mine: 7000, mineUnits: 1400, theirs: 10000, theirsUnits: 2000 });
    expect(c.finding).toBe("fewer-units");
    // The first mark is the gap itself: behind, so it fails.
    expect(marks({ mine: 7000, mineUnits: 1400, theirs: 10000, theirsUnits: 2000 }))
      .toEqual(["fail", "fail", "pass"]);
    expect(c.cta).toBe("Check orders");
  });

  /** Sold MORE and still took less: the volume gate passes and the rate gate
   *  is the whole finding. */
  it("reads a modest rate shortfall as price", () => {
    const c = run({ mine: 9000, mineUnits: 1050, theirs: 9500, theirsUnits: 1000 });
    expect(c.finding).toBe("lower-price");
    expect(c.focus).toBe("price");
    expect(c.cta).toBe("Check prices");
  });

  /**
   * Half the take per pound is not a department that priced low — it is
   * selling something else. Sending somebody to compare price tags would
   * send them to the one place the answer is not.
   */
  it("reads a wide rate shortfall as mix, not price", () => {
    // Meat by #, real: $4.70 a lb against $8.75.
    const c = run({
      weighed: true,
      mine: 13113.23, mineUnits: 2789.434,
      theirs: 23251.47, theirsUnits: 2658.102,
    });
    expect(c.finding).toBe("different-mix");
    expect(c.cta).toBe("Check the mix");
    expect(c.says.lead).toBe("Took $4.05 less per lb");
    expect(c.says.tail).toContain("far more than a price difference");
    expect(c.gates[2].value).toBe("$4.70 vs $8.75");
  });

  /** A take per unit is money over units — a figure no customer paid. The
   *  tile is headed "Take per lb" and never "Per lb", which would read as a
   *  shelf price and send somebody to compare price tags. */
  it("never heads the rate as a price", () => {
    const c = run({
      weighed: true,
      mine: 9000, mineUnits: 1000, theirs: 9500, theirsUnits: 1000,
    });
    expect(c.gates[2].label).toBe("Take per lb");
    expect(c.gates[2].value).toBe("$9.00 vs $9.50");
  });

  /** A gate the chain never reached says so, rather than showing a figure
   *  that was never weighed against anything. */
  it("marks a gate it never reached as unchecked", () => {
    const c = run({ mine: 0, mineUnits: 0, theirs: 4997.18, theirsUnits: 600 });
    expect(c.gates[0].value).toBe("−$4,997.18");
    expect(c.gates[1].value).toBe(NOT_CHECKED);
    expect(c.gates[2].value).toBe(NOT_CHECKED);
  });

  /** Both gates pass and the store is three thousand dollars up. "Level
   *  with the other store" was tolerable while these were a count in a
   *  footer; each one gets a panel of its own now. */
  it("calls a department that is ahead ahead, not level", () => {
    const c = run({ mine: 13000, mineUnits: 1300, theirs: 10000, theirsUnits: 1000 });
    expect(c.finding).toBe("ahead");
    expect(c.says.lead).toBe("Ahead");
    expect(c.says.tail).toContain("30% more units");
  });

  /** Level still means level: the same money, so neither word applies. */
  it("keeps level for a department that matches", () => {
    const c = run({ mine: 10000, mineUnits: 1000, theirs: 10000, theirsUnits: 1000 });
    expect(c.finding).toBe("level");
  });

  it("lets the split decide which gate leads when both fail", () => {
    // Units down a tenth, rate down by half: the rate carries the gap, so
    // reading the gates left to right would blame the wrong one.
    const c = run({ mine: 4500, mineUnits: 900, theirs: 10000, theirsUnits: 1000 });
    expect(marks({ mine: 4500, mineUnits: 900, theirs: 10000, theirsUnits: 1000 }))
      .toEqual(["fail", "fail", "fail"]);
    expect(c.finding).toBe("different-mix");
  });

  it("says so when both are inside the gates and it is still behind", () => {
    // 3% fewer at 3% less compounds to 6% behind with nothing to point at.
    const c = run({ mine: 9409, mineUnits: 970, theirs: 10000, theirsUnits: 1000 });
    expect(c.finding).toBe("a-little-less");
    expect(c.focus).toBe("unknown");
    expect(c.cta).toBe("Investigate");
  });
});

describe("what the report prints", () => {
  const bands: Bands = { cut: 0.6, steep: 0.4 };

  /** Shares of a 100 shortfall: 30, 20, 10, 10, 10, 10, 10. */
  const spread = () =>
    [30, 20, 10, 10, 10, 10, 10].map((loss, i) =>
      dept({
        key: `d${i}`, mineId: i, theirsId: i,
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
    const r = buildReport(spread(), bands);
    expect(r.shown.map((x) => x.name)).toEqual(["D0", "D1", "D2"]);
    expect(r.shownShare).toBeCloseTo(0.6, 6);
  });

  it("prints one row when one department is the whole problem", () => {
    const depts = [
      dept({ key: "d1", mineId: 1, theirsId: 1, name: "Big", mine: 10, mineUnits: 5, theirs: 1000, theirsUnits: 50 }),
      dept({ key: "d2", mineId: 2, theirsId: 2, name: "Small", mine: 95, mineUnits: 10, theirs: 100, theirsUnits: 10 }),
    ];
    expect(buildReport(depts, bands).shown.map((x) => x.name)).toEqual(["Big"]);
  });

  it("separates over from under and nets them", () => {
    const depts = [
      dept({ key: "d1", mineId: 1, theirsId: 1, mine: 60, mineUnits: 6, theirs: 100, theirsUnits: 10 }),
      dept({ key: "d2", mineId: 2, theirsId: 2, mine: 130, mineUnits: 13, theirs: 100, theirsUnits: 10 }),
    ];
    const r = buildReport(depts, bands);
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
      dept({ key: "d99", mineId: 99, theirsId: 99, name: "Halved", mine: 4, mineUnits: 2, theirs: 12, theirsUnits: 6 }),
    ]);
    const r = buildReport(depts, bands);
    expect(r.shown.map((x) => x.name)).not.toContain("Halved");
    expect(r.steep.map((x) => x.name)).toEqual(["Halved"]);
    expect(r.steep[0].dropoff).toBeCloseTo(2 / 3, 6);
  });

  it("never names a printed department as steep — it is already on screen", () => {
    const depts = [
      dept({ key: "d1", mineId: 1, theirsId: 1, name: "Big", mine: 10, mineUnits: 5, theirs: 1000, theirsUnits: 50 }),
    ];
    const r = buildReport(depts, bands);
    expect(r.shown.map((x) => x.name)).toEqual(["Big"]);
    expect(r.steep).toEqual([]);
  });

  it("prints everything when there is nothing to apportion", () => {
    const r = buildReport([dept({ key: "d1", mineId: 1, theirsId: 1, mine: 100, theirs: 100 })], bands);
    expect(r.underTotal).toBe(0);
    expect(r.shownShare).toBe(0);
  });
});

describe("grouping by what failed", () => {
  const bands: Bands = { cut: 0.6, steep: 0.4 };

  /**
   * Four departments that rang nothing are one problem with one owner. A
   * size ranking scatters them; this is what catches the small-but-broken
   * one the dollar cut can never reach.
   */
  it("collects the departments that failed the same gate", () => {
    const silent = (id: number, theirs: number) =>
      dept({
        key: `s${id}`,
        mineId: id,
        theirsId: id,
        name: `S${id}`,
        mine: 0,
        mineUnits: 0,
        theirs,
        theirsUnits: 100,
      });
    const r = buildReport(
      [
        dept({ key: "d1", mineId: 1, theirsId: 1, name: "Big", mine: 7000, mineUnits: 1400, theirs: 10000, theirsUnits: 2000 }),
        silent(2, 900),
        silent(3, 400),
        silent(4, 150),
      ],
      bands,
    );
    const quiet = r.byFinding.find((g) => g.finding === "nothing-rung");
    expect(quiet?.rows.map((x) => x.name)).toEqual(["S2", "S3", "S4"]);
    expect(quiet?.total).toBeCloseTo(1450, 6);
  });

  it("puts the costliest group first", () => {
    const r = buildReport(
      [
        dept({ key: "d1", mineId: 1, theirsId: 1, name: "Quiet", mine: 0, mineUnits: 0, theirs: 500, theirsUnits: 50 }),
        dept({ key: "d2", mineId: 2, theirsId: 2, name: "Thin", mine: 7000, mineUnits: 1400, theirs: 10000, theirsUnits: 2000 }),
      ],
      bands,
    );
    expect(r.byFinding[0].finding).toBe("fewer-units");
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

  it("keeps a department only one store carries, and marks it unmatched", () => {
    const out = totalsFrom({
      mineTw: [row({ sub_department: 10, total_sales: 100, qty: 2 })],
      theirsTw: [row({ sub_department: 20, sub_department_description: "Bakery", total_sales: 80, qty: 3 })],
      mineLw: [], mineLy: [], theirsLw: [], theirsLy: [],
    });
    expect(out).toHaveLength(2);
    const bakery = out.find((d) => d.name === "Bakery");
    expect(bakery?.mine).toBe(0);
    // Theirs only: no number on our side, and nothing to be behind on.
    expect(bakery?.matched).toBe(false);
    expect(bakery?.mineId).toBeNull();
    expect(bakery?.theirsId).toBe(20);
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

/**
 * Brooks Chapel Hill (1105) against Brooks Tupelo (1521), week ending
 * 10/22/2026 — the pair the bug was found on.
 *
 * Their sub-department numbering has nothing to do with each other: Chapel
 * Hill's 5 is Fresh Meat where Tupelo's 5 is Tobacco, and Chapel Hill's 10 is
 * Tobacco where Tupelo's 10 is Deli/Bakery. Pairing on the number reported
 * Chapel Hill $65,828.85 behind on cigarettes, which was $243.72 of tobacco
 * set against $66,072.57 of somebody else's deli.
 */
describe("pairing two stores that number their departments differently", () => {
  const at = (sub: number, name: string, sales: number) =>
    row({
      sub_department: sub,
      sub_department_description: name,
      total_sales: sales,
      total_tax: 0,
      qty: 1,
    });

  const brooks = () =>
    totalsFrom({
      mineTw: [
        at(5, "Fresh Meat", 26150.59),
        at(10, "Tobacco", 243.72),
        at(3, "Non-Foods", 8537.01),
        at(9, "Frozen Foods", 13702.56),
        at(14, "Lottery", 187),
      ],
      theirsTw: [
        at(12, "FRESH MEAT", 28065.56),
        at(5, "Tobacco", 8.49),
        at(10, "Deli/Bakery", 66072.57),
        at(4, "Non-Food", 9517.84),
        at(7, "Frozen Food", 11400.64),
        at(97, "UNLEADED", 61519.29),
      ],
      mineLw: [], mineLy: [], theirsLw: [], theirsLy: [],
    });

  const find = (out: ReturnType<typeof brooks>, name: string) =>
    out.find((d) => d.name.toLowerCase() === name.toLowerCase());

  it("puts tobacco against tobacco", () => {
    const t = find(brooks(), "Tobacco")!;
    expect(t.mine).toBeCloseTo(243.72, 2);
    expect(t.theirs).toBeCloseTo(8.49, 2);
    // Chapel Hill is AHEAD on tobacco by $235.23. It was told it was
    // $65,828.85 behind.
    expect(t.mine - t.theirs).toBeCloseTo(235.23, 2);
  });

  it("keeps each store's own number for the drill", () => {
    const t = find(brooks(), "Tobacco")!;
    expect(t.mineId).toBe(10);
    expect(t.theirsId).toBe(5);
  });

  it("matches across case and a trailing s", () => {
    expect(find(brooks(), "Fresh Meat")!.theirs).toBeCloseTo(28065.56, 2);
    expect(find(brooks(), "Non-Foods")!.theirs).toBeCloseTo(9517.84, 2);
    expect(find(brooks(), "Frozen Foods")!.theirs).toBeCloseTo(11400.64, 2);
  });

  it("does not invent a counterpart for a department the other store lacks", () => {
    const fuel = find(brooks(), "UNLEADED")!;
    expect(fuel.matched).toBe(false);
    expect(fuel.mine).toBe(0);
    expect(fuel.mineId).toBeNull();

    const lottery = find(brooks(), "Lottery")!;
    expect(lottery.matched).toBe(false);
    expect(lottery.theirs).toBe(0);
  });
});

describe("a report over two differently numbered stores", () => {
  const at = (sub: number, name: string, sales: number) =>
    row({
      sub_department: sub,
      sub_department_description: name,
      total_sales: sales,
      total_tax: 0,
      qty: 1,
    });

  const report = () =>
    buildReport(
      totalsFrom({
        mineTw: [at(1, "Grocery", 1000), at(14, "Lottery", 50)],
        theirsTw: [at(1, "Grocery", 1500), at(97, "UNLEADED", 9000)],
        mineLw: [], mineLy: [], theirsLw: [], theirsLy: [],
      }),
    );

  it("leaves the uncomparable departments out of the piles", () => {
    const r = report();
    // Only Grocery is comparable: $500 behind, nothing ahead.
    expect(r.underTotal).toBe(500);
    expect(r.overTotal).toBe(0);
    expect(r.matchedNet).toBe(-500);
    // Fuel is not a shortfall. It used to be the biggest row on the screen.
    expect(r.under.some((x) => x.name === "UNLEADED")).toBe(false);
  });

  it("accounts for them separately, so the three parts still add up", () => {
    const r = report();
    expect(r.onlyMineTotal).toBe(50);
    expect(r.onlyTheirsTotal).toBe(9000);
    expect(r.onlyMine.map((x) => x.name)).toEqual(["Lottery"]);
    expect(r.onlyTheirs.map((x) => x.name)).toEqual(["UNLEADED"]);
    // matchedNet + mine-only - theirs-only is the whole difference between
    // the two stores, which is what the headline reports.
    expect(r.netGap).toBe(-500 + 50 - 9000);
  });

  it("still names the right departments in the findings", () => {
    const r = report();
    expect(r.byFinding.flatMap((g) => g.rows.map((x) => x.name))).toEqual([
      "Grocery",
    ]);
  });
});

describe("the sold gate's percentage", () => {
  const gates = { units: 0.05, rate: 0.05, mix: 0.2 };
  const soldValue = (mineUnits: number, theirsUnits: number) =>
    chainFor(
      dept({ mine: 1, theirs: 100, mineUnits, theirsUnits }),
      gates,
    ).gates.find((g) => g.name === "sold")!.value;

  it("says 100% only when the store really rang nothing", () => {
    expect(soldValue(0, 9051)).toBe("100% fewer units");
  });

  it("does not round a near-miss up to none at all", () => {
    // Chapel Hill rang 16 units of tobacco against Tupelo's 9,051 — 99.8%
    // fewer. Math.round made that "100% fewer units", which reads as NONE,
    // and is what made the row look impossible.
    expect(soldValue(16, 9051)).toBe("99% fewer units");
  });

  it("leaves everything else alone", () => {
    expect(soldValue(50, 100)).toBe("50% fewer units");
    expect(soldValue(150, 100)).toBe("50% more units");
  });
});
