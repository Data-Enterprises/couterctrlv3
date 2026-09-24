import { describe, expect, it } from "vitest";
import { buildVendorRows, vendorDelta, getVendorTier } from "./vendorsUtils";
import type { SubDeptMargin } from "../../../interfaces";

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
