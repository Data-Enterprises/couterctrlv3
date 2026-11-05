// Utils
import { formatCurrency2 } from "../../../../../../utils";
import {
  gradeBasis,
  gradeOnBasis,
  basisPct,
  severityRank,
  matchDatedRows,
  type Coverage,
  type GradeBasis,
} from "../../../utils/ledgerUtils";

// Interfaces
import type { GradingMetric } from "../../../../../../features/dev/devSalesLedgerSlice";
import type { SubSale } from "../../../../../../interfaces";
import type { Severity } from "../../../components/LedgerRow";
import type {
  DeptCta,
  DeptRow,
  DeptSortColumn,
  DeptSortState,
  GradedItem,
  ItemSortColumn,
  ItemSortState,
} from "../interfaces";

export const money = (v: number) => formatCurrency2(v);

export const signed = (v: number) =>
  (v >= 0 ? "+" : "−") + formatCurrency2(Math.abs(v));

/** The left list: marker, name, the money, and the units behind it. */
export const LIST_COLS = "10px minmax(0,1fr) 88px 76px";

/**
 * Grade on last year only when it covers every day, else last week when that
 * does, else not at all. Coverage belongs to the list (every sub-department
 * shares the store's dates), not the row — see matchDatedRows.
 */
export const deptBasis = (r: DeptRow, coverage: Coverage): GradeBasis =>
  gradeBasis({ hasLY: r.hasLY, hasLW: r.hasLW, ...coverage });

export const deptSeverity = (
  r: DeptRow,
  coverage: Coverage,
  threshold: number,
  metric: GradingMetric,
): Severity | null => {
  const basis = deptBasis(r, coverage);
  return metric === "qty"
    ? gradeOnBasis(basis, r.vsLWQtyPct, r.vsLYQtyPct, threshold)
    : gradeOnBasis(basis, r.vsLWPct, r.vsLYPct, threshold);
};

export const getCta = (
  row: DeptRow,
  coverage: Coverage,
  threshold: number,
  metric: GradingMetric,
): DeptCta => {
  const basis = deptBasis(row, coverage);
  const sev = deptSeverity(row, coverage, threshold, metric);
  const isQty = metric === "qty";
  const lwPct = isQty ? row.vsLWQtyPct : row.vsLWPct;
  const lyPct = isQty ? row.vsLYQtyPct : row.vsLYPct;

  if (basis === null) {
    return {
      severity: null,
      text: `Not graded. Neither last week (${coverage.lwDayCount} of ${coverage.dayCount} days) nor last year (${coverage.lyDayCount} of ${coverage.dayCount} days) covers the whole week, so there's no full-week comparison to grade on.`,
    };
  }

  const primaryPeriod = basis;
  const primaryPct = basis === "LY" ? lyPct : lwPct;
  const pctStr = `${Math.abs(primaryPct).toFixed(2)}%`;
  // When last year exists but is missing days, say why it isn't the one being
  // used — otherwise a grey LY figure beside an LW grade looks like an error.
  const partialLyNote =
    basis === "LW" && row.hasLY
      ? ` Last year covers only ${coverage.lyDayCount} of ${coverage.dayCount} days, so it isn't used to grade.`
      : "";
  const bothFull = basis === "LY" && row.hasLW;

  if (sev === "critical") {
    const secondaryNote = bothFull
      ? lwPct < 0
        ? ` LW also down ${Math.abs(lwPct).toFixed(2)}% — trend is consistent.`
        : ` LW is up ${lwPct.toFixed(2)}% — decline may be seasonal vs last year.`
      : "";
    return {
      severity: "critical",
      text: `Down ${pctStr} vs ${primaryPeriod} — exceeds the ${threshold}% threshold.${secondaryNote}${partialLyNote} Check receiving, shrink, and pricing.`,
    };
  }
  if (sev === "watch") {
    const secondaryNote = bothFull
      ? lwPct >= 0
        ? ` Recovering vs LW — may be stabilizing.`
        : ` LW also soft — monitor for a second consecutive week.`
      : "";
    return {
      severity: "watch",
      text: `Down ${pctStr} vs ${primaryPeriod} — within the watch band.${secondaryNote}${partialLyNote}`,
    };
  }
  const secondaryHealthNote = bothFull
    ? lwPct < 0
      ? ` LW is softer — watch for a developing trend.`
      : ` LW also positive.`
    : "";
  return {
    severity: "healthy",
    text: `At or above ${primaryPeriod}.${secondaryHealthNote}${partialLyNote} Contribution holding strong.`,
  };
};

