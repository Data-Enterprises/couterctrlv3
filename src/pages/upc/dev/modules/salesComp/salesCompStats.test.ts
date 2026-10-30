import { describe, expect, it } from "vitest";
import type { UpcSalesComp } from "../../../../../interfaces";
import {
  combineSalesCompRows,
  computeUpcSalesCompStats,
  weekdayCounts,
  type SalesCompRange,
} from "./salesCompStats";
import { getSalesCompKpis } from "./SalesCompKpis";

const week = (
  wk: string,
  description: string,
  days: Partial<Record<"Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday", number>>,
): UpcSalesComp => ({
  product_code: "70417",
  description,
  week: `${wk}T00:00:00`,
  Monday: 0,
  Tuesday: 0,
  Wednesday: 0,
  Thursday: 0,
  Friday: 0,
  Saturday: 0,
  Sunday: 0,
  ...days,
});

// The response for UPC 70417, store 545, 8/1–9/14/2026: the week of Aug 31
// came back split across a blank description and the real one.
const RESPONSE = [
  week("2026-08-31", "", { Wednesday: 151.81, Thursday: 511.36 }),
  week("2026-08-31", "Picadeli Salad Bar", { Friday: 671.16, Saturday: 519.35, Sunday: 407.49 }),
  week("2026-09-07", "Picadeli Salad Bar", {
    Monday: 503.37,
    Tuesday: 679.15,
    Wednesday: 391.51,
    Thursday: 479.40000000000003,
    Friday: 319.6,
  }),
];

describe("combineSalesCompRows", () => {
  it("folds a week split across descriptions into one row", () => {
    const rows = combineSalesCompRows(RESPONSE);
    expect(rows).toHaveLength(2);
    const [aug31] = rows;
    expect(aug31.description).toBe("Picadeli Salad Bar");
    expect(aug31.Wednesday).toBeCloseTo(151.81);
    expect(aug31.Friday).toBeCloseTo(671.16);
    expect(aug31.Sunday).toBeCloseTo(407.49);
  });

  it("keeps null when neither row had a figure", () => {
    const a = { ...week("2026-08-31", "", {}), Monday: null };
    const b = { ...week("2026-08-31", "X", {}), Monday: null };
    expect(combineSalesCompRows([a, b])[0].Monday).toBeNull();
  });

  it("leaves different UPCs and weeks apart", () => {
    const other = { ...RESPONSE[2], product_code: "99999" };
    expect(combineSalesCompRows([...RESPONSE, other])).toHaveLength(3);
  });
});

// The two whole weeks the rows cover, Monday 8/31 to Sunday 9/13.
const TWO_WEEKS: SalesCompRange = {
  start: "8/31/2026",
  end: "9/13/2026",
  lyStart: "2025-09-01",
  lyEnd: "2025-09-14",
};

describe("computeUpcSalesCompStats on combined rows", () => {
  const [s] = computeUpcSalesCompStats(
    ["70417"],
    combineSalesCompRows(RESPONSE),
    [],
    TWO_WEEKS,
  );

  it("week-by-week rows add up to the total", () => {
    const shown = s.weekRows.reduce(
      (acc, { row }) =>
        acc +
        (row.Monday ?? 0) + (row.Tuesday ?? 0) + (row.Wednesday ?? 0) +
        (row.Thursday ?? 0) + (row.Friday ?? 0) + (row.Saturday ?? 0) + (row.Sunday ?? 0),
      0,
    );
    expect(s.periodTotal).toBeCloseTo(4634.2);
    expect(shown).toBeCloseTo(s.periodTotal);
  });

  it("averages each weekday over weeks, not rows", () => {
    // Monday sold only in the second week: 503.37 over 2 weeks, not 3 rows.
    expect(s.dayAvgs[0]).toBeCloseTo(251.685);
    expect(s.dayAvgs[4]).toBeCloseTo((671.16 + 319.6) / 2);
  });

  it("daily avg is the total over days that actually sold", () => {
    // 10 selling days once the hidden Fri/Sat/Sun are counted.
    expect(s.avgDaily).toBeCloseTo(463.42);
  });

  it("names the item even when its first row has a blank description", () => {
    expect(s.desc).toBe("Picadeli Salad Bar");
  });

  it("KPI strip's avg daily matches the detail panel for one UPC", () => {
    const kpis = getSalesCompKpis(combineSalesCompRows(RESPONSE), [], ["70417"], TWO_WEEKS);
    expect(kpis.find((k) => k.label === "Avg daily / UPC")?.value).toBe("$463.42");
  });
});

