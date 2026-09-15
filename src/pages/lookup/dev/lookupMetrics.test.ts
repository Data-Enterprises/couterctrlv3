import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { ItemLookupHistory } from "../../../features/itemLookupSlice";
import { isSaleRow } from "../../../utils/saleType";
import {
  buildSaleTypeBreakdown,
  buildDayBuckets,
  computeActiveGap,
  computeMargin,
  dayMarginPct,
  dayUnitCost,
  findGaps,
  itemDescription,
  rowsOfSaleType,
} from "./lookupMetrics";

// UPC 70417 (Picadeli Salad Bar) at store 545, as returned on 9/15/2026: a
// scale item that rings qty 0, with no cost on file and a blank description
// on its first two days.
const day = (
  date: string,
  total_sales: number,
  weight: number,
  product_description = "Picadeli Salad Bar",
): ItemLookupHistory =>
  ({
    storeid: 100080,
    store_name: "Food Giant 545",
    store_number: "545",
    sale_date: `${date}T00:00:00`,
    product_code: "70417",
    product_description,
    price: 8,
    total_sales,
    qty: 0,
    weight,
    category_description: null,
    casecost: 0,
    cost: 0,
    net_cost: 0,
    extended_cost: 0,
  }) as unknown as ItemLookupHistory;

const HISTORY = [
  day("2026-09-02", 151.81, 15330, ""),
  day("2026-09-03", 511.36, 65250, ""),
  day("2026-09-04", 671.16, 87250),
  day("2026-09-05", 519.35, 71530),
  day("2026-09-06", 407.49, 51790),
  day("2026-09-07", 503.37, 67550),
  day("2026-09-08", 679.15, 89140),
  day("2026-09-09", 391.51, 48030),
  day("2026-09-10", 479.4, 66540),
  day("2026-09-11", 319.6, 39630),
];

describe("scale item with qty 0", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    // Local midday, so the window's "yesterday" is 9/14 in any US timezone.
    vi.setSystemTime(new Date(2026, 8, 15, 12));
  });
  afterAll(() => vi.useRealTimers());

  it("counts a day with weight and sales as sold", () => {
    const buckets = buildDayBuckets(HISTORY);
    expect(buckets.filter((b) => b.hasSale)).toHaveLength(10);
  });

  it("only flags the real dry spell at the end of the window", () => {
    // 9/12–9/14 had nothing; the old qty test called all 14 days empty.
    expect(computeActiveGap(buildDayBuckets(HISTORY))).toBe(3);
  });

  it("finds the closed gap before the first sale", () => {
    // 9/1 alone is one day, under the two-day threshold.
    expect(findGaps(buildDayBuckets(HISTORY))).toEqual([]);
  });

  it("leaves margin and unit cost empty when there is no cost on file", () => {
    const [sep2] = buildDayBuckets(HISTORY).filter((b) => b.hasSale);
    expect(sep2.hasCost).toBe(false);
    expect(dayMarginPct(sep2)).toBeNull();
    expect(dayUnitCost(sep2)).toBeNull();
  });
});

describe("computeMargin", () => {
  it("reports missing cost instead of a 100% margin", () => {
    const m = computeMargin(HISTORY, 4634.2, 0);
    expect(m.costMissing).toBe(true);
    expect(m.marginPct).toBeNull();
  });

  it("recognises a qty-0 item as weighed", () => {
    expect(computeMargin(HISTORY, 4634.2, 0).weighed).toBe(true);
  });

  it("still computes margin when cost is on file", () => {
    const costed = HISTORY.map((h) => ({ ...h, casecost: 4, weight: 10 }));
    const m = computeMargin(costed, 1000, 0);
    expect(m.costMissing).toBe(false);
    expect(m.marginPct).toBeCloseTo(60); // $400 COGS on $1,000
  });
});

