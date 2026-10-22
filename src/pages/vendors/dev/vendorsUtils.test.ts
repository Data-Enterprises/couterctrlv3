import { describe, expect, it } from "vitest";
import {
  buildVendorRows,
  vendorDelta,
  getVendorTier,
  scopePeriods,
} from "./vendorsUtils";
import type { SubDeptMargin } from "../../../interfaces";
import type { RollupRow } from "../../../api/rollup";

/**
 * H&W Farms at 005 BT Glennville, 9/16–9/22/2026, as support reported it.
 *
 * One item, the same margin both weeks — and the page called it Critical with
 * a 24-point collapse.
 */
const line = (
  date: string,
  sales: number,
  cost: number,
): SubDeptMargin =>
  ({
    storeid: 5,
    sale_date: date,
    vendor_id: "00123",
    vendor_name: "H&W FARMS",
    product_code: "86001153165",
    product_description: "APPLE ROASTED DEER CORN 50 lb",
    sub_department: 13,
    total_sales: sales,
    total_tax: 0,
    // Costed the way calculateCogs does it: net_cost per case, one case.
    net_cost: cost,
    cost: cost,
    case_size: 1,
    qty: 1,
    weight: 0,
  }) as unknown as SubDeptMargin;

/** The week on screen: Tue 9/22 and Sat 9/19. */
const TW = [line("2026-09-22", 25, 19), line("2026-09-19", 12.5, 9.5)];
/** Last week: Friday only, 9/18 aligns onto Fri 9/25... a week back of 9/18. */
const LW = [line("2026-09-11", 12.5, 9.5)];
const DATES = [
  "2026-09-16",
  "2026-09-17",
  "2026-09-18",
  "2026-09-19",
  "2026-09-20",
  "2026-09-21",
  "2026-09-22",
];

describe("a vendor whose two weeks share no selling day", () => {
  const row = buildVendorRows(TW, LW, [], DATES)[0];

  it("reports both weeks' margins, which are the same", () => {
    expect(row.tyMarginPct).toBeCloseTo(24, 2);
    expect(row.lwMarginPct).toBeCloseTo(24, 2);
  });

  it("has no points delta to report, rather than a 24-point collapse", () => {
    // The matched day is Friday, where this week sold nothing. Taking a
    // margin on no sales gave 0%, and 0 - 24 read as a vendor falling apart.
    expect(row.lwPtsDelta).toBeNull();
    expect(vendorDelta(row, "margin")).toBeNull();
  });

  it("grades as ungraded, not critical", () => {
    expect(getVendorTier(row, 15, "margin")).not.toBe("crit");
  });
});

describe("a vendor with no last week at all", () => {
  const row = buildVendorRows(TW, [], [], DATES)[0];

  it("shows no last-week margin rather than zero", () => {
    // Zero is a margin somebody earned. "No sales" is not.
    expect(row.lwMarginPct).toBeNull();
    expect(row.lwPtsDelta).toBeNull();
  });
});

describe("a vendor who sold on the same day both weeks", () => {
  const row = buildVendorRows(
    [line("2026-09-22", 100, 70)],
    [line("2026-09-15", 100, 76)],
    [],
    DATES,
  )[0];

  it("still compares, and the points are real", () => {
    // 30% this week against 24% last week: the comparison this whole guard
    // exists to keep working.
    expect(row.tyMarginPct).toBeCloseTo(30, 2);
    expect(row.lwMarginPct).toBeCloseTo(24, 2);
    expect(row.lwPtsDelta).toBeCloseTo(6, 2);
  });
});

/**
 * The detail panel works the same figures a second time — its own day strip
 * and header, from the row's subtotals rather than from the precomputed
 * fields. It needs the same rule, so this pins the rule rather than the code
 * path: a margin needs sales, on both sides of a comparison.
 */
describe("the numbers the detail panel derives", () => {
  const row = buildVendorRows(TW, LW, [], DATES)[0];

  it("has a day with sales one week and not the other", () => {
    const fri = row.days.find((d) => d.date === "2026-09-18")!;
    expect(fri.twNet).toBe(0);
    expect(fri.lwNet).toBe(12.5);
  });

  it("leaves that day's this-week side with no margin to show", () => {
    // What the strip read as 0.00%, next to a 24-point drop.
    const fri = row.days.find((d) => d.date === "2026-09-18")!;
    expect(fri.twNet > 0).toBe(false);
  });

  it("keeps the week's own margin, which is real", () => {
    expect(row.tyMarginPct).toBeCloseTo(24, 2);
    expect(row.twNetForLW).toBe(0);
  });
});

