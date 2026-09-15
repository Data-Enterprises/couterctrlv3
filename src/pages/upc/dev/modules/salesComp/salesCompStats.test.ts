import { describe, expect, it } from "vitest";
import type { UpcSalesComp } from "../../../../../interfaces";
import { combineSalesCompRows, computeUpcSalesCompStats } from "./salesCompStats";
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

describe("computeUpcSalesCompStats on combined rows", () => {
  const [s] = computeUpcSalesCompStats(
    ["70417"],
    combineSalesCompRows(RESPONSE),
    [],
    "9/14/2026",
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
    const kpis = getSalesCompKpis(combineSalesCompRows(RESPONSE), [], ["70417"], "9/14/2026");
    expect(kpis.find((k) => k.label === "Avg daily / UPC")?.value).toBe("$463.42");
  });
});
