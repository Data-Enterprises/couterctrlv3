// Utils
import { calculateCogs } from "../../../../utils/cogs";
import { shiftIso } from "../../../../utils/grading";
import { rowPricedUnits as pricedUnits } from "../../../../utils/pricedUnits";
import { normalizeProductCode } from "../../../../utils/productCode";
import { MOVEMENT_DAYS, round2, round1, pctMove, daySpan } from "./metrics";

// Interfaces
import type { SubsPricePoint, SubDeptMargin, ActionKind } from "../../../../interfaces";
import type { DayPoint, PeriodTotals, StockMovement, SinceDelivery, ReportItem, Verdict, ReceiptLine } from "../interfaces";

const totalsOf = (rows: SubDeptMargin[]): PeriodTotals => ({
  sales: rows.reduce((s, r) => s + r.net_sales, 0),
  units: rows.reduce((s, r) => s + pricedUnits(r), 0),
});

const byCode = (rows: SubDeptMargin[]) => {
  const map = new Map<string, SubDeptMargin[]>();
  for (const r of rows) {
    const code = normalizeProductCode(r.product_code);
    const found = map.get(code);
    if (found) found.push(r);
    else map.set(code, [r]);
  }
  return map;
};

/**
 * Every row the report will show.
 *
 * The item set is the union of three sources, and the third is the point of the
 * whole rebuild:
 *
 *   the uploaded UPCs that sold this window,
 *   the uploaded UPCs that didn't (they still get a row — zero is a finding),
 *   and items that were received but never scanned, which the upload could not
 *   have contained.
 *
 * Discovery is bounded: an item only joins on the receipt side if it sold in
 * last week or last year, which both gives it a baseline to be judged against
 * and supplies the department that receipts don't carry. An item that has never
 * sold in any of the three windows has no signal to report and is left out
 * rather than padding the sheet with unknowns.
 */
