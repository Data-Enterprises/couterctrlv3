import type { AggFn } from "../../../../../../utils/csvExport";

export type ModalMode = "presets" | "custom";

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
