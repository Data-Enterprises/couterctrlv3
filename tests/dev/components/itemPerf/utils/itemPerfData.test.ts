import { describe, expect, it } from "vitest";
import type { ItemRow } from "@/features/dev/devItemPerfSlice";
import {
  buildDailyRows,
  buildGroupRows,
  buildItemRows,
  buildMarginDays,
  buildMarginTotals,
  changeVsLw,
  changeVsLy,
  findItem,
  gradedChange,
  matchWeek,
  priceRows,
  sortMarginRows,
  type MarginRow,
} from "@/components-dev/itemPerf/utils/itemPerfData";
import { asLastYearSlots } from "@/utils/perfPairs";
import {
  DEPT_RING_KEY,
  DEPT_RING_LABEL,
  DEPT_RING_NOTE,
  foldDepartmentRings,
} from "@/utils/departmentRings";

const S = { storeid: 685, store_number: "369", store_name: "Arab" };

const TY_MON = "2026-08-24";
const TY_TUE = "2026-08-25";
const WEEK = [TY_MON, TY_TUE, "2026-08-26"];

/** case_size 1 keeps calculateCogs on the plain per-unit path, so these tests
 *  are about grouping and margin rather than cost arithmetic. */
const item = (date: string, opts: Partial<ItemRow> & { sales: number }) =>
  // Priced the same way the page prices them, so the fixtures exercise the
  // real cost path rather than hand-written totals.
  priceRows([
    {
      ...S,
      sale_date: `${date}T00:00:00`,
      product_code: "1200000129",
      product_description: "Pepsi 20 oz",
      sub_department: 1,
      sub_department_description: "Grocery",
      vendor_id: "80",
      vendor_name: "ACE",
      total_sales: opts.sales,
      total_tax: 0,
      qty: 1,
      weight: 0,
      cost: 0,
      net_cost: 0,
      case_size: 1,
      ...opts,
    } as ItemRow,
  ])[0];

const DELI = {
  sub_department: 2,
  sub_department_description: "Deli",
  vendor_id: "91",
  vendor_name: "AWG",
  product_code: "999",
  product_description: "Sliced turkey",
};

describe("buildGroupRows", () => {
  it("groups the same rows by department or by vendor", () => {
    const rows = [
      item(TY_MON, { sales: 100, net_cost: 60 }),
      item(TY_MON, { sales: 300, net_cost: 200, ...DELI }),
    ];
    expect(
      buildGroupRows(rows, [], "subdept", null).map((r) => r.label),
    ).toEqual(["Deli", "Grocery"]);
    expect(
      buildGroupRows(rows, [], "vendor", null).map((r) => r.label),
    ).toEqual(["AWG", "ACE"]);
  });

  it("orders by sales, matching the bars", () => {
    // Deli sells more but earns less. The bars are sales, so Deli leads.
    const rows = [
      item(TY_MON, { sales: 100, net_cost: 10 }),
      item(TY_MON, { sales: 300, net_cost: 280, ...DELI }),
    ];
    expect(buildGroupRows(rows, [], "subdept", null)[0].label).toBe("Deli");
  });

  it("subtitles a group with its profit, since the bar prints its sales", () => {
    const [row] = buildGroupRows(
      [item(TY_MON, { sales: 100, net_cost: 60 })],
      [],
      "subdept",
      null,
    );
    expect(row.sub).toBe("$40.00 gross profit");
  });

  it("keeps a group that sold last year and nothing this year", () => {
    // The trap buildItemRows in utils/itemMargins falls into: iterating this
    // year and looking last year up drops the row entirely instead of showing
    // a zero against its last-year bar.
    const rows = buildGroupRows(
      [],
      [item("2025-08-25", { sales: 500, net_cost: 300 })],
      "subdept",
      null,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].sales).toBe(0);
    expect(rows[0].salesLy).toBe(500);
    expect(rows[0].profit).toBe(0);
    expect(rows[0].profitLy).toBe(200);
    expect(rows[0].gpm).toBeNull();
  });

  it("calls vendor 0 No Vendor rather than printing a zero", () => {
    // Not a vendor numbered zero — the store's own "nothing assigned", and it
    // lands on real items like Managers Special.
    const rows = buildGroupRows(
      [item(TY_MON, { sales: 10, vendor_id: "0", vendor_name: "" })],
      [],
      "vendor",
      null,
    );
    expect(rows[0].label).toBe("No Vendor");
  });

  it("names a vendor by id when the name is blank", () => {
    const rows = buildGroupRows(
      [item(TY_MON, { sales: 10, vendor_name: "" })],
      [],
      "vendor",
      null,
    );
    expect(rows[0].label).toBe("Vendor 80");
  });
});

