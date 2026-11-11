import { describe, expect, it, vi } from "vitest";
import { buildItemRows, getItemSeverity, type MarginSourceRow } from "./itemMargins";
import { shiftIso } from "./grading";

// Pinned to a US zone with daylight saving, so the week after the clocks go
// back (Sun 1 Nov 2026) is a real test wherever this runs.
vi.stubEnv("TZ", "America/Chicago");

const TW = ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08"];

const line = (date: string, code: string, sales: number): MarginSourceRow => ({
  sale_date: `${date}T00:00:00`,
  product_code: code,
  product_description: `ITEM ${code}`,
  total_sales: sales,
  total_tax: 0,
  qty: 1,
  weight: 0,
  cost: 4.28,
  case_size: 1,
  cost_fees: 0,
  net_cost: 4.28,
});

// A filler item sells every day so the store has full coverage both weeks;
// the item under test sells once, on the Monday of each week, at $6.49.
const ty = [...TW.map((d) => line(d, "FILL", 10)), line("2026-11-02", "1122519168", 6.49)];
const lw = [...TW.map((d) => line(shiftIso(d, -7), "FILL", 10)), line("2026-10-26", "1122519168", 6.49)];

describe("Sub Dept Margins item grading in the week after the clocks go back", () => {
  const rows = buildItemRows(ty, lw, [], {
    lwOf: (d) => shiftIso(d, -7),
    lyOf: (d) => shiftIso(d, -364),
    coverage: { dayCount: 7, lwDayCount: 7, lyDayCount: 0 },
  });
  const item = rows.find((r) => r.productCode === "1122519168")!;

  it("compares Monday with last Monday, so an unchanged item is flat", () => {
    expect(item.lwSalesPct).toBe(0);
    expect(item.lwMarginDelta).toBe(0);
  });

  it("grades it healthy on sales and on margin", () => {
    expect(getItemSeverity(item, 9, "sales")).toBe("healthy");
    expect(getItemSeverity(item, 9, "margin")).toBe("healthy");
  });
});
