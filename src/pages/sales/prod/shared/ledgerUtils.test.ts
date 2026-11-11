import { describe, expect, it, vi } from "vitest";
import { buildLedgerRows } from "./ledgerUtils";

// Pinned to a US zone with daylight saving, so the week after the clocks go
// back (Sun 1 Nov 2026) is a real test wherever this runs.
vi.stubEnv("TZ", "America/Chicago");

const TW = ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08"];
const LW = ["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01"];

const sale = (date: string, net: number) => ({
  net_sales: net,
  qty: net / 4,
  sale_date: `${date}T00:00:00`,
  store_name: "IGA OWENSBORO KY",
  store_number: "020",
  storeid: 20,
  total_sales: net,
  total_tax: 0,
  weight: 0,
});
// This week 1,100 a day, last week 1,000 a day, so vs LW is +10%.
const tw = TW.map((d) => sale(d, 1100));
const lw = LW.map((d) => sale(d, 1000));

describe("the week after the clocks go back", () => {
  it("matches every day to the same weekday last week", () => {
    const [row] = buildLedgerRows(tw, lw, []);
    expect(row.lwDayCount).toBe(7);
    expect(row.lwTotal).toBe(7000);
    expect(row.vsLWPct).toBeCloseTo(10, 6);
  });
});
