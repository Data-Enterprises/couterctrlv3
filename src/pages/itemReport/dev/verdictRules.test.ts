import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  deliveryGap,
  mergePricePoints,
  flatDaysBefore,
  verdictFor,
  type ReportItem,
} from "./itemReportMetrics";
import type { ReceiptLine } from "./itemReportData";

/**
 * Two of Item Actions' rules, against the dev board review's own cases.
 * Store 695, week ending 10/20/2026.
 */
const WINDOW_END = "2026-10-20";

// "Days since the last delivery" reads the real clock, so the day the review
// ran is pinned; otherwise these cases would change verdict as the weeks pass.
beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-21T12:00:00"));
});
afterAll(() => vi.useRealTimers());

const receipt = (date: string, sellingUnits: number): ReceiptLine =>
  ({
    invoiceId: 1,
    productCode: "1",
    description: "ITEM",
    date,
    vendorName: "VENDOR",
    sellingUnits,
    cases: 0,
    billedIn: "units",
    caseSize: null,
    unitCost: 1,
    retail: 2,
    free: 0,
    returned: 0,
  }) as ReceiptLine;

const item = (over: Partial<ReportItem>): ReportItem =>
  ({
    productCode: "1",
    description: "ITEM",
    department: "DEPT",
    vendorName: "VENDOR",
    ty: { units: 0, sales: 0 },
    lw: null,
    ly: null,
    lwPct: null,
    lyPct: null,
    unitCost: 1,
    marginPct: null,
    daysSold: 0,
    series: [],
    points: [],
    rows: [],
    movement: null,
    sinceDelivery: null,
    ...over,
  }) as unknown as ReportItem;

const verdict = (i: ReportItem, receipts: ReceiptLine[]) =>
  verdictFor(i, receipts, [], 7, WINDOW_END, 90, true);

