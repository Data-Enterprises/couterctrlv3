import { describe, expect, it } from "vitest";
import type { HourlySale, SubSale, WeeklySale } from "../../../../interfaces";
import {
  buildDays,
  buildHourPairs,
  buildItemPairs,
  filterItemPairs,
  buildStorePairs,
  buildSubPairs,
  buildTotals,
  sortPairs,
  storeKeyOf,
} from "./perfData";

/* Two stores sharing a storeid, which is the case storeKeyOf exists for:
   685 carries both store_number 369 and 370 in real data. */
const A = { storeid: 685, store_number: "369", store_name: "Arab" };
const B = { storeid: 685, store_number: "370", store_name: "Hartselle" };

const week = (s: typeof A, date: string, net: number, tax = 0): WeeklySale => ({
  ...s,
  sale_date: `${date}T00:00:00`,
  net_sales: net,
  total_sales: net + tax,
  total_tax: tax,
  qty: 0,
  weight: 0,
});

const hour = (
  s: typeof A,
  date: string,
  h: number,
  net: number,
  transactions: number,
): HourlySale =>
  ({
    ...s,
    sale_date: `${date}T00:00:00`,
    hour: h,
    total_sales: net,
    total_tax: 0,
    transactions,
  }) as HourlySale;

const sub = (
  s: typeof A,
  date: string,
  dept: number,
  desc: string,
  net: number,
  coupons = 0,
): SubSale =>
  ({
    ...s,
    sale_date: `${date}T00:00:00`,
    sub_department: dept,
    sub_department_description: desc,
    total_sales: net,
    total_tax: 0,
    digital_coupons: coupons,
    store_coupon: 0,
    elec_instore_coupons: 0,
    elec_store_coupons: 0,
  }) as SubSale;

/* Every fixture reports on total_sales - total_tax, the basis all three sales
   endpoints reconcile on as of 2026-08-25. */

/* 2026-08-24 is a Monday; its day-matched partner is 2025-08-25. */
const TY_MON = "2026-08-24";
const TY_TUE = "2026-08-25";

describe("storeKeyOf", () => {
  it("separates two store numbers sharing one storeid", () => {
    expect(storeKeyOf(A)).not.toBe(storeKeyOf(B));
  });
});

describe("buildTotals", () => {
  const weekTy = [
    week(A, TY_MON, 100, 5),
    week(B, TY_MON, 200, 10),
    week(A, TY_TUE, 400, 20),
  ];
  const hourlyTy = [
    hour(A, TY_MON, 9, 100, 4),
    hour(B, TY_MON, 9, 200, 6),
    hour(A, TY_TUE, 9, 400, 10),
  ];
  const subsTy = [
    sub(A, TY_MON, 1, "Grocery", 100, 3),
    sub(B, TY_MON, 1, "Grocery", 200, 7),
  ];

  it("sums everything when nothing is scoped", () => {
    const t = buildTotals(weekTy, [], hourlyTy, subsTy, null, null);
    expect(t.sales).toBe(700);
    expect(t.tax).toBe(35);
    expect(t.transactions).toBe(20);
    expect(t.coupons).toBe(10);
  });

  it("narrows to one day", () => {
    const t = buildTotals(weekTy, [], hourlyTy, subsTy, TY_MON, null);
    expect(t.sales).toBe(300);
    expect(t.transactions).toBe(10);
  });

  it("filters weekly by store, and only weekly", () => {
    // Weekly is the one endpoint whose group response carries store identity.
    // Hourly and sub rows arrive already scoped — the caller hands over the
    // group bundle or that store's bundle — so filtering them here would
    // silently return nothing on real group data.
    const t = buildTotals(weekTy, [], hourlyTy, subsTy, null, storeKeyOf(A));
    expect(t.sales).toBe(500);
    expect(t.tax).toBe(25);
    expect(t.coupons).toBe(10);
    expect(t.transactions).toBe(20);
  });

  it("composes day and store on the weekly figures", () => {
    const t = buildTotals(weekTy, [], hourlyTy, subsTy, TY_MON, storeKeyOf(A));
    expect(t.sales).toBe(100);
    // Day still narrows the bundle; store does not.
    expect(t.transactions).toBe(10);
  });

  it("returns 0 rather than NaN when there are no transactions", () => {
    const t = buildTotals(weekTy, [], [], [], null, null);
    expect(t.avgBasket).toBe(0);
  });

  it("day-matches last year rather than shifting a fixed 365 days", () => {
    const t = buildTotals(
      [week(A, TY_MON, 100)],
      [week(A, "2025-08-25", 90)],
      [],
      [],
      TY_MON,
      null,
    );
    // Monday 2026-08-24 pairs with Monday 2025-08-25, not 2025-08-24.
    expect(t.salesLy).toBe(90);
  });
});

describe("buildDays", () => {
  const weekTy = [
    week(A, TY_MON, 100),
    week(B, TY_MON, 200),
    week(A, TY_TUE, 50),
  ];

  it("keeps every day when a store is selected", () => {
    // The chart is the day control, so narrowing it to the selected day would
    // leave a single column to tap.
    const days = buildDays(weekTy, [], storeKeyOf(A));
    expect(days.map((d) => d.iso)).toEqual([TY_MON, TY_TUE]);
    expect(days[0].ty).toBe(100);
  });

  it("orders by date, not by size", () => {
    const days = buildDays(weekTy, [], null);
    expect(days[0].iso).toBe(TY_MON);
    expect(days[0].ty).toBe(300);
  });
});

