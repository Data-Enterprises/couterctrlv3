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
