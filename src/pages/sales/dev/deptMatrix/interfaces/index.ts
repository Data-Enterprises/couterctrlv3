// Interfaces
import type { GradingMetric } from "../../../../../features/dev/devSalesLedgerSlice";
import type { Matrix } from "../utils/deptMatrix";

export interface MatrixStore {
  storeid: number;
  /** Co-located stores share a `storeid`, so a response has to be narrowed by
   *  NUMBER as well or two locations come back as one row. */
  storeNumber: string;
  storeName: string;
}

export interface MatrixArgs {
  stores: MatrixStore[];
  tw: { start: string; end: string };
  lw: { start: string; end: string };
  ly: { start: string; end: string };
  metric: GradingMetric;
  enabled: boolean;
}

export interface MatrixState {
  matrix: Matrix | null;
  loading: boolean;
  /** How many of the stores asked for actually answered, so the screen can
   *  say "7 of 9" rather than quietly drawing a smaller group. */
  answered: number;
  asked: number;
  problem: string | null;
}