describe("dimension lists", () => {
  it("store rows are labelled by name alone and never store-scoped", () => {
    // The resolver stands in for the user's assigned stores — the label never
    // comes off the payload, so the test supplies it the same way the page does.
    const rows = buildStorePairs(
      [week(A, TY_MON, 100), week(B, TY_MON, 200)],
      [],
      null,
      (_id, fallback) => fallback ?? "",
    );
    expect(rows.map((r) => r.label)).toEqual(["Hartselle", "Arab"]);
  });

  it("sub-departments sum whatever scope they were handed", () => {
    // No store filter by design: a group response carries no store dimension,
    // so the caller passes either the group bundle or one store's bundle.
    // Filtering here would look like it worked and quietly return nothing.
    const rows = buildSubPairs(
      [sub(A, TY_MON, 1, "Grocery", 100), sub(B, TY_MON, 1, "Grocery", 900)],
      [],
      null,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].ty).toBe(1000);
  });

  it("hours read as a timeline rather than a ranking", () => {
    const rows = buildHourPairs(
      [hour(A, TY_MON, 14, 10, 1), hour(A, TY_MON, 9, 500, 1)],
      [],
      null,
    );
    expect(rows.map((r) => r.label)).toEqual(["9am – 10am", "2pm – 3pm"]);
  });

  it("names midnight and noon rather than 0pm and 12am", () => {
    const rows = buildHourPairs(
      [hour(A, TY_MON, 0, 1, 1), hour(A, TY_MON, 12, 1, 1)],
      [],
      null,
    );
    expect(rows.map((r) => r.label)).toEqual(["12am – 1am", "12pm – 1pm"]);
  });
});

describe("sortPairs", () => {
  const p = (key: string, label: string, ty: number, ly: number) => ({
    key,
    label,
    ty,
    ly,
  });
  const rows = [
    p("685__10", "Hartselle", 100, 200), // -50%
    p("685__9", "Arab", 300, 250), // +20%
    p("686__2", "Boaz", 50, 0), // no LY
  ];
  const keys = (r: { key: string }[]) => r.map((x) => x.key);

  it("sales puts the largest this year first", () => {
    expect(keys(sortPairs(rows, "sales"))).toEqual(["685__9", "685__10", "686__2"]);
  });

  it("change puts the biggest drop first and rows without LY last", () => {
    expect(keys(sortPairs(rows, "change"))).toEqual(["685__10", "685__9", "686__2"]);
  });

  it("name compares numbers as numbers", () => {
    const byNumber = sortPairs(rows, "name", (r) => r.key.split("__")[1]);
    expect(keys(byNumber)).toEqual(["686__2", "685__9", "685__10"]);
  });

  it("time orders by the key as an hour", () => {
    const hours = [p("14", "2pm", 1, 1), p("9", "9am", 5, 5), p("10", "10am", 3, 3)];
    expect(keys(sortPairs(hours, "time"))).toEqual(["9", "10", "14"]);
  });

  it("does not mutate its input", () => {
    const copy = [...rows];
    sortPairs(rows, "change");
    expect(rows).toEqual(copy);
  });
});

describe("buildItemPairs", () => {
  const item = (code: unknown, date: string, net: number) =>
    ({
      ...A,
      sale_date: `${date}T00:00:00`,
      product_code: code,
      product_description: "GUM",
      total_sales: net,
      total_tax: 0,
    }) as unknown as import("../../../../interfaces").SubDeptMargin;

  it("pairs this year with the matched weekday last year, keyed as a string", () => {
    // 2026-09-08 (Tue) matches 2025-09-09 (Tue).
    const rows = buildItemPairs(
      [item(123, "2026-09-08", 10)],
      [item("123", "2025-09-09", 8)],
      null,
    );
    expect(rows).toEqual([{ key: "123", label: "GUM", ty: 10, ly: 8 }]);
  });

  it("scopes both sides to the selected day", () => {
    const rows = buildItemPairs(
      [item("1", "2026-09-08", 10), item("1", "2026-09-09", 5)],
      [item("1", "2025-09-09", 8), item("1", "2025-09-10", 4)],
      "2026-09-09",
    );
    expect(rows).toEqual([{ key: "1", label: "GUM", ty: 5, ly: 4 }]);
  });
});

describe("filterItemPairs", () => {
  const pairs = [
    { key: "0002874900229", label: "FRESH GROUND BEEF", ty: 1, ly: 1 },
    { key: "2718257508", label: "RIBEYE STEAK PATTIES", ty: 1, ly: 1 },
  ];
  it("matches description ignoring case", () => {
    expect(filterItemPairs(pairs, "ribeye").map((p) => p.key)).toEqual(["2718257508"]);
  });
  it("matches UPC with or without leading zeros", () => {
    expect(filterItemPairs(pairs, "2874900").map((p) => p.key)).toEqual(["0002874900229"]);
    expect(filterItemPairs(pairs, "0002874").map((p) => p.key)).toEqual(["0002874900229"]);
  });
  it("returns everything for a blank query", () => {
    expect(filterItemPairs(pairs, "  ")).toHaveLength(2);
  });
});
