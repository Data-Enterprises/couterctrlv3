import { describe, it, expect } from "vitest";
import { buildWindowPlan, rangeForWeeks } from "./trackerWeeks";
import { buildSubDeptTotals, allDeptsTotal } from "./trackerTotals";
import type { SubSale } from "../../interfaces";

const plan = buildWindowPlan("2026-07-25", "2026-08-21");

const row = (
  date: string,
  opts: Partial<SubSale> & { sales?: number; tax?: number } = {},
): SubSale =>
  ({
    sale_date: date,
    storeid: 1,
    store_name: "Foodland 370",
    store_number: "370",
    sub_department: opts.sub_department ?? 10,
    sub_department_description: opts.sub_department_description ?? "Deli",
    total_sales: opts.sales ?? 110,
    total_tax: opts.tax ?? 10,
    net_sales: 0,
    qty: 1,
    weight: 0,
    elec_instore_coupons: 0,
    elec_store_coupons: 0,
    digital_coupons: 0,
    store_coupon: 0,
    transaction_count: opts.transaction_count ?? 5,
  }) as SubSale;

/** One LY row per date, as the endpoint returns. A holiday can pull two TY
 *  days onto one LY date, so emitting a row per *pair* would double it. */
const lyRows = (value: number, tax = 10) => {
  const byDate = new Map<string, SubSale>();
  for (const p of plan.pairs) {
    byDate.set(p.lyDate, row(p.lyDate, { sales: value, tax }));
  }
  return [...byDate.values()];
};

describe("window plan", () => {
  it("chunks a whole-week range into seven-day buckets", () => {
    expect(plan.weeks).toHaveLength(4);
    expect(plan.pairs).toHaveLength(28);
    expect(plan.tyStart).toBe("2026-07-25");
    expect(plan.tyEnd).toBe("2026-08-21");
    expect(plan.weeks[0].dates).toHaveLength(7);
  });

  it("leaves the short week at the end of an uneven range", () => {
    // 10 days: a full week then three days.
    const p = buildWindowPlan("2026-08-12", "2026-08-21");
    expect(p.weeks).toHaveLength(2);
    expect(p.weeks[0].dates).toHaveLength(7);
    expect(p.weeks[1].dates).toHaveLength(3);
    expect(p.weeks[1].end).toBe("2026-08-21");
    expect(p.pairs).toHaveLength(10);
  });

  it("rangeForWeeks lands on a start that yields whole weeks", () => {
    expect(rangeForWeeks("2026-08-21", 4)).toBe("2026-07-25");
    const p = buildWindowPlan(rangeForWeeks("2026-08-21", 12), "2026-08-21");
    expect(p.weeks).toHaveLength(12);
    expect(p.weeks.every((w) => w.dates.length === 7)).toBe(true);
  });
});

describe("BUG 1: rows bucket by their own date, not array position", () => {
  it("gives the same answer however the rows arrive", () => {
    const dates = plan.weeks.flatMap((w) => w.dates);
    const ordered = dates.map((d, i) =>
      row(d, { sales: (i + 1) * 10, tax: 0 }),
    );
    const shuffled = [...ordered].reverse();

    const a = buildSubDeptTotals(ordered, [], plan);
    const b = buildSubDeptTotals(shuffled, [], plan);

    expect(a[0].weeks.map((w) => w.salesTy)).toEqual(
      b[0].weeks.map((w) => w.salesTy),
    );
    // Week 0 holds days 1..7: 10+20+…+70.
    expect(a[0].weeks[0].salesTy).toBe(280);
  });
});

describe("BUG 2: last year pairs by date, not by index", () => {
  it("keeps later weeks aligned when an LY day goes missing", () => {
    const ty = plan.pairs.map((p) => row(p.tyDate, { sales: 110 }));
    const full = lyRows(110);
    const holed = full.filter((_, i) => i !== 3);

    const a = buildSubDeptTotals(ty, full, plan);
    const b = buildSubDeptTotals(ty, holed, plan);

    for (let w = 1; w < 4; w++) {
      expect(b[0].weeks[w].salesLy).toBe(a[0].weeks[w].salesLy);
    }
  });
});

describe("legacy tax bug is not carried over", () => {
  it("nets tax off both sides, so like sells against like", () => {
    // 110 gross, 10 tax => 100 net, on both years. A flat department.
    const ty = plan.pairs.map((p) => row(p.tyDate, { sales: 110, tax: 10 }));
    const totals = buildSubDeptTotals(ty, lyRows(110, 10), plan);

    expect(totals[0].salesTy).toBe(2800);
    expect(totals[0].salesLy).toBe(2800);
    expect(totals[0].dollarChange).toBe(0);
    expect(totals[0].pctChange).toBeCloseTo(0, 6);
    // Legacy read TY gross against LY net and would have reported +10% here.
  });
});

