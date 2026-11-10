// Utils
import {
  getRowMetric,
  type ItemMarginRow,
  type RowMetricKey,
  type ItemGradingMetric,
} from "../../../../../../utils/itemMargins";
import { PRICED_UNITS_LABEL } from "../../../../../../utils/pricedUnits";

// Interfaces
import type { CSSProperties } from "react";
import type { SubDeptMargin } from "../../../../../../interfaces";
import type { ColSort, ReportRow } from "../interfaces";

export const colInputStyle: CSSProperties = {
  width: "100%",
  fontSize: 11,
  border: "1px solid rgb(var(--color-brand-navy) / 0.15)",
  borderRadius: 4,
  padding: "4px 7px",
  outline: "none",
  color: "var(--color-text-primary)",
  background: "rgb(var(--color-brand-navy) / 0.03)",
};

export const byDate = (src: SubDeptMargin[], dateStr: string) =>
  src.filter((m) => m.sale_date.split("T")[0] === dateStr);

/** Header sort: desc, then asc, then off. */
export const nextColSort = (prev: ColSort, col: "ty" | "lw" | "ly"): ColSort => {
  if (prev?.col !== col) return { col, dir: "desc" };
  if (prev.dir === "desc") return { col, dir: "asc" };
  return null;
};

export const getColSortValue = (
  item: ItemMarginRow,
  col: "ty" | "lw" | "ly",
  activeMetric: RowMetricKey,
) => {
    if (activeMetric === "margin") {
      return col === "ty"
        ? item.tyMarginPct
        : col === "lw"
          ? (item.lwMarginPct ?? -999)
          : (item.lyMarginPct ?? -999);
    }
    return col === "ty"
      ? item.netSales
      : col === "lw"
        ? (item.lwNetSales ?? -999)
        : (item.lyNetSales ?? -999);
};

const REPORT_ROW_LABELS: Record<
  "margin" | "contribution" | "sales" | "qty",
  string
> = {
  margin: "Margin",
  contribution: "Contribution",
  sales: "Sales",
  // Names both units: the row prints pounds on a scale item and a count on
  // everything else, and a bare "Qty" made the pounds look like a count.
  qty: PRICED_UNITS_LABEL,
};

/** The item report's rows, the graded metric first. */
export const buildReportRows = (
  selectedItem: ItemMarginRow | null,
  gradingMetric: ItemGradingMetric,
): ReportRow[] =>
  !selectedItem
? []
: (gradingMetric === "margin"
    ? (["margin", "contribution", "sales", "qty"] as const)
    : (["sales", "contribution", "margin", "qty"] as const)
  ).map((key) => {
    const m = getRowMetric(selectedItem, key);
    return {
      key,
      label: REPORT_ROW_LABELS[key],
      ty: m.tyDisplay,
      lw: m.lwColorPct,
      ly: m.lyColorPct,
      lwDisplay: m.lwDisplay,
      lyDisplay: m.lyDisplay,
      isPts: key === "margin" || key === "contribution",
      // Missing days: the figure shows, without a verdict colour.
      lwPartial: !selectedItem.lwComplete,
      lyPartial: !selectedItem.lyComplete,
    };
  });
