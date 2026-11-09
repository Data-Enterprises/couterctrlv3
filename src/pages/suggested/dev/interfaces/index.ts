// Interfaces
import type { ActionKey, SuggestedGroupRow } from "../../../../interfaces";
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

/**
 * One store's rollup across its departments.
 *
 * Built from the group rows rather than fetched: the group call already returns
 * every store x department pair, so a second call would be asking the same
 * question twice.
 */
export interface StoreRollup {
  storeid: number;
  /** Resolved through assignedStores, never the payload's own `store_name` —
   *  that goes null on rows whose department resolved fine, so the same store
   *  appears named and unnamed in one response. */
  label: string;
  storeNumber: string | null;
  suggested: number;
  items: number;
  departments: SuggestedGroupRow[];
}

/** One store's standing in a department, normalised. */
export interface BenchmarkRow {
  storeid: number;
  label: string;
  /** The department's whole-store rate, which is what the raw comparison uses. */
  lbPerDay: number;
  itemCount: number;
  /** lbPerDay / itemCount — the comparable figure. */
  lbPerItem: number;
}

/** One day of the cover window and what this item is forecast to do on it. */
export interface CoverDay {
  iso: string;
  /** "Fri 9/11". */
  label: string;
  lb: number;
}

/**
 * What an action is ABOUT, which decides how the popover frames it.
 *
 * The load-bearing distinction on this page, and it used to be a boolean called
 * `affectsOrder`. It is four values because "not this order" turned out to mean
 * three different things, and rendering all three as "about this item's
 * history" was wrong about two of them.
 *
 * `order` is the only one that says change the number on screen. The others
 * look BACKWARD at a quarter of buying while `suggested_weight` looks FORWARD
 * at a few days — they disagree on the same item without either being wrong,
 * so a buyer who reads "over-ordering" beside 313 lb and cuts it has been
 * misled by the UI, not by the data.
 */
export type ActionScope = "order" | "pattern" | "schedule" | "recording";

export interface SuggestedAction {
  key: ActionKey;
  /** Chip text. Short enough to sit under a product name. */
  label: string;
  tone: "critical" | "watch" | "neutral";
  scope: ActionScope;
  detail: string;
}