describe("week over week", () => {
  // $100 every day.
  const flat = (wk: string) =>
    week(wk, "Flat", {
      Monday: 100, Tuesday: 100, Wednesday: 100, Thursday: 100,
      Friday: 100, Saturday: 100, Sunday: 100,
    });

  it("leaves a part week at the start out", () => {
    // Wed 10/7 to Sun 10/18. The week of 10/5 holds only Wed-Sun ($500) and
    // used to count as complete, so the next week's $700 read as +16.7%.
    const rows = [
      { ...flat("2026-10-05"), Monday: null, Tuesday: null },
      flat("2026-10-12"),
    ];
    const [s] = computeUpcSalesCompStats(["70417"], rows, [], {
      start: "10/7/2026",
      end: "10/18/2026",
      lyStart: "2025-10-08",
      lyEnd: "2025-10-19",
    });
    // One complete week is not enough to compare.
    expect(s.wowPct).toBeNull();
  });
});

describe("a week with no sales", () => {
  const sold = (wk: string) => week(wk, "Item", { Monday: 700 });
  // Four whole weeks, 9/14 to 10/11. It sold in the first three only.
  const range: SalesCompRange = {
    start: "9/14/2026",
    end: "10/11/2026",
    lyStart: "2025-09-15",
    lyEnd: "2025-10-12",
  };
  const [s] = computeUpcSalesCompStats(
    ["70417"],
    [sold("2026-09-14"), sold("2026-09-21"), sold("2026-09-28")],
    [],
    range,
  );

  it("is in the week table as a 0", () => {
    expect(s.weekRows.map((w) => w.week.slice(0, 10))).toEqual([
      "2026-09-14",
      "2026-09-21",
      "2026-09-28",
      "2026-10-05",
    ]);
    expect(s.weekTotals).toEqual([700, 700, 700, 0]);
  });

  it("counts against week over week", () => {
    // Last week 0 against an average of 525: down 100%, where skipping the
    // week compared 700 with 700 and read flat.
    expect(s.wowPct).toBeCloseTo(-100);
  });
});

describe("the peak day", () => {
  // Monday 10/5 to Wednesday 10/14: two Mondays, one Saturday.
  const range: SalesCompRange = {
    start: "10/5/2026",
    end: "10/14/2026",
    lyStart: "2025-10-06",
    lyEnd: "2025-10-15",
  };
  const rows = [
    week("2026-10-05", "Item", { Monday: 60, Saturday: 100 }),
    week("2026-10-12", "Item", { Monday: 60 }),
  ];

  it("counts each weekday as often as the range holds it", () => {
    expect(weekdayCounts(range.start, range.end)).toEqual([2, 2, 2, 1, 1, 1, 1]);
  });

  it("averages per occurrence, so the $100 Saturday is the peak", () => {
    // Per week, Saturday averaged $50 against Monday's $60.
    const [s] = computeUpcSalesCompStats(["70417"], rows, [], range);
    expect(s.dayAvgs[5]).toBe(100);
    expect(s.dayAvgs[0]).toBe(60);
    expect(s.peakIdx).toBe(5);
  });

  it("and the KPI strip agrees", () => {
    const kpis = getSalesCompKpis(rows, [], ["70417"], range);
    expect(kpis.find((k) => k.label === "Peak day")?.value).toBe("Sat");
  });
});
