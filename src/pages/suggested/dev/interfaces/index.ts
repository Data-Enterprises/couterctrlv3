// Interfaces
import type { AggFn } from "../../../../utils/csvExport";

/** One line of the bar tooltip: a label, its value, dimmed when soft. */
export interface BarTooltipRow {
  label: string;
  value: string;
  /** Dimmed, for the supporting line under the headline figure. */
  soft?: boolean;
}

/** The Not selling table's sortable columns. */
export type NotSellingSortCol = "prior" | "recent" | "change" | "lost";

/** The order sheet's sortable columns. */
export type OrderSheetSortCol = "daily" | "demand" | "waste" | "markdown" | "order";

/** The export's mode and its presets. */
export type ModalMode = "presets" | "custom";
export type PresetId =
  | "storeOrder"
  | "actions"
  | "sheet"
  | "production"
  | "notSelling"
  | "rollup";

/** Whether a custom export's metric is on, and how it combines. */
export interface MetricSelection {
  fn: AggFn;
  enabled: boolean;
}

/** The Top to order list's sortable columns. */
export type TopToOrderSortCol = "daily" | "order";
