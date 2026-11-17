// Utils
import { fmtNum } from "../../../../../utils/csvExport";
import { ACTION_LABEL } from "../../utils/verdict";
import { daysSince } from "../../utils/metrics";

// Interfaces
import type { ActionKind, SheetRow, ReceiptLine } from "../../interfaces";
import type { buildPriceEras } from "../../utils/priceEras";
import type { Row } from "../interfaces";

/** The Items sheet: one row per UPC, the action and evidence verbatim. */
export const buildItemRows = (
  scoped: SheetRow[],
  receiptsByUpc: Record<string, ReceiptLine[]>,
  receivingComplete: boolean,
  lookbackDays: number,
): Row[] =>
  scoped.map(({ item, verdict }) => {
    const receipts = receiptsByUpc[item.productCode] ?? [];
    const last = receipts[0] ?? null;
    return {
      action: ACTION_LABEL[verdict.action],
      evidence: verdict.evidence,
      dept: item.department,
      vendor: item.vendorName,
      upc: item.productCode,
      description: item.description,
      sales: fmtNum(item.ty.sales),
      units: fmtNum(item.ty.units),
      lwPct: item.lwPct === null ? "" : fmtNum(item.lwPct),
      lyPct: item.lyPct === null ? "" : fmtNum(item.lyPct),
      lwUnits: item.lw ? fmtNum(item.lw.units) : "",
      lyUnits: item.ly ? fmtNum(item.ly.units) : "",
      lwSales: item.lw ? fmtNum(item.lw.sales) : "",
      lySales: item.ly ? fmtNum(item.ly.sales) : "",
      unitCost: item.unitCost === null ? "" : fmtNum(item.unitCost),
      marginPct: item.marginPct === null ? "" : fmtNum(item.marginPct),
      daysSold: item.daysSold,
      // Blank while the walk runs, so an unfinished export can't be read as
      // "nothing was ever delivered".
      lastReceived: last
        ? last.date.slice(0, 10)
        : receivingComplete
          ? `none in ${lookbackDays}d`
          : "",
      daysSinceRecv: last ? (daysSince(last.date) ?? "") : "",
      receivedUnits: last ? fmtNum(last.sellingUnits) : "",
      moveReceived: item.movement ? item.movement.received : "",
      moveSold: item.movement ? item.movement.sold : "",
      moveNet: item.movement ? item.movement.net : "",
      moveDays: item.movement ? item.movement.days : "",
      unaccounted:
        verdict.unaccounted === null ? "" : fmtNum(verdict.unaccounted),
      intendedRetail: last && last.retail > 0 ? fmtNum(last.retail) : "",
    };
  });

/** The Price periods sheet: one row per price each item held. */
export const buildEraRows = (
  scoped: SheetRow[],
  erasByUpc: Map<string, ReturnType<typeof buildPriceEras>>,
): Row[] =>
  scoped.flatMap(({ item }) =>
    (erasByUpc.get(item.productCode) ?? []).map((e) => ({
      upc: item.productCode,
      description: item.description,
      start: e.start,
      end: e.end,
      days: e.days,
      price: fmtNum(e.price),
      unitCost: e.unitCost === null ? "" : fmtNum(e.unitCost),
      marginPct: e.marginPct === null ? "" : fmtNum(e.marginPct),
      units: fmtNum(e.units),
      unitsPerDay: e.unitsPerDay,
    })),
  );

/** The Receipts sheet: one row per delivery of each item. */
export const buildReceiptRows = (
  scoped: SheetRow[],
  receiptsByUpc: Record<string, ReceiptLine[]>,
): Row[] =>
  scoped.flatMap(({ item }) =>
    (receiptsByUpc[item.productCode] ?? []).map((r) => ({
      upc: item.productCode,
      description: item.description,
      date: r.date.slice(0, 10),
      vendor: r.vendorName,
      invoice: r.invoiceId,
      units: fmtNum(r.sellingUnits),
      cases: r.cases,
      billedIn: r.billedIn,
      // Blank on a unit receipt rather than 0 — there is no pack to state,
      // and a zero would read as one.
      caseSize: r.caseSize === null ? "" : r.caseSize,
      unitCost: fmtNum(r.unitCost),
      retail: fmtNum(r.retail),
      free: r.free > 0 ? "Yes" : "No",
      returned: r.returned > 0 ? "Yes" : "No",
    })),
  );

/** One row per department, counted by action. Built from `scoped` like every
 *  other grain, so a narrowed export summarises what it contains rather than
 *  what the store contains. */
export const buildSummaryRows = (scoped: SheetRow[]): Row[] => {
  const byDept = new Map<
    string,
    {
      items: number;
      counts: Record<ActionKind, number>;
      sales: number;
      units: number;
      lyUnits: number;
      hasLY: boolean;
    }
  >();
  for (const { item, verdict } of scoped) {
    const key = item.department || "—";
    let e = byDept.get(key);
    if (!e) {
      e = {
        items: 0,
        counts: {
          investigate: 0,
          reorder: 0,
          reprice: 0,
          vendor: 0,
          none: 0,
          insufficient: 0,
          pending: 0,
        },
        sales: 0,
        units: 0,
        lyUnits: 0,
        hasLY: false,
      };
      byDept.set(key, e);
    }
    e.items += 1;
    e.counts[verdict.action] += 1;
    e.sales += item.ty.sales;
    e.units += item.ty.units;
    if (item.ly) {
      e.lyUnits += item.ly.units;
      e.hasLY = true;
    }
  }
  return [...byDept.entries()]
    .sort((a, b) => b[1].sales - a[1].sales)
    .map(([dept, e]) => ({
      dept,
      items: e.items,
      investigate: e.counts.investigate,
      reorder: e.counts.reorder,
      reprice: e.counts.reprice,
      vendor: e.counts.vendor,
      none: e.counts.none,
      insufficient: e.counts.insufficient,
      sales: fmtNum(e.sales),
      units: fmtNum(e.units),
      // Blank rather than 0% when there is no last year to compare against —
      // an unknown is not a flat year.
      lyPct:
        e.hasLY && e.lyUnits > 0
          ? fmtNum(((e.units - e.lyUnits) / e.lyUnits) * 100)
          : "",
    }));
};
