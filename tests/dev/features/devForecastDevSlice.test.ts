import { describe, expect, it } from "vitest";
import reducer, {
  resetRowValues,
  setBatchAdDaysRows,
  setBatchPriceRows,
  setForecastResults,
  setItemNotes,
  setNewRowAdDaysValue,
  setNewRowPriceValue,
  setRowData,
} from "@/features/dev/devForecastDevSlice";

// Interfaces
import type { ForecastOutlierRow } from "@/features/dev/devForecastDevSlice";
import type { PriceHistoryResult } from "@/interfaces";

/*
 * Pins the forecast row maths exactly as it is today, so the reducers can be
 * tidied without a single figure moving. The numbers in the snapshots are
 * today's output, not hand-worked answers: if one changes, the maths changed.
 */

const history = (
  upc: string,
  regular: number,
  points: [price: string, qty: number, days: number][],
): PriceHistoryResult => ({
  upc,
  description: `ITEM ${upc}`,
  qty: points.reduce((n, [, q]) => n + q, 0),
  regular_retail_price: regular,
  avg_daily_qty: 0,
  max_day_qty: 0,
  days_active: points.reduce((n, [, , d]) => n + d, 0),
  price_history: points.map(([price, qty, days_active]) => ({
    price,
    qty,
    days_active,
    sale_dates: [],
  })),
});

const RESULTS: PriceHistoryResult[] = [
  history("A", 4.99, [
    ["3.99", 120, 20],
    ["4.49", 60, 25],
    ["4.99", 30, 15],
  ]),
  history("B", 2.49, [
    ["1.99", 210, 12],
    ["2.29", 90, 30],
    ["2.49", 75, 40],
  ]),
  history("C", 6.99, [["6.99", 40, 30]]),
];

const row = (upc: string, over: Partial<ForecastOutlierRow>): ForecastOutlierRow => ({
  upc,
  description: `ITEM ${upc}`,
  qtySold: 0,
  daysActive: 60,
  adFcst: 0,
  fcstPrice: 0,
  calcNow: 0,
  fcstTotal: 0,
  forecastWindow: 7,
  daysAtPrice: 0,
  adDays: 3,
  markdownDollars: 0,
  ...over,
});

const ROWS: ForecastOutlierRow[] = [
  row("A", { fcstPrice: 3.99, qtySold: 120, daysActive: 60, daysAtPrice: 20, adDays: 3 }),
  row("B", { fcstPrice: 2.29, qtySold: 90, daysActive: 82, daysAtPrice: 30, adDays: 2, notes: "end cap" }),
  row("C", { fcstPrice: 6.99, qtySold: 40, daysActive: 30, daysAtPrice: 30, adDays: 3, singlePrice: true }),
];

const loaded = () => {
  let s = reducer(undefined, { type: "@@init" });
  s = reducer(s, setForecastResults(RESULTS));
  s = reducer(s, setRowData(ROWS));
  return s;
};
const rowOf = (s: ReturnType<typeof loaded>, upc: string) => s.rowData.find((r) => r.upc === upc)!;

