// Interfaces
import type { ProductSummary } from "../../interfaces";

export type ModalMode = "presets" | "custom";

export type Source = "groups" | "items" | "prices" | "transactions";

/** A group's items, already rolled up. The department page has one of these at
 *  a time; the vendor page has every one of them, since its rows are all in
 *  hand from the start. */
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
