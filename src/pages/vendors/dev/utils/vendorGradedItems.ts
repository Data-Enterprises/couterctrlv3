// Utils
import {
  buildItemRows,
  getItemSeverity,
  type ItemGradingMetric,
} from "../../../../utils/itemMargins";
import { LW_OFFSET, LY_OFFSET, shiftIso } from "../../../../utils/grading";
import { rowsForVendor } from "./index";

// Interfaces
import type { SubDeptMargin } from "../../../../interfaces";
import type { VendorRow } from "./index";
import type { GradedItem, GradedSev } from "../interfaces";

/**
 * Which graded items a vendor contributes, and in what order.
 *
 * Extracted from the export modal so the "view critical report" button selects
 * from the same place — see the note on the Sub Dept Margins twin.
 *
 * Each item carries its own department, which matters more here than it does
 * there: a vendor's range routinely spans several sub departments, and that set
 * is what narrows the fan-out when the list is handed to Item Actions.
 */

export const collectGradedItems = (
  rows: VendorRow[],
  raw: { tw: SubDeptMargin[]; lw: SubDeptMargin[]; ly: SubDeptMargin[] },
  threshold: number,
  gradingMetric: ItemGradingMetric,
  sevs: Set<GradedSev>,
): GradedItem[] => {
  const sevRank: Record<GradedSev, number> = {
    critical: 0,
    watch: 1,
    healthy: 2,
  };
  const out: GradedItem[] = [];

  for (const v of rows) {
    const tw = rowsForVendor(raw.tw, v.vendorId);
    if (tw.length === 0) continue;
    // Sub department isn't on the built item row, so it comes off the source
    // rows — an item sells under one department, so first match is the answer.
    const deptOf = new Map<string, string>();
    for (const m of tw) {
      if (!deptOf.has(m.product_code))
        deptOf.set(m.product_code, m.sub_department_description);
    }

    const built = buildItemRows(
      tw,
      rowsForVendor(raw.lw, v.vendorId),
      rowsForVendor(raw.ly, v.vendorId),
      {
        lwOf: (d) => shiftIso(d, LW_OFFSET),
        lyOf: (d) => shiftIso(d, LY_OFFSET),
        coverage: v.coverage,
      },
    );
    const kept: GradedItem[] = [];
    for (const r of built) {
      const sev = getItemSeverity(r, threshold, gradingMetric);
      if (sev === "ungraded" || !sevs.has(sev)) continue;
      kept.push({
        vendorId: v.vendorId,
        vendorName: v.vendorName,
        dept: deptOf.get(r.productCode) ?? "",
        r,
        sev,
      });
    }
    // Worst first inside a vendor, then biggest sellers — the order someone
    // works a list in.
    kept.sort(
      (a, b) => sevRank[a.sev] - sevRank[b.sev] || b.r.netSales - a.r.netSales,
    );
    out.push(...kept);
  }
  return out;
};