describe("scopePeriods", () => {
  // 685 serves store numbers 369 and 370. subs/subs is fetched by storeid, so
  // one response carries both and every vendor figure was two stores at once.
  const at = (num: string, sales: number): SubDeptMargin =>
    ({ ...line("2026-10-14", sales, 0), store_number: num }) as SubDeptMargin;

  const raw = {
    tw: [at("369", 100), at("370", 40)],
    lw: [at("369", 90), at("370", 30)],
    ly: [at("369", 80)],
  };

  it("keeps one location across all three periods", () => {
    const s = scopePeriods(raw, "369");
    expect(s.tw.map((r) => r.total_sales)).toEqual([100]);
    expect(s.lw.map((r) => r.total_sales)).toEqual([90]);
    expect(s.ly.map((r) => r.total_sales)).toEqual([80]);
  });

  it("returns the rows untouched for the combined view", () => {
    // Null is a real question -- what did this storeid do altogether -- and
    // the same object comes back so nothing downstream re-renders for it.
    expect(scopePeriods(raw, null)).toBe(raw);
  });

  it("leaves an ordinary store alone, because nothing is selected for one", () => {
    // An ordinary store never gets a selection: reQuery clears it on every
    // search and useVendorSearch only lands on a number when the response
    // carries more than one. So the combined path is the one it takes.
    const single = { tw: [at("361", 10)], lw: [at("361", 9)], ly: [] };
    expect(scopePeriods(single, null).tw).toHaveLength(1);
  });

  it("is strict once a location is named", () => {
    // Deliberately not scopeToStoreNumber, which leaves an array alone when it
    // holds fewer than two numbers. That guard answers "does this response
    // need splitting"; here the question is "which location is the reader on",
    // and the answer has to be that location or nothing.
    const only369 = { tw: [at("369", 10)], lw: [], ly: [] };
    expect(scopePeriods(only369, "370").tw).toHaveLength(0);
  });

  it("gives back nothing for a period the location did not trade", () => {
    // 370 has no last year here. An empty array is right -- buildVendorRows
    // reads that as no comparison, not as a collapse to zero.
    expect(scopePeriods(raw, "370").ly).toHaveLength(0);
  });
});

describe("the list is the same built from rollup rows", () => {
  /** What `subs/rollup` returns for the same rows: summed per vendor per
   *  location per day, costed per item row the way calculateCogs does. */
  const rolled = (rows: SubDeptMargin[]): RollupRow[] => {
    const by = new Map<string, RollupRow>();
    for (const r of rows) {
      const k = `${String(r.vendor_id).trim()}|${r.sale_date}`;
      const found = by.get(k);
      const cogs = (r.net_cost / r.case_size) * r.qty;
      if (found) {
        found.net_sales += r.total_sales - r.total_tax;
        found.cogs += cogs;
        found.qty += r.qty;
      } else {
        by.set(k, {
          key: String(r.vendor_id).trim(),
          name: r.vendor_name,
          storeid: r.storeid,
          store_number: "5",
          sale_date: r.sale_date,
          net_sales: r.total_sales - r.total_tax,
          cogs,
          qty: r.qty,
          weight: 0,
          item_count: 1,
        });
      }
    }
    return [...by.values()];
  };

  it("grades the same vendor identically", () => {
    const tw = [...TW, line("2026-09-22", 10, 6)];
    const fromItems = buildVendorRows(tw, LW, [], DATES);
    const fromRollup = buildVendorRows(rolled(tw), rolled(LW), [], DATES);
    expect(fromRollup).toEqual(fromItems);
  });

  it("files a rollup row with no vendor under No vendor", () => {
    const coupon = { ...line("2026-09-22", -2, 0), vendor_id: "0" } as SubDeptMargin;
    const fromItems = buildVendorRows([coupon], [], [], DATES);
    const fromRollup = buildVendorRows(
      [{ ...rolled([coupon])[0], key: "", name: "" }],
      [],
      [],
      DATES,
    );
    expect(fromRollup[0].vendorName).toBe("No vendor");
    expect(fromRollup[0].vendorId).toBe(fromItems[0].vendorId);
  });
});