/**
 * The store's sub departments for the week, graded and sorted worst first,
 * with the day coverage they were graded on.
 *
 * Deliberately `total_sales - total_tax` and not `net_sales`: the page is on
 * one basis throughout.
 */
export const buildDeptRows = (
  subSales: SubSale[],
  subSalesWk2: SubSale[],
  subSalesWk3: SubSale[],
  threshold: number,
  gradingMetric: GradingMetric,
): { rows: DeptRow[]; coverage: Coverage } => {
  const isQty = gradingMetric === "qty";
  const buildMap = (src: SubSale[]) =>
    src.reduce(
      (
        acc: Record<
          number,
          {
            net: number;
            qty: number;
            digital: number;
            elecInstore: number;
            elecStore: number;
            storeCpn: number;
          }
        >,
        s,
      ) => {
        if (!acc[s.sub_department])
          acc[s.sub_department] = {
            net: 0,
            qty: 0,
            digital: 0,
            elecInstore: 0,
            elecStore: 0,
            storeCpn: 0,
          };
        acc[s.sub_department].net += s.total_sales - s.total_tax;
        acc[s.sub_department].qty += s.qty;
        acc[s.sub_department].digital += s.digital_coupons;
        acc[s.sub_department].elecInstore += s.elec_instore_coupons;
        acc[s.sub_department].elecStore += s.elec_store_coupons;
        acc[s.sub_department].storeCpn += s.store_coupon;
        return acc;
      },
      {},
    );

  const lwMap = buildMap(subSalesWk2);
  const lyMap = buildMap(subSalesWk3);

  /**
   * The TW side of each comparison, restricted to the days that matched.
   *
   * `subSalesWk2`/`subSalesWk3` are filtered upstream to the matched date
   * set; `subSales` is the whole TW week. Dividing one by the other is the
   * bug this fixes, and it does not merely exaggerate — it inverts. Wic
   * Grocery at store 590 has three of seven LY days: the full week's
   * $1,591.91 over those three days' $1,069.40 reads +48.86%, while the
   * same three TW days total $619.31, which is -42.09%. The sheet was
   * calling a department up by half when it is down by nearly as much.
   *
   * LW and LY need separate subtotals because their matched sets differ —
   * here LW is all seven days and LY is three.
   */
  const matched = matchDatedRows(subSales, subSalesWk2, subSalesWk3);
  const twForLW = buildMap(matched.twForLW);
  const twForLY = buildMap(matched.twForLY);
  const coverage = matched.coverage;

  const twMap = subSales.reduce(
    (
      acc: Record<
        number,
        {
          desc: string;
          net: number;
          qty: number;
          digital: number;
          elecInstore: number;
          elecStore: number;
          storeCpn: number;
        }
      >,
      s,
    ) => {
      if (!acc[s.sub_department]) {
        acc[s.sub_department] = {
          desc: s.sub_department_description,
          net: 0,
          qty: 0,
          digital: 0,
          elecInstore: 0,
          elecStore: 0,
          storeCpn: 0,
        };
      }
      acc[s.sub_department].net += s.total_sales - s.total_tax;
      acc[s.sub_department].qty += s.qty;
      acc[s.sub_department].digital += s.digital_coupons;
      acc[s.sub_department].elecInstore += s.elec_instore_coupons;
      acc[s.sub_department].elecStore += s.elec_store_coupons;
      acc[s.sub_department].storeCpn += s.store_coupon;
      return acc;
    },
    {},
  );

  const twRows = Object.entries(twMap)
    .map(([id, r]) => {
      const numId = Number(id);
      const lw = lwMap[numId];
      const ly = lyMap[numId];
      const lwNet = lw?.net ?? 0;
      const lyNet = ly?.net ?? 0;
      const lwQty = lw?.qty ?? 0;
      const lyQty = ly?.qty ?? 0;
      // Each percentage divides by the TW subtotal for its OWN comparison.
      // `tw` below stays the whole week — it is the department's actual
      // sales and the column header says so — but it is never the base.
      const twLW = twForLW[numId];
      const twLY = twForLY[numId];
      const twNetForLW = twLW?.net ?? 0;
      const twNetForLY = twLY?.net ?? 0;
      const twQtyForLW = twLW?.qty ?? 0;
      const twQtyForLY = twLY?.qty ?? 0;
      return {
        id: numId,
        desc: r.desc,
        tw: r.net,
        lw: lwNet,
        ly: lyNet,
        hasLW: lwNet > 0,
        hasLY: lyNet > 0,
        vsLWPct: lwNet ? ((twNetForLW - lwNet) / lwNet) * 100 : 0,
        vsLYPct: lyNet ? ((twNetForLY - lyNet) / lyNet) * 100 : 0,
        vsLWQtyPct: lwQty ? ((twQtyForLW - lwQty) / lwQty) * 100 : 0,
        vsLYQtyPct: lyQty ? ((twQtyForLY - lyQty) / lyQty) * 100 : 0,
        qty: r.qty,
        lwQty,
        lyQty,
        digital: r.digital,
        lyDigital: ly?.digital ?? 0,
        elecInstore: r.elecInstore,
        lyElecInstore: ly?.elecInstore ?? 0,
        elecStore: r.elecStore,
        lyElecStore: ly?.elecStore ?? 0,
        storeCpn: r.storeCpn,
        lyStoreCpn: ly?.storeCpn ?? 0,
      };
    });

  /**
   * Departments that sold LW and/or LY but have no TW row at all.
   *
   * The list above is anchored on `twMap`, so a department that sold
   * nothing this week never becomes a row and vanishes from the panel
   * entirely — which reads as "this department doesn't exist" when what
   * happened is "this department stopped selling". That is the signal, not
   * the absence of one.
   *
   * Merged into the one list rather than held behind a filter: a
   * department at zero is a department the reader wants in front of them,
   * and it grades like any other row. The item level keeps its inactive
   * codes apart, but that list is hundreds long where this one is dozens.
   */
  const inactiveIds = [...new Set([...Object.keys(lwMap), ...Object.keys(lyMap)])]
    .map(Number)
    .filter((id) => !twMap[id]);
  const inactive: DeptRow[] = inactiveIds
    .map((id) => {
      const lw = lwMap[id];
      const ly = lyMap[id];
      const lwNet = lw?.net ?? 0;
      const lyNet = ly?.net ?? 0;
      return {
        id,
        // `sub_sales` only names a department on a row it returned, so the
        // name comes off whichever comparison week has one.
        desc:
          subSalesWk2.find((s) => s.sub_department === id)
            ?.sub_department_description ??
          subSalesWk3.find((s) => s.sub_department === id)
            ?.sub_department_description ??
          String(id),
        tw: 0,
        lw: lwNet,
        ly: lyNet,
        hasLW: lwNet > 0,
        hasLY: lyNet > 0,
        vsLWPct: lwNet ? -100 : 0,
        vsLYPct: lyNet ? -100 : 0,
        vsLWQtyPct: lw?.qty ? -100 : 0,
        vsLYQtyPct: ly?.qty ? -100 : 0,
        qty: 0,
        lwQty: lw?.qty ?? 0,
        lyQty: ly?.qty ?? 0,
        digital: 0,
        lyDigital: ly?.digital ?? 0,
        elecInstore: 0,
        lyElecInstore: ly?.elecInstore ?? 0,
        elecStore: 0,
        lyElecStore: ly?.elecStore ?? 0,
        storeCpn: 0,
        lyStoreCpn: ly?.storeCpn ?? 0,
      };
    });

  const sorted = [...twRows, ...inactive].sort((a, b) => {
    const rankDiff =
      severityRank(deptSeverity(a, coverage, threshold, gradingMetric)) -
      severityRank(deptSeverity(b, coverage, threshold, gradingMetric));
    if (rankDiff !== 0) return rankDiff;
    const ap = isQty
      ? basisPct(deptBasis(a, coverage), a.vsLWQtyPct, a.vsLYQtyPct)
      : basisPct(deptBasis(a, coverage), a.vsLWPct, a.vsLYPct);
    const bp = isQty
      ? basisPct(deptBasis(b, coverage), b.vsLWQtyPct, b.vsLYQtyPct)
      : basisPct(deptBasis(b, coverage), b.vsLWPct, b.vsLYPct);
    // Ungraded: nothing to rank by, so biggest department first.
    return ap === null || bp === null ? b.tw - a.tw : ap - bp;
  });

  return { rows: sorted, coverage };
};

