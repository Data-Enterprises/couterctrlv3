// Interfaces
import type { TransactionListItem } from "../../../../interfaces";

// "One person, or the item/lane?": decides whether a signal is an
// investigation or a maintenance ticket. One cashier owning it is behaviour;
// spread across several is usually a bad tag, a wrong price or a broken lane.
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

// Store names resolve through the user's assignedStores, not the row's
// store_name, which is null for closed stores.
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
