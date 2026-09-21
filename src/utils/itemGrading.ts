import type { SubDeptMargin } from "../interfaces";
import type { GradingMetric } from "../features/salesLedgerSlice";
import { gradeSeverity, type Severity } from "./severity";
import { gradeBasis, matchDatedRows, type Coverage } from "./grading";

/**
 * How Sales grades an item, and how raw rows become one.
 *
 * Pulled out of `PopupSubDeptList` so the store-wide "view critical report"
 * button can grade with the same rule the open department already grades with.
 * Two copies of this would drift, and the two lists disagreeing about which
 * items are critical is precisely the confusion the button exists to remove.
 *
 * Worth being explicit: this is **not** the same definition Sub Dept Margins
 * and Vendors use. They grade on margin or sales via `getItemSeverity`; Sales
 * grades on net sales or units against its own `itemThreshold`. The two answer
 * different questions and are both right — which is why the report labels where
 * a list came from and how it was graded.
 */

export type Top10Item = {
  productCode: string;
  upc: string;
  desc: string;
  tyNet: number;
  tyQty: number;
  tyWeight: number;
  lwNet: number | null;
  lwQty: number | null;
  lwWeight: number | null;
  lyNet: number | null;
  lyQty: number | null;
  lyWeight: number | null;
  /** This year over only the days that matched each comparison. Without these
   *  an item's whole week was divided by last year's matched days — seven
   *  against three for store 590 — which inverts the sign as easily as it
   *  exaggerates. Absent on rows with no TY (the inactive list). */
  tyNetForLW?: number;
  tyQtyForLW?: number;
  tyNetForLY?: number;
  tyQtyForLY?: number;
};

/**
 * Day-matched TY maps and the store's coverage, for building Top10Items.
 *
 * `lw`/`ly` must already be the matched-date rows. Coverage is taken on the
 * dates across all rows, not per item: an item that didn't sell on a day is a
 * zero, not a gap.
 */
export const matchItemRows = (
  ty: SubDeptMargin[],
  lw: SubDeptMargin[],
  ly: SubDeptMargin[],
) => {
  const { twForLW, twForLY, coverage } = matchDatedRows(ty, lw, ly);
  return {
    tyForLW: aggregateByCode(twForLW),
    tyForLY: aggregateByCode(twForLY),
    coverage,
  };
};

export const aggregateByCode = (
  items: SubDeptMargin[],
): Map<string, { desc: string; net: number; qty: number; weight: number }> => {
  const map = new Map<
    string,
    { desc: string; net: number; qty: number; weight: number }
  >();
  for (const item of items) {
    // product_code is typed as string but the API doesn't always send it as
    // one (numeric UPCs come back as a JSON number on some queries) — coerce
    // here so every downstream .toLowerCase()/string usage is safe.
    const code = String(item.product_code);
    const ex = map.get(code);
    if (ex) {
      ex.net += item.total_sales - item.total_tax;
      ex.qty += item.qty;
      ex.weight += item.weight;
    } else {
      map.set(code, {
        desc: item.product_description,
        net: item.total_sales - item.total_tax,
        qty: item.qty,
        weight: item.weight,
      });
    }
  }
  return map;
};

export const itemSeverity = (
  item: Top10Item,
  threshold: number,
  metric: GradingMetric,
  /** The store's coverage. Last year grades only when it covers every day,
   *  else last week when that does, else the item isn't graded. */
  coverage: Coverage,
): Severity | null => {
  const isSales = metric === "sales";
  const tyLY = isSales ? (item.tyNetForLY ?? item.tyNet) : (item.tyQtyForLY ?? item.tyQty);
  const tyLW = isSales ? (item.tyNetForLW ?? item.tyNet) : (item.tyQtyForLW ?? item.tyQty);
  const lyRef = isSales ? item.lyNet : item.lyQty;
  const lwRef = isSales ? item.lwNet : item.lwQty;
  const lyPct = lyRef !== null && lyRef > 0 ? ((tyLY - lyRef) / lyRef) * 100 : null;
  const lwPct = lwRef !== null && lwRef > 0 ? ((tyLW - lwRef) / lwRef) * 100 : null;
  const basis = gradeBasis({ hasLY: lyPct !== null, hasLW: lwPct !== null }, coverage);
  // Noise on these sums is absorbed by gradeSeverity's epsilon.
  return basis === "LY"
    ? gradeSeverity(lyPct as number, threshold)
    : basis === "LW"
      ? gradeSeverity(lwPct as number, threshold)
      : null;
};

/**
 * Every critical item in a set of raw rows, with the department it sells under.
 *
 * Aggregation is per department, not store-wide, because the same product code
 * can appear under more than one department and the report needs the one it
 * actually sold in. The department also narrows the report's fan-out on the
 * far side.
 */
export const collectCriticalItems = (
  ty: SubDeptMargin[],
  lw: SubDeptMargin[],
  ly: SubDeptMargin[],
  threshold: number,
  metric: GradingMetric,
): { productCode: string; dept: string }[] => {
  const byDept = (rows: SubDeptMargin[]) => {
    const m = new Map<string, SubDeptMargin[]>();
    for (const r of rows) {
      const key = r.sub_department_description ?? "";
      const found = m.get(key);
      if (found) found.push(r);
      else m.set(key, [r]);
    }
    return m;
  };

  const tyByDept = byDept(ty);
  const lwByDept = byDept(lw);
  const lyByDept = byDept(ly);
  // The store's coverage, once, from every row.
  const { coverage } = matchDatedRows(ty, lw, ly);

  const out: { productCode: string; dept: string }[] = [];
  for (const [dept, tyRows] of tyByDept) {
    const tyMap = aggregateByCode(tyRows);
    const lwMap = aggregateByCode(lwByDept.get(dept) ?? []);
    const lyMap = aggregateByCode(lyByDept.get(dept) ?? []);
    const { tyForLW, tyForLY } = matchItemRows(
      tyRows,
      lwByDept.get(dept) ?? [],
      lyByDept.get(dept) ?? [],
    );

    for (const [code, tw] of tyMap) {
      const lwEntry = lwMap.get(code) ?? null;
      const lyEntry = lyMap.get(code) ?? null;
      const item: Top10Item = {
        productCode: code,
        upc: code,
        desc: tw.desc,
        tyNet: tw.net,
        tyQty: tw.qty,
        tyWeight: tw.weight,
        lwNet: lwEntry ? lwEntry.net : null,
        lwQty: lwEntry ? lwEntry.qty : null,
        lwWeight: lwEntry ? lwEntry.weight : null,
        lyNet: lyEntry ? lyEntry.net : null,
        lyQty: lyEntry ? lyEntry.qty : null,
        lyWeight: lyEntry ? lyEntry.weight : null,
        tyNetForLW: tyForLW.get(code)?.net ?? 0,
        tyQtyForLW: tyForLW.get(code)?.qty ?? 0,
        tyNetForLY: tyForLY.get(code)?.net ?? 0,
        tyQtyForLY: tyForLY.get(code)?.qty ?? 0,
      };
      if (itemSeverity(item, threshold, metric, coverage) === "critical")
        out.push({ productCode: code, dept });
    }
  }
  return out;
};