describe("category grouping", () => {
  it("groups categories/cats rows, which carry no sub department", () => {
    // CatItem is a SubDeptMargin with the grouping column swapped, so the row
    // has category/category_description and neither sub_department field.
    const rows = [
      item(TY_MON, {
        sales: 100,
        net_cost: 60,
        sub_department: undefined,
        sub_department_description: undefined,
        category: 12,
        category_description: "Soft Drinks",
      }),
    ];
    const out = buildGroupRows(rows, [], "category", null);
    expect(out).toHaveLength(1);
    expect(out[0].label).toBe("Soft Drinks");
    expect(out[0].gpm).toBeCloseTo(40);
  });

  it("does not collapse category rows onto one sub-department bucket", () => {
    // keyOf falls back to "" for a missing column. Grouping these by subdept
    // would silently merge every category into a single unnamed row.
    const rows = [
      item(TY_MON, {
        sales: 100,
        sub_department: undefined,
        category: 12,
        category_description: "Soft Drinks",
      }),
      item(TY_MON, {
        sales: 50,
        product_code: "999",
        sub_department: undefined,
        category: 14,
        category_description: "Snacks",
      }),
    ];
    expect(buildGroupRows(rows, [], "category", null)).toHaveLength(2);
  });
});

describe("buildItemRows", () => {
  const rows = [
    item(TY_MON, { sales: 100, net_cost: 60 }),
    item(TY_MON, { sales: 200, net_cost: 120, ...DELI }),
  ];

  it("lists only the items inside a drilled group", () => {
    expect(buildItemRows(rows, [], "subdept", null, "1", "")).toHaveLength(1);
    expect(buildItemRows(rows, [], "vendor", null, "91", "")).toHaveLength(1);
  });

  it("matches a search on description or UPC", () => {
    expect(
      buildItemRows(rows, [], "subdept", null, null, "turkey"),
    ).toHaveLength(1);
    expect(
      buildItemRows(rows, [], "subdept", null, null, "12000001"),
    ).toHaveLength(1);
    expect(buildItemRows(rows, [], "subdept", null, null, "nope")).toHaveLength(
      0,
    );
  });

  it("returns everything for an empty query", () => {
    expect(buildItemRows(rows, [], "subdept", null, null, "")).toHaveLength(2);
  });
});

describe("priceRows", () => {
  it("survives a product code the endpoint sent as a number", () => {
    // The interface promises a string. Some rows arrive numeric, and the
    // search's .toLowerCase() took the whole page down with an error boundary.
    const rows = [
      item(TY_MON, { sales: 10, product_code: 1200000129 as never }),
    ];
    expect(() =>
      buildItemRows(rows, [], "subdept", null, null, "12000"),
    ).not.toThrow();
    expect(
      buildItemRows(rows, [], "subdept", null, null, "12000"),
    ).toHaveLength(1);
  });

  it("strips the trailing decimal a float round-trip leaves behind", () => {
    // "7203096070.0" and "7203096070" are the same item to a person and two
    // different keys to a Map.
    const rows = [
      item(TY_MON, { sales: 10, product_code: "7203096070.0" }),
      item(TY_TUE, { sales: 10, product_code: "7203096070" }),
    ];
    expect(buildItemRows(rows, [], "subdept", null, null, "")).toHaveLength(1);
  });

  it("matches a drilled vendor whose id arrived numeric", () => {
    // A number never === the string key held in state, so the drill silently
    // showed nothing rather than throwing.
    const rows = [item(TY_MON, { sales: 10, vendor_id: 80 as never })];
    expect(buildItemRows(rows, [], "vendor", null, "80", "")).toHaveLength(1);
  });
});

