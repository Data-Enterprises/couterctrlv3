import type { SubSale } from "../../../../interfaces";
import type { GradingMetric } from "../../../../features/dev/devSalesLedgerSlice";

/**
 * Every store against every department, on one scale.
 *
 * The question before "why is this store behind" is "which store, and where".
 * A grid of dollars cannot answer it: Grocery is twenty times Hot Deli at every
 * store, so the biggest numbers are always in the same column and nothing
 * stands out. Indexing fixes that — each cell is divided by what that store
 * would have done in that department at its own usual weight, so 100 means it
 * pulled exactly that and every department sits on the same scale.
 *
 *     expected = the group's week in D  x  this store's usual share of D
 *     index    = ty / expected x 100
 *
 * It is the same arithmetic `storeComparison` does for a whole store, run per
 * department instead. A store that is reliably 8% of the group's Deli is not
 * failing for being small, and the index says so.
 *
 * Pure: no fetch, no component, no slice.
 */

export type Basis = "LY" | "LW" | null;

export interface Cell {
  storeid: number;
  storeNumber: string;
  subDept: number;
  ty: number;
  lw: number;
  ly: number;
  basis: Basis;
  /** The group's week at this store's usual share of this department. */
  expected: number | null;
  /** `ty / expected * 100`, rounded. Null where there is no basis to measure
   *  against — a blank cell, never a zero, because zero is a result. */
  index: number | null;
}

export interface DeptColumn {
  subDept: number;
  name: string;
  /** Every counted store's week, summed. Sums, never a mean of each store's
   *  index: one small store at 300 must not move the column. */
  groupTy: number;
  /** The whole group against its own expected, which is 100 by construction
   *  unless stores were set aside — so a column average below 100 means the
   *  stores that could not be measured were the ones carrying it. */
  index: number | null;
}

export interface StoreRow {
  storeid: number;
  storeNumber: string;
  storeName: string;
  cells: Map<number, Cell>;
  /** This store across every department it could be measured in. */
  index: number | null;
}

export interface Matrix {
  columns: DeptColumn[];
  rows: StoreRow[];
  /** Cells with no basis, counted so the screen can say how many rather than
   *  leaving blanks to read as a bug. */
  blanks: number;
}

const value = (r: SubSale, metric: GradingMetric) =>
  metric === "qty" ? r.qty : r.total_sales - r.total_tax;

const key = (storeid: number, storeNumber: string, subDept: number) =>
  `${storeid}__${storeNumber}__${subDept}`;

interface Bucket {
  storeid: number;
  storeNumber: string;
  storeName: string;
  subDept: number;
  subDeptName: string;
  total: number;
  days: Set<string>;
}

/** Rows arrive one per store, department and DAY. */
const bucket = (rows: SubSale[], metric: GradingMetric) => {
  const out = new Map<string, Bucket>();
  rows.forEach((r) => {
    const k = key(r.storeid, r.store_number, r.sub_department);
    let b = out.get(k);
    if (!b) {
      b = {
        storeid: r.storeid,
        storeNumber: r.store_number,
        storeName: r.store_name,
        subDept: r.sub_department,
        subDeptName: r.sub_department_description,
        total: 0,
        days: new Set(),
      };
      out.set(k, b);
    }
    b.total += value(r, metric);
    b.days.add(r.sale_date);
  });
  return out;
};

/**
 * Which comparison a cell is measured against.
 *
 * Last year, but only when it covers as many days as this week does;
 * otherwise last week on the same test; otherwise the cell is not measured at
 * all. A short comparison period understates the usual share, which would
 * make a store that was shut on Monday last year look like it is winning now.
 *
 * The same ladder `gradeBasis` climbs for a whole store, on a department's
 * day coverage rather than a store's.
 */
export interface Period {
  days: number;
  total: number;
}

export const basisFor = (
  twDays: number,
  lw: Period | undefined,
  ly: Period | undefined,
): Basis => {
  if (ly && ly.days >= twDays && ly.total > 0) return "LY";
  if (lw && lw.days >= twDays && lw.total > 0) return "LW";
  return null;
};

export interface Input {
  tw: SubSale[];
  lw: SubSale[];
  ly: SubSale[];
  metric: GradingMetric;
}