describe("sale types", () => {
  // UPC 4011 (BANANA 1 LB) at IGA 1 from the dev endpoint, 9/1–9/14/2026 —
  // the Sale rows plus every non-Sale line in the window.
  const line = (date: string, sale_type: string, total_sales: number, qty: number, weight: number) =>
    ({ ...day(date, total_sales, weight, "BANANA 1 LB"), sale_type, qty }) as ItemLookupHistory;
  const SALES: [string, number, number, number][] = [
    ["2026-09-01", 71.13, 40, 90.08], ["2026-09-02", 67.42, 40, 85.36],
    ["2026-09-03", 61.12, 40, 77.39], ["2026-09-04", 101.85, 67, 128.93],
    ["2026-09-05", 105.7, 66, 133.78], ["2026-09-06", 66.21, 43, 83.81],
    ["2026-09-07", 57.57, 42, 72.87], ["2026-09-08", 53.93, 37, 68.31],
    ["2026-09-09", 57.61, 38, 72.95], ["2026-09-10", 50.86, 35, 64.39],
    ["2026-09-11", 77.93, 49, 98.63], ["2026-09-12", 81.6, 49, 103.31],
    ["2026-09-13", 90.04, 54, 113.98], ["2026-09-14", 102.06, 56, 129.17],
  ];
  const ALL = [
    ...SALES.map(([d, s, q, w]) => line(d, "Sale", s, q, w)),
    line("2026-09-03", "Cancelled", 0.85, 1, 1.08),
    line("2026-09-05", "Backup", 5.58, 3, 7.07),
    line("2026-09-06", "Voided", 0.15, 1, 0.19),
    line("2026-09-11", "Backup", 2.06, 1, 2.61),
  ];

  it("treats a row without sale_type as a Sale", () => {
    expect(isSaleRow({})).toBe(true);
    expect(isSaleRow({ sale_type: "Sale" })).toBe(true);
    expect(isSaleRow({ sale_type: "Voided" })).toBe(false);
  });

  it("matches the endpoint's own sale_types summary", () => {
    const b = buildSaleTypeBreakdown(ALL);
    expect(b.map((s) => s.saleType)).toEqual(["Sale", "Backup", "Cancelled", "Voided"]);
    const [sale, backup, cancelled, voided] = b;
    expect(sale.sales).toBeCloseTo(1045.03);
    expect(sale.qty).toBe(656);
    expect(sale.units).toBeCloseTo(1322.96);
    expect(sale.days).toBe(14);
    expect(backup).toMatchObject({ days: 2, qty: 4 });
    expect(backup.sales).toBeCloseTo(7.64);
    expect(backup.units).toBeCloseTo(9.68);
    expect(cancelled).toMatchObject({ days: 1, qty: 1 });
    expect(voided).toMatchObject({ days: 1, qty: 1 });
  });

  it("builds a timeline for one sale type", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 15, 12));
    try {
      const backup = buildDayBuckets(rowsOfSaleType(ALL, "Backup"));
      const days = backup.filter((b) => b.hasSale);
      expect(days.map((b) => b.date)).toEqual(["2026-09-05", "2026-09-11"]);
      expect(days[0]).toMatchObject({ qty: 3 });
      expect(days[0].units).toBeCloseTo(7.07);
      // Sale's timeline carries no Backup lines.
      const sale = buildDayBuckets(rowsOfSaleType(ALL, "Sale"));
      expect(sale.find((b) => b.date === "2026-09-05")?.revenue).toBeCloseTo(105.7);
    } finally {
      vi.useRealTimers();
    }
  });

  it("is Sale alone when the response has no sale_type", () => {
    expect(buildSaleTypeBreakdown(HISTORY).map((s) => s.saleType)).toEqual(["Sale"]);
  });
});

describe("itemDescription", () => {
  it("keeps the endpoint's description when it has one", () => {
    expect(itemDescription("Salad", HISTORY)).toBe("Salad");
  });

  it("falls back to the latest named history row", () => {
    expect(itemDescription("", HISTORY)).toBe("Picadeli Salad Bar");
  });

  it("is blank when nothing is named", () => {
    expect(itemDescription("", [HISTORY[0]])).toBe("");
  });
});