describe("a row's ad days", () => {
  it("recomputes a multi-price row's forecast at its current price", () => {
    const s = reducer(loaded(), setNewRowAdDaysValue({ upc: "A", newAdDays: 5 }));
    expect(rowOf(s, "A")).toMatchInlineSnapshot(`
      {
        "adDays": 5,
        "adFcst": 30,
        "calcNow": 0,
        "daysActive": 60,
        "daysAtPrice": 20,
        "description": "ITEM A",
        "fcstPrice": 3.99,
        "fcstTotal": 119.7,
        "forecastWindow": 7,
        "markdownDollars": 30,
        "qtySold": 120,
        "upc": "A",
      }
    `);
  });

  it("uses the expected-days blend when the ad is shorter than the selling days", () => {
    const s = reducer(loaded(), setNewRowAdDaysValue({ upc: "B", newAdDays: 1 }));
    expect(rowOf(s, "B")).toMatchInlineSnapshot(`
      {
        "adDays": 1,
        "adFcst": 32,
        "calcNow": 0,
        "daysActive": 82,
        "daysAtPrice": 30,
        "description": "ITEM B",
        "fcstPrice": 2.29,
        "fcstTotal": 73.28,
        "forecastWindow": 7,
        "markdownDollars": 6.400000000000006,
        "notes": "end cap",
        "qtySold": 90,
        "upc": "B",
      }
    `);
  });

  it("uses a single-price row's one data point", () => {
    const s = reducer(loaded(), setNewRowAdDaysValue({ upc: "C", newAdDays: 4 }));
    expect(rowOf(s, "C")).toMatchInlineSnapshot(`
      {
        "adDays": 4,
        "adFcst": 5,
        "calcNow": 0,
        "daysActive": 30,
        "daysAtPrice": 30,
        "description": "ITEM C",
        "fcstPrice": 6.99,
        "fcstTotal": 34.95,
        "forecastWindow": 7,
        "markdownDollars": 0,
        "qtySold": 40,
        "singlePrice": true,
        "upc": "C",
      }
    `);
  });

  it("leaves every other row as the same object", () => {
    const before = loaded();
    const s = reducer(before, setNewRowAdDaysValue({ upc: "A", newAdDays: 5 }));
    expect(rowOf(s, "B")).toBe(rowOf(before, "B"));
    expect(rowOf(s, "C")).toBe(rowOf(before, "C"));
  });

  it("does nothing for a UPC that is not in the grid", () => {
    const before = reducer(loaded(), setRowData(ROWS.filter((r) => r.upc !== "B")));
    const s = reducer(before, setNewRowAdDaysValue({ upc: "B", newAdDays: 5 }));
    expect(s.rowData).toBe(before.rowData);
  });
});

describe("a row's price", () => {
  it("takes the days at a price the item has sold at", () => {
    const s = reducer(loaded(), setNewRowPriceValue({ upc: "A", newPrice: 4.49 }));
    expect(rowOf(s, "A")).toMatchInlineSnapshot(`
      {
        "adDays": 3,
        "adFcst": 14,
        "calcNow": 0,
        "daysActive": 60,
        "daysAtPrice": 25,
        "description": "ITEM A",
        "fcstPrice": 4.49,
        "fcstTotal": 62.86,
        "forecastWindow": 7,
        "markdownDollars": 7,
        "qtySold": 60,
        "upc": "A",
      }
    `);
  });

  it("estimates the days at a price the item has never sold at", () => {
    const s = reducer(loaded(), setNewRowPriceValue({ upc: "A", newPrice: 4.25 }));
    expect(rowOf(s, "A")).toMatchInlineSnapshot(`
      {
        "adDays": 3,
        "adFcst": 17,
        "calcNow": 0,
        "daysActive": 60,
        "daysAtPrice": 23,
        "description": "ITEM A",
        "fcstPrice": 4.25,
        "fcstTotal": 72.25,
        "forecastWindow": 7,
        "markdownDollars": 12.580000000000004,
        "qtySold": 0,
        "upc": "A",
      }
    `);
  });

  it("never changes a single-price row", () => {
    const before = loaded();
    const s = reducer(before, setNewRowPriceValue({ upc: "C", newPrice: 5.99 }));
    expect(rowOf(s, "C")).toBe(rowOf(before, "C"));
  });

  it("leaves every other row as the same object", () => {
    const before = loaded();
    const s = reducer(before, setNewRowPriceValue({ upc: "B", newPrice: 1.99 }));
    expect(rowOf(s, "A")).toBe(rowOf(before, "A"));
    expect(rowOf(s, "C")).toBe(rowOf(before, "C"));
  });
});