export const buildMatrix = ({ tw, lw, ly, metric }: Input): Matrix => {
  const bTw = bucket(tw, metric);
  const bLw = bucket(lw, metric);
  const bLy = bucket(ly, metric);

  // Departments and stores both come from THIS week: a department nobody sold
  // anything in this week is not a column anyone needs, and a store that did
  // not trade is not a row to grade.
  const deptNames = new Map<number, string>();
  const storeOf = new Map<string, { storeid: number; storeNumber: string; storeName: string }>();
  bTw.forEach((b) => {
    deptNames.set(b.subDept, b.subDeptName);
    storeOf.set(`${b.storeid}__${b.storeNumber}`, {
      storeid: b.storeid,
      storeNumber: b.storeNumber,
      storeName: b.storeName,
    });
  });

  const stores = [...storeOf.values()].sort((a, b) =>
    a.storeNumber.localeCompare(b.storeNumber),
  );
  const depts = [...deptNames.entries()].sort((a, b) => a[0] - b[0]);

  // Every cell's basis first: expected depends on the group's basis total,
  // which can only be summed over the cells that HAVE one.
  const basisOf = new Map<string, Basis>();
  const twDaysOf = new Map<string, number>();

  stores.forEach((s) => {
    depts.forEach(([d]) => {
      const k = key(s.storeid, s.storeNumber, d);
      const twDays = bTw.get(k)?.days.size ?? 0;
      twDaysOf.set(k, twDays);
      const as = (b: Bucket | undefined): Period | undefined =>
        b && { days: b.days.size, total: b.total };
      basisOf.set(k, twDays === 0 ? null : basisFor(twDays, as(bLw.get(k)), as(bLy.get(k))));
    });
  });

  const basisValue = (k: string): number => {
    const b = basisOf.get(k);
    if (b === "LY") return bLy.get(k)?.total ?? 0;
    if (b === "LW") return bLw.get(k)?.total ?? 0;
    return 0;
  };

  let blanks = 0;

  // Only cells that CAN be measured contribute to either total. A store with
  // no history in a department would otherwise shrink every other store's
  // expected by its own weight and lift the whole column.
  const groupBy = new Map<number, { ty: number; basis: number }>();
  depts.forEach(([d]) => {
    let ty = 0;
    let basis = 0;
    stores.forEach((s) => {
      const k = key(s.storeid, s.storeNumber, d);
      if (basisOf.get(k) === null) return;
      ty += bTw.get(k)?.total ?? 0;
      basis += basisValue(k);
    });
    groupBy.set(d, { ty, basis });
  });

  const columns: DeptColumn[] = depts.map(([subDept, name]) => {
    const g = groupBy.get(subDept) ?? { ty: 0, basis: 0 };
    return { subDept, name, groupTy: g.ty, index: g.basis > 0 ? 100 : null };
  });

  const rows: StoreRow[] = stores.map((s) => {
    const cells = new Map<number, Cell>();
    let rowTy = 0;
    let rowExpected = 0;

    depts.forEach(([d]) => {
      const k = key(s.storeid, s.storeNumber, d);
      const ty = bTw.get(k)?.total ?? 0;
      const basis = basisOf.get(k) ?? null;
      const g = groupBy.get(d) ?? { ty: 0, basis: 0 };

      let expected: number | null = null;
      if (basis !== null && g.basis > 0) {
        expected = g.ty * (basisValue(k) / g.basis);
      }

      const index =
        expected !== null && expected > 0 ? Math.round((ty / expected) * 100) : null;
      if (index === null) blanks++;
      if (expected !== null && expected > 0) {
        rowTy += ty;
        rowExpected += expected;
      }

      cells.set(d, {
        storeid: s.storeid,
        storeNumber: s.storeNumber,
        subDept: d,
        ty,
        lw: bLw.get(k)?.total ?? 0,
        ly: bLy.get(k)?.total ?? 0,
        basis,
        expected,
        index,
      });
    });

    return {
      ...s,
      cells,
      // Summed, then compared — never the mean of the row's indices, which
      // would let Hot Deli at 180 cancel Grocery at 62.
      index: rowExpected > 0 ? Math.round((rowTy / rowExpected) * 100) : null,
    };
  });

  return { columns, rows, blanks };
};

/** Is this cell far enough from 100 to be worth opening? The page's own
 *  threshold, in points, because an index IS a percentage of expected. */
export const flagged = (index: number | null, band: number): boolean =>
  index !== null && Math.abs(index - 100) > band;

/**
 * Who to put a struggling store beside.
 *
 * The matrix answers store-and-department; the investigation needs a second
 * store. The most useful counterpart is whoever is doing that department
 * BEST — "here is who to copy" is a more actionable screen than "here is
 * another store roughly as bad as you".
 *
 * Null when nobody else can be measured in that department, in which case
 * there is no comparison to offer rather than a worst-of-a-bad-lot one.
 */
export const bestIn = (
  matrix: Matrix,
  subDept: number,
  exclude: { storeid: number; storeNumber: string },
): StoreRow | null => {
  const others = matrix.rows.filter(
    (r) =>
      !(r.storeid === exclude.storeid && r.storeNumber === exclude.storeNumber) &&
      (r.cells.get(subDept)?.index ?? null) !== null,
  );
  if (!others.length) return null;
  return others.reduce((best, r) =>
    (r.cells.get(subDept)?.index ?? 0) > (best.cells.get(subDept)?.index ?? 0)
      ? r
      : best,
  );
};