/** Sub dept opens ascending (it is an identifier); the measures open with the
 *  biggest number. Tri-state either way: first click, reverse, off. */
export const nextDeptSort = (
  prev: DeptSortState,
  column: DeptSortColumn,
): DeptSortState => {
  const first: "desc" | "asc" = column === "dept" ? "asc" : "desc";
  if (prev?.column !== column) return { column, direction: first };
  if (prev.direction === first)
    return { column, direction: first === "desc" ? "asc" : "desc" };
  return null;
};

export const deptSortValue = (
  row: DeptRow,
  column: DeptSortColumn,
  isQty: boolean,
) =>
  column === "dept"
    ? row.id
    : column === "ty"
      ? isQty
        ? row.qty
        : row.tw
      : column === "vsLW"
        ? isQty
          ? row.vsLWQtyPct
          : row.vsLWPct
        : isQty
          ? row.vsLYQtyPct
          : row.vsLYPct;

export const sortDeptRows = (
  rows: DeptRow[],
  sort: DeptSortState,
  isQty: boolean,
) =>
  sort
    ? [...rows].sort((a, b) => {
        const diff =
          deptSortValue(a, sort.column, isQty) -
          deptSortValue(b, sort.column, isQty);
        return sort.direction === "desc" ? -diff : diff;
      })
    : rows;

