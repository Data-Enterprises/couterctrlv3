// Interfaces
import type { TransactionListItem } from "../../../../../interfaces";

/** One figure in a rail row, with an optional tone class. */
export interface Cell {
  text: string;
  tone?: string;
}

/** How one rail section folds: its stable id, whether it is folded, and the
 *  toggle. Built in one place so the sections can't drift on the key. */
export interface Fold {
  id: string;
  collapsed: boolean;
  onToggle: () => void;
}

/** One transaction at the opened price: its scans summed. */
export interface SaleSummary {
  sale: TransactionListItem;
  qty: number;
  net: number;
  priceTypes: Set<string>;
}

/** One product in a basket: its scans summed, or its discount line. */
export interface BasketLine {
  code: string;
  /** A "DC" line rather than a scan of the item itself. */
  discount: boolean;
  description: string;
  qty: number;
  net: number;
  coupon: number;
  priceTypes: Set<string>;
  firstLine: number;
}
