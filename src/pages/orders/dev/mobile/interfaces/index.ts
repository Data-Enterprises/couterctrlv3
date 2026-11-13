// Interfaces
import type { AggFn } from "../../../../../utils/csvExport";

export interface DimDef { key: string; label: string }
export interface MetricDef { key: string; label: string }

export type OrderSelection = {
  storeid: number;
  storenumber: string;
  orderId: number;
};

export type ModalMode = "presets" | "custom";
export type ExportDataset = "all" | "selected" | "subDepts";

export interface MetricSelection {
  fn: AggFn;
  enabled: boolean;
}

export type MobileStep = "available" | "list";