describe("buildMarginTotals", () => {
  it("computes margin from cost, not the row's own margin field", () => {
    const t = buildMarginTotals(
      [item(TY_MON, { sales: 100, net_cost: 60 })],
      [],
      "subdept",
      null,
      null,
      null,
    );
    expect(t.cogs).toBe(60);
    expect(t.profit).toBe(40);
    expect(t.gpm).toBeCloseTo(40);
  });

  it("counts weighted items by weight, not scan count", () => {
    // A pound of bananas is one scan and several priced units.
    const t = buildMarginTotals(
      [item(TY_MON, { sales: 10, qty: 1, weight: 4.5 })],
      [],
      "subdept",
      null,
      null,
      null,
    );
    expect(t.units).toBe(4.5);
  });

  it("returns null margin rather than zero when nothing sold", () => {
    expect(
      buildMarginTotals([], [], "subdept", null, null, null).gpm,
    ).toBeNull();
  });

  it("day-matches last year rather than shifting a fixed 365 days", () => {
    // Monday 2026-08-24 pairs with Monday 2025-08-25, not 2025-08-24.
    const t = buildMarginTotals(
      [item(TY_MON, { sales: 100, net_cost: 50 })],
      [
        item("2025-08-25", { sales: 90, net_cost: 40 }),
        item("2025-08-24", { sales: 5000, net_cost: 10 }),
      ],
      "subdept",
      TY_MON,
      null,
      null,
    );
    expect(t.salesLy).toBe(90);
    expect(t.cogsLy).toBe(40);
    expect(t.profitLy).toBe(50);
  });

  it("narrows to one item for the Daily view", () => {
    const t = buildMarginTotals(
      [
        item(TY_MON, { sales: 100, net_cost: 60 }),
        item(TY_MON, { sales: 900, net_cost: 500, ...DELI }),
      ],
      [],
      "subdept",
      null,
      null,
      "999",
    );
    expect(t.sales).toBe(900);
  });
});

describe("buildDailyRows", () => {
  it("returns a row per window day, flagging the ones with no sale", () => {
    const rows = buildDailyRows(
      [item(TY_MON, { sales: 16.95, net_cost: 12.9 })],
      "1200000129",
      WEEK,
    );
    expect(rows).toHaveLength(3);
    expect(rows[0].absent).toBe(false);
    expect(rows[0].gpm).toBeCloseTo(23.89, 1);
    // A day the item did not sell is not a day it sold zero.
    expect(rows[1].absent).toBe(true);
    expect(rows[1].gpm).toBeNull();
  });

  it("returns empty rows when no item is selected", () => {
    const rows = buildDailyRows([item(TY_MON, { sales: 10 })], null, WEEK);
    expect(rows.every((r) => r.absent)).toBe(true);
  });
});

describe("findItem", () => {
  it("finds an item that only sold last year", () => {
    const ly = item("2025-08-25", { sales: 5, product_code: "999" });
    expect(findItem("999", [], [ly])?.product_code).toBe("999");
    expect(findItem(null, [ly])).toBeUndefined();
  });
});

describe("whole-week day matching around a moving holiday", () => {
  // TY Fri 9/4–Thu 9/10/2026 matches Labor Day Mon 9/1/2025 plus 9/5–9/11. The
  // LY fetch spans 9/1–9/11; last year here has only 9/1, 9/5 and 9/10 of the
  // matched dates, plus 9/2 and 9/8 which match nothing.
  const TY = ["2026-09-04", "2026-09-05", "2026-09-06", "2026-09-07", "2026-09-08", "2026-09-09", "2026-09-10"];
  const ty = TY.map((d) => item(d, { sales: 100 }));
  const ly = [
    item("2025-09-01", { sales: 30 }),
    item("2025-09-02", { sales: 999 }), // padding
    item("2025-09-05", { sales: 20 }),
    item("2025-09-08", { sales: 999 }), // padding
    item("2025-09-10", { sales: 10 }),
    item("2025-09-03", { sales: 500, ...DELI }), // a group that only sold on padding
  ];
  const match = matchWeek(ty, ly);

  it("matches 3 of the 7 days", () => {
    expect(match).toMatchObject({ days: 7, lyDays: 3 });
  });

  it("totals never sum padding dates, and compare TY over matched days", () => {
    const t = buildMarginTotals(ty, ly, "subdept", null, null, null, match);
    expect(t.salesLy).toBe(60);
    expect(t.sales).toBe(700);
    expect(t.salesForLy).toBe(300);
    expect(t).toMatchObject({ days: 7, lyDays: 3 });
  });

  it("group rows drop padding rows, and a group that only sold then", () => {
    const rows = buildGroupRows(ty, ly, "subdept", null, match);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ sales: 700, salesForLy: 300, salesLy: 60 });
  });

  it("a selected day names its one LY date", () => {
    // Mon 9/7/2026 (Labor Day) against Mon 9/1/2025.
    const t = buildMarginTotals(ty, ly, "subdept", "2026-09-07", null, null, match);
    expect(t.salesLy).toBe(30);
    expect(t.lyDays).toBeNull();
  });
});

