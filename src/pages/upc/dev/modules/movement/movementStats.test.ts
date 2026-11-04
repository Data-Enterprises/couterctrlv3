import { describe, expect, it } from "vitest";
import type { SubDeptMargin } from "../../../../../interfaces";
import type { MovementRow } from "../../../../../features/dev/devUpcDevSlice";
import {
  MOVEMENT_DEFAULT_WEEKS,
  fmtMovement,
  isoFromMdy,
  movementCsv,
  movementGrid,
  movementStores,
  movementTotal,
  movementWeeks,
  sumWeek,
  weekdayOf,
} from "./movementStats";

const line = (over: Partial<SubDeptMargin>): SubDeptMargin =>
  ({
    storeid: 101,
    store_number: "20",
    store_name: "Store 20",
    product_code: "28617700000",
    product_description: "BEEF CHUCK ROAST",
    sale_date: "2026-10-20",
    qty: 1,
    weight: 0,
    ...over,
  }) as SubDeptMargin;

const row = (over: Partial<MovementRow>): MovementRow => ({
  storeid: 101,
  store_number: "20",
  store_name: "Store 20",
  product_code: "1200000088",
  description: "WHOLE MILK GAL",
  week_ending: "2026-10-24",
  qty: 0,
  weight: 0,
  ...over,
});

describe("movement weeks", () => {
  it("ends every week on the weekday of the search's end date", () => {
    // Caila's request: weeks ending 9/19 through 10/24, all Saturdays.
    const weeks = movementWeeks(isoFromMdy("10/24/2026"), 6);
    expect(weeks.map((w) => w.end)).toEqual([
      "2026-09-19",
      "2026-09-26",
      "2026-10-03",
      "2026-10-10",
      "2026-10-17",
      "2026-10-24",
    ]);
    expect(weeks[0].start).toBe("2026-09-13");
    expect(weekdayOf("2026-10-24")).toBe("Sat");
  });

  it("opens on six weeks, whatever the search covers", () => {
    expect(MOVEMENT_DEFAULT_WEEKS).toBe(6);
    expect(movementWeeks("2026-10-24", MOVEMENT_DEFAULT_WEEKS)).toHaveLength(6);
    expect(movementWeeks("2026-10-24", MOVEMENT_DEFAULT_WEEKS)[0].start).toBe("2026-09-13");
  });

  it("reads one-digit months and days", () => {
    expect(isoFromMdy("9/5/2026")).toBe("2026-09-05");
  });
});

describe("sumWeek", () => {
  it("adds an item's days, price types and refunds into one row per store", () => {
    const rows = sumWeek(
      [
        line({ qty: 3, sale_date: "2026-10-19" }),
        line({ qty: 2, sale_date: "2026-10-20" }),
        // A refund arrives with the sign already applied.
        line({ qty: -1, sale_date: "2026-10-21" }),
        line({ storeid: 102, store_number: "21", qty: 4 }),
      ],
      "2026-10-24",
    );
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.storeid === 101)?.qty).toBe(4);
    expect(rows.find((r) => r.storeid === 102)?.qty).toBe(4);
    expect(rows.every((r) => r.week_ending === "2026-10-24")).toBe(true);
  });
});

describe("movementGrid", () => {
  const weeks = ["2026-10-17", "2026-10-24"];

  it("counts pounds for a weighed item and units for the rest", () => {
    const rows = [
      row({ product_code: "28617700000", qty: 3, weight: 7.5, week_ending: "2026-10-17" }),
      row({ product_code: "28617700000", qty: 2, weight: 4.25 }),
      row({ qty: 6 }),
    ];
    const stores = movementStores([101], [], rows);
    const meat = movementGrid(rows, "28617700000", stores, weeks);
    expect(meat.weighed).toBe(true);
    expect(meat.rows[0].cells).toEqual([7.5, 4.25]);
    expect(meat.total).toBe(11.75);
    expect(fmtMovement(meat.total, true)).toBe("11.75");

    const milk = movementGrid(rows, "1200000088", stores, weeks);
    expect(milk.weighed).toBe(false);
    expect(milk.rows[0].cells).toEqual([null, 6]);
  });

  it("keeps a store that sold none of it, as blanks", () => {
    const rows = [row({ qty: 5 })];
    const stores = movementStores(
      [101, 140],
      [{ storeid: 140, store_number: "452", store_name: "Store 452" }],
      rows,
    );
    const grid = movementGrid(rows, "1200000088", stores, weeks);
    expect(grid.rows.map((r) => r.store.store_number)).toEqual(["20", "452"]);
    expect(grid.rows[1].cells).toEqual([null, null]);
    expect(grid.rows[1].total).toBe(0);
    expect(grid.weekTotals).toEqual([0, 5]);
  });

  it("orders stores by number, as numbers", () => {
    const stores = movementStores(
      [1, 2, 3],
      [
        { storeid: 1, store_number: "442", store_name: "" },
        { storeid: 2, store_number: "21", store_name: "" },
        { storeid: 3, store_number: "20", store_name: "" },
      ],
      [],
    );
    expect(stores.map((s) => s.store_number)).toEqual(["20", "21", "442"]);
  });
});

describe("movementCsv", () => {
  it("writes one line per item per store, a column per week", () => {
    const rows = [row({ qty: 5 }), row({ qty: 2, week_ending: "2026-10-17" })];
    const stores = movementStores([101], [], rows);
    const { headers, lines } = movementCsv(
      rows,
      ["1200000088"],
      new Map([["1200000088", "WHOLE MILK GAL"]]),
      stores,
      ["2026-10-17", "2026-10-24"],
    );
    expect(headers).toEqual([
      "UPC",
      "Description",
      "Store #",
      "Store",
      "Unit",
      "Week ending 10/17/2026",
      "Week ending 10/24/2026",
      "Total",
    ]);
    expect(lines).toEqual([
      ["1200000088", "WHOLE MILK GAL", "20", "Store 20", "units", "2", "5", "7"],
    ]);
    expect(movementTotal(rows, "1200000088")).toBe(7);
  });
});
