// Interfaces
import type { AggFn } from "../../../../utils/csvExport";

/** How the coupon list is grouped, desktop and mobile alike. */
export type GroupTab = "subdept" | "date" | "cashier";

/** The export's two modes. */
export type ModalMode = "presets" | "custom";

export interface MetricSelection {
  fn: AggFn;
  enabled: boolean;
}
