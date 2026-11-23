/** Where the Categories fetches go: one store, never a group. */
export interface CategoryScope {
  url: string;
  token: string;
  /** storeid — the page never searches by group. */
  storeid: number;
}

export interface PeriodRange {
  start: string;
  end: string;
}

/** The detail panel's two tabs. */
export type Tab = "items" | "hours";

/** Sortable columns. With none active the list keeps its own worst-grade
 *  -first order, which is the point of a Performance page — see
 *  useTriStateSort. */
export type ListSortCol = "ty" | "lw" | "ly";
