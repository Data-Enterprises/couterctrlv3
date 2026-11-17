// Hooks
import { useMemo } from "react";
import { useItemReportCtx } from "../../hooks";

// Utils
import { ACTION_RANK } from "../../utils/verdict";

// Interfaces
import type { SheetRow } from "../../interfaces";

/**
 * The sheet's menus and its visible rows. The department and vendor menus are
 * taken from the rows rather than a fixed list, so neither offers a choice
 * with nothing behind it. Rows sort action first, then money: the biggest loss
 * inside the worst pile.
 */
export const useSheetRows = (rows: SheetRow[]) => {
  // Filters live in the slice with everything else. A route change would
  // otherwise silently reset which pile someone was working through.
  const {
    actionFilter: only,
    upcFilter: upcTerm,
    descFilter: descTerm,
    deptFilter: dept,
    vendorFilter: vendor,
  } = useItemReportCtx();

  const [deptOpts, vendorOpts] = useMemo(() => {
    const depts = new Set<string>();
    const vendors = new Set<string>();
    for (const r of rows) {
      if (r.item.department) depts.add(r.item.department);
      if (r.item.vendorName) vendors.add(r.item.vendorName);
    }
    const opts = (set: Set<string>) =>
      [...set]
        .sort((a, b) => a.localeCompare(b))
        .map((v) => ({ label: v, value: v }));
    return [opts(depts), opts(vendors)];
  }, [rows]);

  const upcQ = upcTerm.trim();
  const descQ = descTerm.trim().toLowerCase();
  const visible = useMemo(() => {
    const matched = rows.filter((r) => {
      if (only && r.verdict.action !== only) return false;
      if (dept && r.item.department !== dept) return false;
      if (vendor && r.item.vendorName !== vendor) return false;
      if (upcQ && !r.item.productCode.includes(upcQ)) return false;
      if (descQ && !r.item.description.toLowerCase().includes(descQ))
        return false;
      return true;
    });
    return [...matched].sort(
      (a, b) =>
        ACTION_RANK[a.verdict.action] - ACTION_RANK[b.verdict.action] ||
        b.item.ty.sales - a.item.ty.sales,
    );
  }, [rows, only, upcQ, descQ, dept, vendor]);

  return { deptOpts, vendorOpts, visible };
};
