// Interfaces
import type { AggFn } from "../../../../../utils/csvExport";
import type { CatItem, CatSalesHourly } from "../../../../../interfaces";
import type { CategoryMetric, CategoryRow } from "../../utils";

export type ExportPreset = "categories" | "items" | "items_graded" | "hours";
export type ModalMode = "presets" | "custom";
export type CustomSource = "tw" | "lw" | "ly";
export type GradedSev = "critical" | "watch" | "healthy";

export interface MetricSelection {
  fn: AggFn;
  enabled: boolean;
}

export interface CategoryExportProps {
  onClose: () => void;
  storeName: string;
  categoryName: string;
  dateRange: string;
  /** Every category — the left panel's list. */
  rows: CategoryRow[];
  /** Item rows for the open category only. */
  items: { tw: CatItem[]; lw: CatItem[]; ly: CatItem[] };
  /** Hourly rows for the open category, empty until the Hours tab is opened. */
  hourly: { tw: CatSalesHourly[]; lw: CatSalesHourly[]; ly: CatSalesHourly[] };
  metric: CategoryMetric;
  /** Grades the category list. */
  threshold: number;
  /** Grades the item list — the same figure the Items tab is showing. */
  itemThreshold: number;
  /** This week's dates, in order — the day picker's options. */
  weekDates: string[];
  /** The day open in the panel, or null for the whole week. Seeds the picker so
   *  the file defaults to matching what's on screen. */
  selectedDay: string | null;
}