export const buildReport = (
  upcs: string[],
  tyRows: SubDeptMargin[],
  lwRows: SubDeptMargin[],
  lyRows: SubDeptMargin[],
  /** Plain object rather than a Map: this comes straight out of Redux, and
   *  state has to stay serializable. Every consumer indexes by product code,
   *  which an object does just as well. */
  receiptsByUpc: Record<string, ReceiptLine[]>,
  /** Actual price points from `subs/subs`, keyed the same way. Empty when the
   *  fetch did not ask for them, which every consumer treats as "fall back to
   *  the row arithmetic" rather than as "this item had no prices". */
  pricePointsByUpc: Record<string, SubsPricePoint[]>,
  windowStart: string,
  windowEnd: string,
): ReportItem[] => {
  // The movement span, clamped to the sales we hold. LW covers the days before
  // the picked window, so the pair reaches back a fortnight — but only the part
  // of it that both sides can account for is used.
  const movementStart = (() => {
    const wanted = shiftIso(windowEnd, -(MOVEMENT_DAYS - 1));
    const lwFloor = shiftIso(windowStart, -7);
    return wanted > lwFloor ? wanted : lwFloor;
  })();
  const tyBy = byCode(tyRows);
  const lwBy = byCode(lwRows);
  const lyBy = byCode(lyRows);

  // The report answers for the list it was given, and nothing else.
  //
  // There used to be a second population here, discovered by scanning the
  // receipts for codes with prior-period sales, which the sheet exposed as an
  // "All found" tab. It was dropped because the codes it needed had to be sent
  // to `receivers/item_search` as the request body — five figures of them on a
  // full store — to surface a handful of rows nobody had asked about.
  const wanted = new Set(upcs);

  const items: ReportItem[] = [];
  for (const code of wanted) {
    const ty = tyBy.get(code) ?? [];
    const lw = lwBy.get(code) ?? [];
    const ly = lyBy.get(code) ?? [];
    const receipts = receiptsByUpc[code] ?? [];
    if (ty.length === 0 && lw.length === 0 && ly.length === 0) continue;

    const identity = ty[0] ?? lw[0] ?? ly[0];

    const dayMap = new Map<string, DayPoint>();
    for (const r of ty) {
      const date = r.sale_date.slice(0, 10);
      const units = pricedUnits(r);
      const cogs = calculateCogs(
        r.net_cost,
        r.cost,
        r.case_size,
        r.qty,
        r.weight,
      );
      const found = dayMap.get(date);
      if (found) {
        found.units += units;
        found.netSales += r.net_sales;
        found.cogs += cogs;
      } else {
        dayMap.set(date, {
          date,
          units,
          netSales: r.net_sales,
          price: 0,
          cogs,
        });
      }
    }
    const series = [...dayMap.values()]
      .map((d) => ({
        ...d,
        price: d.units > 0 ? round2(d.netSales / d.units) : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const tyTotals = totalsOf(ty);
    const lwTotals = lw.length > 0 ? totalsOf(lw) : null;
    const lyTotals = ly.length > 0 ? totalsOf(ly) : null;
    const cogs = series.reduce((s, d) => s + d.cogs, 0);

    // Sales across the movement span. LW rows are taken only from before the
    // picked window — a window that isn't exactly seven days makes the two
    // fetches overlap, and adding both sets would count the shared day twice.
    const movementSales = [
      ...ty,
      ...lw.filter((r) => r.sale_date.slice(0, 10) < windowStart),
    ].filter((r) => r.sale_date.slice(0, 10) >= movementStart);

    const soldInSpan = movementSales.reduce((s, r) => s + pricedUnits(r), 0);
    const inSpan = receipts.filter((r) => r.date.slice(0, 10) >= movementStart);
    const receivedInSpan = inSpan.reduce((s, r) => s + r.sellingUnits, 0);
    const movement: StockMovement | null =
      movementSales.length > 0 || receivedInSpan > 0
        ? {
            days: daySpan(movementStart, windowEnd),
            start: movementStart,
            received: round1(receivedInSpan),
            sold: round1(soldInSpan),
            net: round1(receivedInSpan - soldInSpan),
            deliveries: inSpan.length,
          }
        : null;

    // Anchored to the last delivery rather than a span, so it needs no opening
    // balance — but only when that delivery is inside the days we hold sales
    // for, otherwise the sales between it and the span are missing and the
    // subtraction would invent a shortfall.
    const last = receipts[0] ?? null;
    const lastDate = last ? last.date.slice(0, 10) : null;
    const sinceDelivery: SinceDelivery | null =
      last && lastDate && lastDate >= movementStart
        ? (() => {
            const soldSince = movementSales
              .filter((r) => r.sale_date.slice(0, 10) >= lastDate)
              .reduce((s, r) => s + pricedUnits(r), 0);
            return {
              date: last.date,
              received: round1(last.sellingUnits),
              sold: round1(soldSince),
              left: round1(last.sellingUnits - soldSince),
            };
          })()
        : null;

    items.push({
      productCode: code,
      description: identity.product_description,
      department: identity.sub_department_description,
      vendorName:
        identity.vendor_name || receipts[0]?.vendorName || "No vendor",
      ty: tyTotals,
      lw: lwTotals,
      ly: lyTotals,
      lwPct: lwTotals ? pctMove(lwTotals.units, tyTotals.units) : null,
      lyPct: lyTotals ? pctMove(lyTotals.units, tyTotals.units) : null,
      unitCost:
        tyTotals.units > 0
          ? cogs / tyTotals.units
          : (receipts[0]?.unitCost ?? null),
      marginPct:
        tyTotals.sales > 0
          ? ((tyTotals.sales - cogs) / tyTotals.sales) * 100
          : null,
      daysSold: series.length,
      series,
      points: pricePointsByUpc[code] ?? [],
      movement,
      sinceDelivery,
      rows: ty,
    });
  }

  return items;
};

/* -------------------------------------------------------------- price eras */

export const buildRollup = (
  verdicts: Verdict[],
): Record<ActionKind, number> => {
  const out: Record<ActionKind, number> = {
    investigate: 0,
    reorder: 0,
    reprice: 0,
    vendor: 0,
    none: 0,
    insufficient: 0,
    pending: 0,
  };
  for (const v of verdicts) out[v.action] += 1;
  return out;
};
