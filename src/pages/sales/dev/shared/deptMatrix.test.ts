import { describe, it, expect } from "vitest";
import { basisFor, bestIn, buildMatrix, flagged } from "./deptMatrix";
import type { SubSale } from "../../../../interfaces";

/** One store, one department, one day. */
const row = (
  storeNumber: string,
  subDept: number,
  total: number,
  date = "2026-10-01",
  over: Partial<SubSale> = {},
): SubSale =>
  ({
    sale_date: date,
    storeid: Number(storeNumber),
    store_name: `Store ${storeNumber}`,
    store_number: storeNumber,
    sub_department: subDept,
    sub_department_description: subDept === 1 ? "Grocery" : "Deli",
    total_sales: total,
    net_sales: total,
    total_tax: 0,
    qty: 1,
    weight: 0,
    elec_instore_coupons: 0,
    elec_store_coupons: 0,
    digital_coupons: 0,
    store_coupon: 0,
    transaction_count: 1,
    ...over,
  }) as SubSale;

const cell = (m: ReturnType<typeof buildMatrix>, store: string, dept: number) =>
  m.rows.find((r) => r.storeNumber === store)?.cells.get(dept);

describe("basisFor", () => {
  it("prefers last year when it covers as many days as this week", () => {
    expect(basisFor(7, { days: 7, total: 10 }, { days: 7, total: 10 })).toBe("LY");
  });

  it("falls back to last week when last year is short", () => {
    expect(basisFor(7, { days: 7, total: 10 }, { days: 3, total: 10 })).toBe("LW");
  });

  it("refuses a period that recorded nothing, however many days it covers", () => {
    expect(basisFor(7, { days: 7, total: 0 }, { days: 7, total: 0 })).toBeNull();
  });

  it("takes neither when both are short", () => {
    expect(basisFor(7, { days: 2, total: 9 }, { days: 3, total: 9 })).toBeNull();
  });
});

