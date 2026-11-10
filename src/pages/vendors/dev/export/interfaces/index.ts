// Interfaces
import type { AggFn } from "../../../../../utils/csvExport";
import type { SubDeptMargin } from "../../../../../interfaces";
import type { VendorMetric, VendorRow } from "../../utils";

export type ExportPreset =
  | "vendors"
  | "items"
  | "items_graded"
  | "all_vendors"
  | "upc_list";
export type ModalMode = "presets" | "custom";
export type CustomSource = "tw" | "lw" | "ly";

export interface MetricSelection {
  fn: AggFn;
  enabled: boolean;
}

export interface VendorExportProps {
  onClose: () => void;
  storeName: string;
  vendorName: string;
  dateRange: string;
  /** Every vendor — the left panel's list. */
  rows: VendorRow[];
  /** Item rows for the open vendor only. */
  vendorRaw: { tw: SubDeptMargin[]; lw: SubDeptMargin[]; ly: SubDeptMargin[] };
  /** Item rows for every vendor — the search already holds them, which is what
   *  makes the all-vendors preset free. */
  allRaw: { tw: SubDeptMargin[]; lw: SubDeptMargin[]; ly: SubDeptMargin[] };
  metric: VendorMetric;
  threshold: number;
  itemThreshold: number;
  weekDates: string[];
  selectedDay: string | null;
}
