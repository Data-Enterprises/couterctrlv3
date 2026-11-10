// Interfaces
import type { AggFn } from "../../../../../utils/csvExport";
import type { ItemGradingMetric } from "../../../../../utils/itemMargins";
import type { SubDept, SubDeptMargin } from "../../../../../interfaces";
import type { SubDeptGrade } from "../../../../../features/dev/devSubMarginSlice";

export type ExportPreset =
  | "items"
  | "items_vs_ly"
  | "cost"
  | "nocost"
  | "all_depts"
  | "upc_list";
export type ModalMode = "presets" | "custom";
export type CustomSource = "ty" | "ly";

export interface DimDef { key: string; label: string }
export interface MetricDef { key: string; label: string }
export interface MetricSelection { fn: AggFn; enabled: boolean }

export interface MarginPerfExportModalProps {
  onClose: () => void;
  storeName: string;
  subDeptName: string;
  dateRange: string;
  tyMargins: SubDeptMargin[];
  lyMargins: SubDeptMargin[];
  threshold: number;
  /** Every department in the current search, for the all-departments preset. */
  subDepts: SubDept[];
  /** Their grades, which already carry each department's TY/LW/LY item rows —
   *  so a store-wide export costs no extra calls. Fills in as grading finishes,
   *  which is why the preset says how many are in hand. */
  grades: Record<number, SubDeptGrade>;
  /** The page's Margin/Sales toggle. Severity has to mean here what it means on
   *  screen, so the export grades on the same metric rather than assuming one. */
  gradingMetric: ItemGradingMetric;
  loadingGrades: boolean;
}