export const nextItemSort = (
  prev: ItemSortState,
  column: ItemSortColumn,
): ItemSortState => {
  if (prev?.column !== column) return { column, direction: "desc" };
  if (prev.direction === "desc") return { column, direction: "asc" };
  return null;
};

// Nulls (no data for that period, e.g. an inactive item's TY or an item with
// no LW/LY match) always sort last, whichever the direction.
const itemSortValue = (item: GradedItem, column: ItemSortColumn) =>
  column === "ty"
    ? item.hasTY === false
      ? null
      : item.tyNet
    : column === "lw"
      ? item.lwNet
      : item.lyNet;

export const sortItems = (items: GradedItem[], sort: ItemSortState) =>
  sort
    ? [...items].sort((a, b) => {
        const av = itemSortValue(a, sort.column);
        const bv = itemSortValue(b, sort.column);
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        const diff = av - bv;
        return sort.direction === "desc" ? -diff : diff;
      })
    : items;

/** The items matching a UPC or description search. */
export const searchItems = (items: GradedItem[], text: string) => {
  const q = text.trim().toLowerCase();
  return q
    ? items.filter(
        (i) =>
          String(i.upc).toLowerCase().includes(q) ||
          String(i.desc).toLowerCase().includes(q),
      )
    : items;
};
