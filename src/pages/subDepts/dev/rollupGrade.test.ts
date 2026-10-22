import { describe, expect, it } from "vitest";
import {
  computeMarginDayMatched,
  computeStoreDayMatched,
  netByDay,
} from ".";
import type { SubDeptMargin } from "../../../interfaces";
import type { RollupRow } from "../../../api/rollup";
import { calculateCogs } from "../../../utils/cogs";

/**
 * Sub Dept Margins grades its list from `subs/rollup` before the item rows
 * land, then from the item rows. The two must agree, or the list would jump
 * when the items arrive.
 */

const item = (
  date: string,
  sales: number,
  tax: number,
  netCost: number,
  qty = 1,
  weight = 0,
  caseSize = 1,
): SubDeptMargin =>
  ({
    sale_date: `${date}T00:00:00`,
    store_number: "54",
    sub_department: 13,
    total_sales: sales,
    total_tax: tax,
    net_cost: netCost,
    cost: netCost + 1,
    case_size: caseSize,
    qty,
    weight,
  }) as unknown as SubDeptMargin;

/** What the server returns for the same rows: summed per day, net as sales
 *  less tax, cogs as calculateCogs per item row. */
const rollup = (rows: SubDeptMargin[]): RollupRow[] => {
  const by = new Map<string, RollupRow>();
  for (const r of rows) {
    const d = r.sale_date.slice(0, 10);
    const cogs = calculateCogs(r.net_cost, r.cost, r.case_size, r.qty, r.weight);
    const found = by.get(d);
    if (found) {
      found.net_sales += r.total_sales - r.total_tax;
      found.cogs += cogs;
    } else {
      by.set(d, {
        key: "13",
        name: "MEAT",
        storeid: 533,
        store_number: "54",
        sale_date: d,
        net_sales: r.total_sales - r.total_tax,
        cogs,
        qty: r.qty,
        weight: r.weight,
        item_count: 1,
      });
    }
  }
  return [...by.values()];
};

const TY = [
  item("2026-10-14", 100, 6, 60),
  item("2026-10-14", 40, 0, 30, 2),
  item("2026-10-15", 55, 3, 20, 1, 2.5, 4),
  item("2026-10-16", 80, 0, 70),
];
const LW = [item("2026-10-07", 90, 5, 50), item("2026-10-09", 70, 0, 40)];
const LY = [item("2025-10-15", 120, 7, 80)];

describe("grading from the rollup", () => {
  it("gives the same margins and deltas as the item rows", () => {
    const fromItems = computeMarginDayMatched(TY, LW, LY);
    const fromTotals = computeMarginDayMatched(rollup(TY), rollup(LW), rollup(LY));
    expect(fromTotals.tyMarginPct).toBeCloseTo(fromItems.tyMarginPct, 10);
    expect(fromTotals.lwPtsDelta).toBeCloseTo(fromItems.lwPtsDelta ?? NaN, 10);
    expect(fromTotals.ptsDelta).toBeCloseTo(fromItems.ptsDelta ?? NaN, 10);
    expect(fromTotals.dollars.net).toBeCloseTo(fromItems.dollars.net, 10);
    expect(fromTotals.dollars.cogs).toBeCloseTo(fromItems.dollars.cogs, 10);
  });

  it("gives the same day-matched sales", () => {
    expect(computeStoreDayMatched(rollup(TY), rollup(LW), rollup(LY))).toEqual(
      computeStoreDayMatched(TY, LW, LY),
    );
  });

  it("gives the sparkline the same days", () => {
    const fromTotals = netByDay(rollup(TY));
    const fromItems = netByDay(TY);
    expect(Object.keys(fromTotals).sort()).toEqual(Object.keys(fromItems).sort());
    for (const d of Object.keys(fromItems)) {
      expect(fromTotals[d]).toBeCloseTo(fromItems[d], 10);
    }
  });
});
