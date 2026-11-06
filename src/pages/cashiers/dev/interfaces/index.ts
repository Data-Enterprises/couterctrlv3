// Interfaces
import type { TransactionListItem } from "../../../../interfaces";

// "Is this one person, or is it the item/lane?" — the flag that decides
// whether a signal is an investigation or a maintenance ticket. Anything a
// single cashier owns is behavior; the same exception spread across several
// cashiers is almost always a bad tag, a wrong price, or a broken lane.
export type SpreadKind = "single" | "narrow" | "wide" | "unmapped";

export interface Signal {
  key: string;
  label: string;
  sublabel: string;
  count: number;
  amount: number;
  transactions: number;
  cashiers: number;
  items: number;
  lastLineCount: number;
  topItem: { label: string; count: number } | null;
  spread: SpreadKind;
  spreadLabel: string;
  rows: TransactionListItem[];
}

// Store names resolve through the logged-in user's own assignedStores rather
// than the store_name on the row — the API's copy comes back null for closed
// stores, which is exactly the set an exception report is likely to surface.
export type StoreNameResolver = (storeid: number, fallback: string) => string;

export interface SignalTransaction {
  saleId: string;
  saleDate: string;
  startTime: string;
  cashierName: string;
  cashierNumber: number;
  lineCount: number;
  totalLines: number;
  qty: number;
  amount: number;
  hasLastLine: boolean;
}

export interface ExplorerTotals {
  exceptions: number;
  transactions: number;
  amount: number;
  stores: number;
  cashiers: number;
  items: number;
}

export type ModalMode = "presets" | "custom";

export type Dataset = "signals" | "transactions" | "lines";

export type SortCol = "date" | "transaction" | "qty" | "amount";