describe("batch ad days", () => {
  it("recomputes every ticked multi-price row and skips single-price ones", () => {
    const before = loaded();
    const s = reducer(before, setBatchAdDaysRows({ upcs: ["A", "B", "C"], adDays: 6 }));
    expect(s.rowData.map(({ upc, adDays, adFcst, fcstTotal, markdownDollars }) => ({ upc, adDays, adFcst, fcstTotal, markdownDollars }))).toMatchInlineSnapshot(`
      [
        {
          "adDays": 6,
          "adFcst": 36,
          "fcstTotal": 143.64000000000001,
          "markdownDollars": 36,
          "upc": "A",
        },
        {
          "adDays": 6,
          "adFcst": 20,
          "fcstTotal": 45.8,
          "markdownDollars": 4.0000000000000036,
          "upc": "B",
        },
        {
          "adDays": 3,
          "adFcst": 0,
          "fcstTotal": 0,
          "markdownDollars": 0,
          "upc": "C",
        },
      ]
    `);
    expect(rowOf(s, "C")).toBe(rowOf(before, "C"));
  });

  it("touches only the UPCs it was given", () => {
    const before = loaded();
    const s = reducer(before, setBatchAdDaysRows({ upcs: ["B"], adDays: 6 }));
    expect(rowOf(s, "A")).toBe(rowOf(before, "A"));
    expect(rowOf(s, "B")).not.toBe(rowOf(before, "B"));
  });

  it.each([0, -2, NaN])("ignores %s ad days", (adDays) => {
    const before = loaded();
    const s = reducer(before, setBatchAdDaysRows({ upcs: ["A", "B"], adDays }));
    expect(s.rowData).toBe(before.rowData);
  });

  it("gives the same figures as setting each row on its own", () => {
    const batch = reducer(loaded(), setBatchAdDaysRows({ upcs: ["A", "B"], adDays: 6 }));
    let single = reducer(loaded(), setNewRowAdDaysValue({ upc: "A", newAdDays: 6 }));
    single = reducer(single, setNewRowAdDaysValue({ upc: "B", newAdDays: 6 }));
    expect(batch.rowData).toEqual(single.rowData);
  });
});

describe("batch price", () => {
  it("recomputes every ticked multi-price row and skips single-price ones", () => {
    const before = loaded();
    const s = reducer(before, setBatchPriceRows({ upcs: ["A", "B", "C"], price: 2.49 }));
    expect(s.rowData.map(({ upc, fcstPrice, adFcst, qtySold, fcstTotal, markdownDollars, daysAtPrice }) => ({ upc, fcstPrice, adFcst, qtySold, fcstTotal, markdownDollars, daysAtPrice }))).toMatchInlineSnapshot(`
      [
        {
          "adFcst": 29,
          "daysAtPrice": 20,
          "fcstPrice": 2.49,
          "fcstTotal": 72.21000000000001,
          "markdownDollars": 72.5,
          "qtySold": 0,
          "upc": "A",
        },
        {
          "adFcst": 35,
          "daysAtPrice": 40,
          "fcstPrice": 2.49,
          "fcstTotal": 87.15,
          "markdownDollars": 0,
          "qtySold": 75,
          "upc": "B",
        },
        {
          "adFcst": 0,
          "daysAtPrice": 30,
          "fcstPrice": 6.99,
          "fcstTotal": 0,
          "markdownDollars": 0,
          "qtySold": 40,
          "upc": "C",
        },
      ]
    `);
    expect(rowOf(s, "C")).toBe(rowOf(before, "C"));
  });

  it("touches only the UPCs it was given", () => {
    const before = loaded();
    const s = reducer(before, setBatchPriceRows({ upcs: ["A"], price: 4.49 }));
    expect(rowOf(s, "B")).toBe(rowOf(before, "B"));
  });

  it("gives the same figures as setting each row on its own", () => {
    const batch = reducer(loaded(), setBatchPriceRows({ upcs: ["A", "B"], price: 2.29 }));
    let single = reducer(loaded(), setNewRowPriceValue({ upc: "A", newPrice: 2.29 }));
    single = reducer(single, setNewRowPriceValue({ upc: "B", newPrice: 2.29 }));
    expect(batch.rowData).toEqual(single.rowData);
  });
});

describe("undoing an edit", () => {
  it("puts the row back as the search returned it but keeps its notes", () => {
    let s = reducer(loaded(), setNewRowPriceValue({ upc: "B", newPrice: 1.99 }));
    s = reducer(s, setItemNotes({ upc: "B", notes: "check with vendor" }));
    s = reducer(s, resetRowValues(["B"]));
    expect(rowOf(s, "B")).toEqual({ ...ROWS[1], notes: "check with vendor" });
  });
});
