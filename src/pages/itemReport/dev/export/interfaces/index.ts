// Interfaces
import type { ActionKind } from "../../interfaces";

export type ModalMode = "presets" | "custom";
export type Source = "items" | "eras" | "receipts" | "summary";

/** Which narrowing control a preset offers. Declared per preset rather than
 *  shown always — a vendor packet has no use for a department picker, and an
 *  unexplained control is one more thing to get wrong. */
export type FilterKind = "vendor" | "dept";

/**
 * A preset is a recipient, not a table.
 *
 * The three that were here answered "which grain do you want" — items, price
 * periods, receipts — which is a question only someone who built the page would
 * ask. Everyone else is sending this to a person: a vendor, a buyer, whoever
 * sets retails, a district manager. So a preset now carries who it is for, the
 * rows that person needs, and only the columns they should see.
 *
 * That last part is not cosmetic. The vendor packet deliberately omits cost and
 * margin: the easiest way to send a supplier a list must not also send them
 * what you make on it.
 */
export interface Preset {
  key: string;
  title: string;
  /** Who it is for and what they do with it. Shown under the title. */
  blurb: string;
  source: Source;
  /** Rows kept. Undefined means every action. */
  actions?: ActionKind[];
  /** Column keys in file order. */
  cols: string[];
  filters: FilterKind[];
}

export type Row = Record<string, string | number>;

export interface Col {
  key: string;
  label: string;
  defaultOn: boolean;
}
