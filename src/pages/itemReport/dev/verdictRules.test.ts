import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  deliveryGap,
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