/** A list row with only the figures a test names; the rest read zero. */
const marginRow = (o: Partial<MarginRow> & { key: string }): MarginRow => ({
  label: o.key,
  sub: "",
  sales: 0,
  salesForLy: 0,
  salesLy: 0,
  salesForLw: 0,
  salesLw: 0,
  units: 0,
  unitsForLy: 0,
  unitsLy: 0,
  unitsForLw: 0,
  unitsLw: 0,
  profit: 0,
  profitLy: 0,
  gpm: null,
  ...o,
});

describe("sortMarginRows", () => {
  const row = (key: string, label: string, profit: number, sales: number, salesLy: number, gpm: number | null) =>
    marginRow({ key, label, sales, salesForLy: sales, salesLy, profit, gpm });
  const rows = [
    row("a", "Bakery", 50, 400, 800, 12.5), // sales -50%
    row("b", "Produce", 200, 300, 225, 40), // sales +33%
    row("c", "Deli", 80, 900, 0, null), // no LY, no gpm
  ];
  const keys = (r: { key: string }[]) => r.map((x) => x.key);

  it("sales, profit and name", () => {
    expect(keys(sortMarginRows(rows, "sales"))).toEqual(["c", "a", "b"]);
    expect(keys(sortMarginRows(rows, "profit"))).toEqual(["b", "c", "a"]);
    expect(keys(sortMarginRows(rows, "name"))).toEqual(["a", "c", "b"]);
  });

  it("gpm lowest first and change biggest drop first, unknowns last", () => {
    expect(keys(sortMarginRows(rows, "gpm"))).toEqual(["a", "b", "c"]);
    expect(keys(sortMarginRows(rows, "change"))).toEqual(["a", "b", "c"]);
  });
});

/** Last week as the page stores it: re-dated into last year's slots, then
 *  priced, so `_day` matches what the builders look up. */
const lwItem = (date: string, opts: Partial<ItemRow> & { sales: number }) =>
  priceRows(asLastYearSlots([item(date, opts)]))[0];

describe("last week beside last year", () => {
  // TY Mon 8/24 and Tue 8/25. Last week has only Mon 8/17, which lands in the
  // slot last year's Mon 8/25/2025 would fill.
  const ty = [
    item(TY_MON, { sales: 100, qty: 4 }),
    item(TY_TUE, { sales: 50, qty: 2 }),
  ];
  const lw = [lwItem("2026-08-17", { sales: 80, qty: 5 })];
  const matchLw = matchWeek(ty, lw);

  it("sums last week over its matched days, apart from last year", () => {
    const t = buildMarginTotals(ty, [], "subdept", null, null, null, matchWeek(ty, []), lw, matchLw);
    expect(t).toMatchObject({
      sales: 150,
      salesLy: 0,
      salesLw: 80,
      // This year only over the day last week has.
      salesForLw: 100,
      units: 6,
      unitsLw: 5,
      unitsForLw: 4,
    });
  });

  it("group and item rows carry last week too", () => {
    const [g] = buildGroupRows(ty, [], "subdept", null, undefined, lw, matchLw);
    expect(g).toMatchObject({ sales: 150, salesLw: 80, salesForLw: 100 });
    const [i] = buildItemRows(ty, [], "subdept", null, null, "", undefined, lw, matchLw);
    expect(i).toMatchObject({ salesLw: 80, unitsLw: 5 });
  });

  it("a selected day reads last week's same weekday", () => {
    const t = buildMarginTotals(ty, [], "subdept", TY_MON, null, null, undefined, lw, matchLw);
    expect(t.salesLw).toBe(80);
    expect(
      buildMarginTotals(ty, [], "subdept", TY_TUE, null, null, undefined, lw, matchLw).salesLw,
    ).toBe(0);
  });
});

