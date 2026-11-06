// Interfaces
import type { ProductSummary } from "../../interfaces";

export type ModalMode = "presets" | "custom";

export type Source = "groups" | "items" | "prices" | "transactions";

/** A group's items, rolled up: one at a time on the department page, every
 *  one on the vendor page. */
export interface ItemGroup {
  label: string;
  products: ProductSummary[];
}

/** Rows are pre-formatted string/number maps rather than typed records, so one
 *  column list and one cell lookup serve all four sources. */
export type Row = Record<string, string | number>;

export interface Col {
  key: string;
  label: string;
  defaultOn: boolean;
}
