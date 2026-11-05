import type { AggFn } from "../../../../../../utils/csvExport";

export type ExportDataset =
  | "subdept"
  | "deptgrid"
  | "hourly"
  | "summary"
  | "items"
  | "dailyrecap"
  | "financials";

export type ItemSev = "critical" | "watch" | "healthy";
export type ModalMode = "presets" | "custom";
export type CustomSource = "subdept" | "hourly";

export interface DimDef {
  key: string;
  label: string;
}
export interface MetricDef {
  key: string;
  label: string;
}
export interface MetricSelection {
  fn: AggFn;
  enabled: boolean;
}
