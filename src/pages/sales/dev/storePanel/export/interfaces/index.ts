// Interfaces
import type { AggFn } from "../../../../../../utils/csvExport";
import type { RecapItem } from "../../summary/interfaces/index";

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

/** One day for the export: its items, and whether they could be read. */
export interface WeekDayItems {
  date: string;
  items: RecapItem[];
  failed?: true;
}