describe("buildMatrix", () => {
  const metric = "sales" as const;

  it("puts a store that held its usual share at 100", () => {
    // Two stores, one department, both flat on last year.
    const m = buildMatrix({
      tw: [row("010", 1, 300), row("020", 1, 700)],
      lw: [],
      ly: [row("010", 1, 300), row("020", 1, 700)],
      metric,
    });
    expect(cell(m, "010", 1)?.index).toBe(100);
    expect(cell(m, "020", 1)?.index).toBe(100);
  });

  it("does not punish a small store for being small", () => {
    // 010 is 10% of the department and stays 10% while the group doubles.
    const m = buildMatrix({
      tw: [row("010", 1, 200), row("020", 1, 1800)],
      lw: [],
      ly: [row("010", 1, 100), row("020", 1, 900)],
      metric,
    });
    expect(cell(m, "010", 1)?.index).toBe(100);
  });

  it("marks a store that lost share, even in a growing group", () => {
    const m = buildMatrix({
      tw: [row("010", 1, 100), row("020", 1, 1900)],
      lw: [],
      ly: [row("010", 1, 100), row("020", 1, 900)],
      metric,
    });
    // Usual share 10% of a 2000 week is 200 expected; it did 100.
    expect(cell(m, "010", 1)?.expected).toBe(200);
    expect(cell(m, "010", 1)?.index).toBe(50);
  });

  it("puts every department on the same scale regardless of size", () => {
    // Grocery is twenty times Deli, and both stores are flat in both.
    const m = buildMatrix({
      tw: [row("010", 1, 2000), row("010", 2, 100), row("020", 1, 2000), row("020", 2, 100)],
      lw: [],
      ly: [row("010", 1, 2000), row("010", 2, 100), row("020", 1, 2000), row("020", 2, 100)],
      metric,
    });
    expect(cell(m, "010", 1)?.index).toBe(100);
    expect(cell(m, "010", 2)?.index).toBe(100);
  });

  it("uses sales net of tax", () => {
    const m = buildMatrix({
      tw: [row("010", 1, 110, "2026-10-01", { total_tax: 10 })],
      lw: [],
      ly: [row("010", 1, 100)],
      metric,
    });
    expect(cell(m, "010", 1)?.ty).toBe(100);
  });

  it("counts units when the metric is qty", () => {
    const m = buildMatrix({
      tw: [row("010", 1, 500, "2026-10-01", { qty: 9 })],
      lw: [],
      ly: [row("010", 1, 500, "2025-10-02", { qty: 9 })],
      metric: "qty",
    });
    expect(cell(m, "010", 1)?.ty).toBe(9);
  });

  it("sums the daily rows a week arrives as", () => {
    const m = buildMatrix({
      tw: [row("010", 1, 100, "2026-10-01"), row("010", 1, 50, "2026-10-02")],
      lw: [],
      ly: [row("010", 1, 150, "2025-10-02")],
      metric,
    });
    expect(cell(m, "010", 1)?.ty).toBe(150);
  });

  it("leaves a cell blank rather than zero when nothing can measure it", () => {
    const m = buildMatrix({
      tw: [row("010", 1, 500)],
      lw: [],
      ly: [],
      metric,
    });
    expect(cell(m, "010", 1)?.index).toBeNull();
    expect(cell(m, "010", 1)?.basis).toBeNull();
    expect(m.blanks).toBe(1);
  });

  it("keeps an unmeasurable store out of everyone else's expected", () => {
    // 030 opened this week: it has a TY but no history at all. Including its
    // TY in the group total would lift what every other store is expected to
    // have done, and mark them all down for it.
    const withNewStore = buildMatrix({
      tw: [row("010", 1, 300), row("020", 1, 700), row("030", 1, 1000)],
      lw: [],
      ly: [row("010", 1, 300), row("020", 1, 700)],
      metric,
    });
    expect(cell(withNewStore, "010", 1)?.index).toBe(100);
    expect(cell(withNewStore, "030", 1)?.index).toBeNull();
  });

  it("falls back to last week per cell, not per store", () => {
    // Grocery has a full last year; Deli does not and takes last week.
    const m = buildMatrix({
      tw: [row("010", 1, 100), row("010", 2, 100)],
      lw: [row("010", 1, 999), row("010", 2, 100)],
      ly: [row("010", 1, 100)],
      metric,
    });
    expect(cell(m, "010", 1)?.basis).toBe("LY");
    expect(cell(m, "010", 2)?.basis).toBe("LW");
  });

  it("sums a store's row rather than averaging its indices", () => {
    // Both stores hold half of each department last year. 010 then does
    // Grocery at 50 and Deli at 200 — but Grocery is twenty times the size,
    // so the store is nowhere near the 125 a mean of the two would report.
    const m = buildMatrix({
      tw: [
        row("010", 1, 1000), row("010", 2, 200),
        row("020", 1, 3000), row("020", 2, 0),
      ],
      lw: [],
      ly: [
        row("010", 1, 2000), row("010", 2, 100),
        row("020", 1, 2000), row("020", 2, 100),
      ],
      metric,
    });
    expect(cell(m, "010", 1)?.index).toBe(50);
    expect(cell(m, "010", 2)?.index).toBe(200);
    // 1200 done against 2100 expected — not the 125 a mean would give.
    expect(m.rows[0].index).toBe(57);
  });

  it("puts a lone store at 100, because it IS the group", () => {
    // Worth stating: with one store its usual share is all of it, so
    // expected equals what it did and the index can only ever be 100. The
    // matrix is a comparison, and one store is not one.
    const m = buildMatrix({
      tw: [row("010", 1, 1000)],
      lw: [],
      ly: [row("010", 1, 2000)],
      metric,
    });
    expect(cell(m, "010", 1)?.index).toBe(100);
  });

  it("names the columns from this week and orders them", () => {
    const m = buildMatrix({
      tw: [row("010", 2, 100), row("010", 1, 100)],
      lw: [],
      ly: [],
      metric,
    });
    expect(m.columns.map((c) => c.name)).toEqual(["Grocery", "Deli"]);
  });

  it("orders stores by number, not by arrival", () => {
    const m = buildMatrix({
      tw: [row("020", 1, 100), row("010", 1, 100)],
      lw: [],
      ly: [],
      metric,
    });
    expect(m.rows.map((r) => r.storeNumber)).toEqual(["010", "020"]);
  });

  it("gives no column for a department nobody sold this week", () => {
    const m = buildMatrix({
      tw: [row("010", 1, 100)],
      lw: [],
      ly: [row("010", 1, 100), row("010", 2, 500)],
      metric,
    });
    expect(m.columns.map((c) => c.subDept)).toEqual([1]);
  });
});

describe("flagged", () => {
  it("is quiet inside the band and loud outside it", () => {
    expect(flagged(109, 9)).toBe(false);
    expect(flagged(110, 9)).toBe(true);
    expect(flagged(91, 9)).toBe(false);
    expect(flagged(90, 9)).toBe(true);
  });

  it("never flags a cell with no index", () => {
    expect(flagged(null, 0)).toBe(false);
  });
});

describe("bestIn", () => {
  const m = buildMatrix({
    tw: [row("010", 1, 50), row("020", 1, 300), row("030", 1, 150)],
    lw: [],
    ly: [row("010", 1, 100), row("020", 1, 100), row("030", 1, 100)],
    metric: "sales",
  });

  it("offers whoever is doing that department best", () => {
    expect(bestIn(m, 1, { storeid: 10, storeNumber: "010" })?.storeNumber).toBe("020");
  });

  it("never offers the store you are already looking at", () => {
    expect(bestIn(m, 1, { storeid: 20, storeNumber: "020" })?.storeNumber).toBe("030");
  });

  it("offers nobody rather than a store that cannot be measured", () => {
    const alone = buildMatrix({
      tw: [row("010", 1, 50), row("020", 1, 300)],
      lw: [],
      ly: [row("010", 1, 100)],
      metric: "sales",
    });
    expect(bestIn(alone, 1, { storeid: 10, storeNumber: "010" })).toBeNull();
  });

  it("offers nobody in a group of one", () => {
    const solo = buildMatrix({
      tw: [row("010", 1, 50)],
      lw: [],
      ly: [row("010", 1, 100)],
      metric: "sales",
    });
    expect(bestIn(solo, 1, { storeid: 10, storeNumber: "010" })).toBeNull();
  });
});