describe("day matching and gaps", () => {
  it("leaves uncomparable days out of both sides rather than scoring them zero", () => {
    const ty = plan.pairs.map((p) => row(p.tyDate, { sales: 110, tax: 10 }));
    // Last year only exists for the final two weeks.
    const lateOnly = lyRows(110, 10).filter((r) => {
      const pairs = plan.byLyDate.get(r.sale_date) ?? [];
      return pairs.some((p) => p.weekIndex >= 2);
    });

    const t = buildSubDeptTotals(ty, lateOnly, plan)[0];

    // All four weeks of this year still count toward the headline figure.
    expect(t.salesTy).toBe(2800);
    // The comparison uses only the fortnight that has a partner, so a flat
    // department reads flat rather than down fifty percent.
    expect(t.pctChange).toBeCloseTo(0, 6);
    expect(t.weeks[0].salesLy).toBeNull();
    expect(t.weeks[0].pctChange).toBeNull();
  });

  it("marks days with no rows and keeps every week at seven days", () => {
    const some = [row(plan.weeks[0].dates[0], { sales: 110 })];
    const t = buildSubDeptTotals(some, [], plan)[0];

    expect(t.weeks[0].days).toHaveLength(7);
    expect(t.weeks[0].days[0].noSales).toBe(false);
    expect(t.weeks[0].days[1].noSales).toBe(true);
    expect(t.weeks[0].days[1].salesTy).toBe(0);
  });
});

describe("ATS", () => {
  it("divides sales by the transactions that included the department", () => {
    const ty = plan.pairs.map((p) =>
      row(p.tyDate, { sales: 110, tax: 10, transaction_count: 4 }),
    );
    const t = buildSubDeptTotals(ty, [], plan)[0];

    // 28 days x 100 net over 28 x 4 transactions.
    expect(t.trans).toBe(112);
    expect(t.ats).toBeCloseTo(25, 6);
  });

  it("has no ATS at all rather than a zero, with no transactions", () => {
    const ty = [
      row(plan.weeks[0].dates[0], { sales: 110, transaction_count: 0 }),
    ];
    const t = buildSubDeptTotals(ty, [], plan)[0];
    // null, not 0: a day that took no transactions has no average transaction,
    // and $0.00 is indistinguishable from a real average that came to nothing.
    expect(t.ats).toBeNull();
  });
});

describe("window totals", () => {
  it("adds departments up and compares only what has a partner", () => {
    const ty = [
      ...plan.pairs.map((p) => row(p.tyDate, { sales: 110, tax: 10 })),
      ...plan.pairs.map((p) =>
        row(p.tyDate, {
          sales: 55,
          tax: 5,
          sub_department: 20,
          sub_department_description: "Bakery",
        }),
      ),
    ];
    const rows = buildSubDeptTotals(ty, [], plan);
    expect(rows).toHaveLength(2);
    // Sub-department number order, not alphabetical: Deli is 10, Bakery is 20.
    // This is the order the back office numbers them in and every other report
    // prints them in.
    expect(rows.map((r) => r.desc)).toEqual(["Deli", "Bakery"]);
    expect(rows.map((r) => r.id)).toEqual([10, 20]);

    const w = allDeptsTotal(rows, plan);
    expect(w?.salesTy).toBe(2800 + 1400);
    expect(w?.salesLy).toBeNull();
    expect(w?.pctChange).toBeNull();
  });

  it("reports the same gap the departments add up to", () => {
    // Deli has last year; Bakery is new and has none. The roll-up must not
    // report a gap that contradicts the TY and LY figures beside it, which is
    // what the old department-level filter did.
    const ty = [
      ...plan.pairs.map((p) => row(p.tyDate, { sales: 110, tax: 10 })),
      ...plan.pairs.map((p) =>
        row(p.tyDate, {
          sales: 55,
          tax: 5,
          sub_department: 20,
          sub_department_description: "Bakery",
        }),
      ),
    ];
    const rows = buildSubDeptTotals(ty, lyRows(110, 10), plan);
    const w = allDeptsTotal(rows, plan);

    expect(w).not.toBeNull();
    // TY 2800 + 1400 against LY 2800: the gap is the difference on the days
    // that had a partner, and Bakery's TY counts on that side too.
    expect(w?.salesTy).toBe(4200);
    expect(w?.salesLy).toBe(2800);
    expect(w?.dollarChange).toBe(1400);
  });
});
