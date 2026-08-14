import type { SubDeptMargin } from "../../../interfaces";
import type { GradingMetric } from "../../../features/salesLedgerSlice";
import type { Severity } from "./LedgerRow";
import { gradeSeverity } from "../../../utils/severity";

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
): Severity => {
  const lyPct =
    metric === "sales"
      ? item.lyNet !== null && item.lyNet > 0
        ? ((item.tyNet - item.lyNet) / item.lyNet) * 100
        : null
      : item.lyQty !== null && item.lyQty > 0
        ? ((item.tyQty - item.lyQty) / item.lyQty) * 100
        : null;
  const lwPct =
    metric === "sales"
      ? item.lwNet !== null && item.lwNet > 0
        ? ((item.tyNet - item.lwNet) / item.lwNet) * 100
        : null
      : item.lwQty !== null && item.lwQty > 0
        ? ((item.tyQty - item.lwQty) / item.lwQty) * 100
        : null;
  // Noise on these sums is absorbed by gradeSeverity's epsilon. Rounding to
  // 1dp here also shifted the threshold boundary; see PCT_EPSILON.
  return gradeSeverity(lyPct ?? lwPct ?? 0, threshold);
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

  const out: { productCode: string; dept: string }[] = [];
  for (const [dept, tyRows] of tyByDept) {
    const tyMap = aggregateByCode(tyRows);
    const lwMap = aggregateByCode(lwByDept.get(dept) ?? []);
    const lyMap = aggregateByCode(lyByDept.get(dept) ?? []);

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
      };
      if (itemSeverity(item, threshold, metric) === "critical")
        out.push({ productCode: code, dept });
    }
  }
  return out;
};
