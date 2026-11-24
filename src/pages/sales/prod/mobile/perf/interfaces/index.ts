// Interfaces
import type { PairSort, PerfPair } from "../utils/perfData";

/** The store an open sub department's items are fetched for, or null on the
 *  group card. `storeNumber` narrows an id that carries two stores. */
export type ItemScope = {
  key: string;
  storeid: number;
  storeNumber: string | null;
} | null;

/** What the drill list's item view needs: its rows, sort, search and loading state. */
export interface ItemProps {
  pairs: PerfPair[];
  total: number;
  loading: boolean;
  sort: PairSort | null;
  sortDir: "asc" | "desc" | null;
  onSort: (s: PairSort) => void;
  query: string;
  onQuery: (q: string) => void;
  partial: boolean;
  note: string;
  /** Nothing sold this week — the rows on screen are last year's, at $0.00. */
  noTy: boolean;
}
