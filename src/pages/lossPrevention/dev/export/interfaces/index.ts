// Interfaces
import type { AggFn } from "../../../../../utils/csvExport";

/** The export's mode, its preset datasets and its custom sources. */
export type ModalMode = "presets" | "custom";
export type ExportDataset = "transactions" | "cashiers";
export type CustomSource = "transactions" | "cashiers";

/** A custom export's dimension and metric choices, and whether a metric is on and how it combines. */
export interface DimDef    { key: string; label: string }
export interface MetricDef { key: string; label: string }
export interface MetricSelection { fn: AggFn; enabled: boolean }