describe("gradedChange", () => {
  it("reads against last year when it has anything", () => {
    const r = marginRow({ key: "a", salesForLy: 120, salesLy: 100, salesForLw: 50, salesLw: 100 });
    expect(gradedChange(r)).toBeCloseTo(20);
    expect(changeVsLw(r)).toBeCloseTo(-50);
  });

  it("falls back to last week only where last year has nothing", () => {
    const r = marginRow({ key: "a", salesForLy: 120, salesLy: 0, salesForLw: 90, salesLw: 60 });
    expect(changeVsLy(r)).toBeNull();
    expect(gradedChange(r)).toBeCloseTo(50);
  });

  it("is null with neither", () => {
    expect(gradedChange(marginRow({ key: "a", sales: 10, salesForLy: 10 }))).toBeNull();
  });
});

describe("the units measure", () => {
  const rows = [
    // Bigger in dollars, smaller in units.
    marginRow({ key: "a", sales: 900, units: 10, unitsForLy: 10, unitsLy: 20, unitsForLw: 10, unitsLw: 5 }),
    marginRow({ key: "b", sales: 100, units: 50, unitsForLy: 50, unitsLy: 25, unitsForLw: 50, unitsLw: 100 }),
  ];
  const keys = (r: { key: string }[]) => r.map((x) => x.key);

  it("orders the size sort by units", () => {
    expect(keys(sortMarginRows(rows, "sales"))).toEqual(["a", "b"]);
    expect(keys(sortMarginRows(rows, "sales", false, "units"))).toEqual(["b", "a"]);
  });

  it("changes are worked in units", () => {
    expect(changeVsLy(rows[0], "units")).toBeCloseTo(-50);
    expect(changeVsLw(rows[1], "units")).toBeCloseTo(-50);
    expect(gradedChange(rows[1], "units")).toBeCloseTo(100);
  });

  it("sorts by change vs LW, biggest drop first", () => {
    expect(keys(sortMarginRows(rows, "changeLw", false, "units"))).toEqual(["b", "a"]);
  });

  it("the day chart draws units", () => {
    const ty = [item(TY_MON, { sales: 100, qty: 3 })];
    const ly = [item("2025-08-25", { sales: 90, qty: 7 })];
    const [mon] = buildMarginDays(ty, ly, "subdept", null, null, [TY_MON], "units");
    expect(mon).toMatchObject({ ty: 3, ly: 7 });
    const [monSales] = buildMarginDays(ty, ly, "subdept", null, null, [TY_MON]);
    expect(monSales).toMatchObject({ ty: 100, ly: 90 });
  });
});

describe("sales rung on the department key", () => {
  // The catch-all rows: a 0, a blank, and the Refunded twin, each named after
  // the department.
  const rows = priceRows(
    foldDepartmentRings([
      item(TY_MON, { sales: 40, product_code: 0 as unknown as string, product_description: "Grocery" }),
      item(TY_MON, { sales: 25, product_code: "", product_description: "Grocery" }),
      item(TY_TUE, { sales: -5, product_code: "0", product_description: "Refunded" }),
      item(TY_MON, { sales: 10 }),
    ]),
  );

  it("fold into one labelled row, refunds netted", () => {
    const out = buildItemRows(rows, [], "subdept", null, null, "");
    expect(out).toHaveLength(2);
    const dept = out.find((r) => r.key === DEPT_RING_KEY);
    expect(dept).toMatchObject({
      label: DEPT_RING_LABEL,
      sub: DEPT_RING_NOTE,
      sales: 60,
    });
  });

  it("stay inside their sub department, so the list adds up to it", () => {
    const [group] = buildGroupRows(rows, [], "subdept", null);
    const items = buildItemRows(rows, [], "subdept", null, group.key, "");
    expect(items.reduce((a, r) => a + r.sales, 0)).toBe(group.sales);
  });

  it("on Vendors, sit under the vendor they were rung against", () => {
    const vendorless = priceRows(
      foldDepartmentRings([item(TY_MON, { sales: 40, product_code: "0", vendor_id: "0", vendor_name: "" })]),
    );
    const [group] = buildGroupRows(vendorless, [], "vendor", null);
    expect(group.label).toBe("No Vendor");
    expect(buildItemRows(vendorless, [], "vendor", null, group.key, "")[0].key).toBe(DEPT_RING_KEY);
  });
});