describe("a delivery at the end of the window", () => {
  it("is too soon to judge, not Investigate (finding L)", () => {
    // Thomas English Muffins: 3 delivered on 10/20, nothing sold all week,
    // sold last week. It read "3 units delivered, none scanned since".
    const v = verdict(
      item({
        lw: { units: 4, sales: 12 } as ReportItem["lw"],
        sinceDelivery: { date: "2026-10-20", received: 3, sold: 0, left: 3 },
      }),
      [receipt("2026-10-20", 3)],
    );
    expect(v.action).toBe("insufficient");
    expect(v.evidence).toMatch(/hasn't had time to sell/);
    expect(v.evidence).toMatch(/against 4 last week/);
    expect(v.evidence).not.toMatch(/none scanned since/);
  });

  it("still investigates a delivery that has had time", () => {
    // Delivered 10/14, a week of nothing since.
    const v = verdict(
      item({
        lw: { units: 4, sales: 12 } as ReportItem["lw"],
        sinceDelivery: { date: "2026-10-14", received: 3, sold: 0, left: 3 },
      }),
      [receipt("2026-10-14", 3)],
    );
    expect(v.action).toBe("investigate");
  });
});

describe("nothing left of the last delivery", () => {
  const sold = { units: 2, sales: 6 } as ReportItem["ty"];

  it("doesn't call a reorder when earlier stock is still there (finding N)", () => {
    // White Wheat Round Top: 2 delivered, 2 sold since, but NET +7 across
    // the span's two deliveries.
    const v = verdict(
      item({
        ty: sold,
        sinceDelivery: { date: "2026-10-19", received: 2, sold: 2, left: 0 },
        movement: {
          days: 14,
          start: "2026-10-07",
          received: 14,
          sold: 7,
          net: 7,
          deliveries: 2,
        },
      }),
      [receipt("2026-10-19", 2), receipt("2026-10-10", 12)],
    );
    expect(v.action).not.toBe("reorder");
  });

  it("still calls it when the span net is empty too", () => {
    const v = verdict(
      item({
        ty: sold,
        sinceDelivery: { date: "2026-10-19", received: 2, sold: 2, left: 0 },
        movement: {
          days: 14,
          start: "2026-10-07",
          received: 4,
          sold: 4,
          net: 0,
          deliveries: 2,
        },
      }),
      [receipt("2026-10-19", 2), receipt("2026-10-10", 2)],
    );
    expect(v.action).toBe("reorder");
  });
});

describe("deliveryGap", () => {
  const at = (d: string) => ({ date: d });

  it("is null with nothing to measure between", () => {
    // One delivery is an event, not a rhythm. Null rather than a default,
    // because the verdict falls back to a week and should know it is doing so.
    expect(deliveryGap([])).toBeNull();
    expect(deliveryGap([at("2026-10-20")])).toBeNull();
  });

  it("averages the gaps, newest first", () => {
    // 20th, 16th, 12th -> two gaps of 4.
    expect(
      deliveryGap([at("2026-10-20"), at("2026-10-16"), at("2026-10-12")]),
    ).toBe(4);
  });

  it("never reports less than a day", () => {
    // Two deliveries on one date would otherwise round to 0 and make every
    // item instantly overdue.
    expect(deliveryGap([at("2026-10-20"), at("2026-10-20")])).toBe(1);
  });

  it("reads the date out of a timestamp", () => {
    expect(
      deliveryGap([at("2026-10-20T14:03:00"), at("2026-10-13T02:00:00")]),
    ).toBe(7);
  });
});

describe("flatDaysBefore", () => {
  const day = (date: string, units: number) => ({ date, units });

  it("counts the silence running up to the date", () => {
    const series = [
      day("2026-10-14", 3),
      day("2026-10-15", 0),
      day("2026-10-16", 0),
      day("2026-10-17", 0),
      day("2026-10-18", 5),
    ];
    expect(flatDaysBefore(series, "2026-10-18")).toBe(3);
  });

  it("is 0 when it sold the day before", () => {
    expect(
      flatDaysBefore([day("2026-10-16", 1), day("2026-10-17", 2)], "2026-10-18"),
    ).toBe(0);
  });

  it("ignores everything on or after the date", () => {
    // The delivery day itself is not part of the silence before it.
    const series = [
      day("2026-10-16", 0),
      day("2026-10-17", 0),
      day("2026-10-18", 0),
    ];
    expect(flatDaysBefore(series, "2026-10-17")).toBe(1);
  });

  it("is 0 with nothing before the date at all", () => {
    expect(flatDaysBefore([day("2026-10-20", 4)], "2026-10-18")).toBe(0);
  });
});

/**
 * Fam Pak Breast Tenders, store 695, week to 10/20/2026. Item Actions listed
 * $6.14, $6.94 and $6.86 against a shelf price of $3.99 a pound, because it
 * built this table by walking receipts and a receipt line carries what the
 * PACKAGE came to. `cashiers/price_points` answers per pound.
 */
describe("mergePricePoints", () => {
  const at = (
    unit_price: number,
    units: number,
    receipts: number,
    over: Partial<Parameters<typeof mergePricePoints>[0][number]> = {},
  ) =>
    ({
      price_type: "REG",
      multi: false,
      unit_price,
      receipts,
      units,
      weight: 0,
      sales: unit_price * units,
      days_seen: 1,
      last_seen: "2026-10-20",
      weighed: false,
      ...over,
    }) as Parameters<typeof mergePricePoints>[0][number];

  it("reports pounds against a per-pound price", () => {
    // 42.5 lb at $3.99, not 20 packages at whatever each came to.
    const out = mergePricePoints([
      at(3.99, 20, 18, { weighed: true, weight: 42.5 }),
    ]);
    expect(out[0].price).toBe(3.99);
    expect(out[0].qty).toBeCloseTo(42.5, 2);
    expect(out[0].weighed).toBe(true);
  });

  it("counts rings on an item that is not weighed", () => {
    const out = mergePricePoints([at(6.49, 20, 18)]);
    expect(out[0].qty).toBe(20);
    expect(out[0].weighed).toBe(false);
  });

  it("merges the price types that share a price", () => {
    // The server splits REG from SALE and single from multi. This section has
    // no column for why a price happened, so two rows reading $10.99 would be
    // two rows with no way to tell them apart.
    const out = mergePricePoints([
      at(10.99, 4, 4),
      at(10.99, 6, 5, { price_type: "SALE" }),
      at(10.99, 2, 2, { multi: true }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].qty).toBe(12);
    expect(out[0].receipts).toBe(11);
  });

  it("keeps different prices apart", () => {
    const out = mergePricePoints([at(6.49, 3, 3), at(3.49, 9, 7)]);
    expect(out.map((r) => r.price)).toEqual([3.49, 6.49]);
  });

  it("ranks by what sold, not by price", () => {
    // The biggest seller leads, which is what the five-row cut shows.
    const out = mergePricePoints([at(9.99, 2, 2), at(4.99, 40, 30), at(6.99, 11, 9)]);
    expect(out.map((r) => r.price)).toEqual([4.99, 6.99, 9.99]);
  });

  it("is empty for an item with no prices", () => {
    expect(mergePricePoints([])).toEqual([]);
  });
});
