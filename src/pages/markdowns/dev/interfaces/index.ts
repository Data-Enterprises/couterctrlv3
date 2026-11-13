// Interfaces
import type { MarkdownFilters, MarkdownItem, MarkdownSortKey } from "../../../../interfaces/markdowns";

/** One column of the Markdowns grid and its export. */
export interface MarkdownColumn {
  key: MarkdownSortKey;
  /** The heading, in the grid and the CSV. */
  label: string;
  align: "left" | "right";
  /** false: in the export only, not the grid. */
  grid?: false;
  /** The value as the grid shows it; null becomes "—". */
  show: (row: MarkdownItem) => string;
  /** The value as the CSV writes it; null becomes an empty cell. */
  csv: (row: MarkdownItem) => string | number | null;
}

/** The filters that narrow by a list of values (everything but minPercent). */
export type MarkdownFilterKey = Exclude<keyof MarkdownFilters, "minPercent">;

/** For each list filter, the values that still have a row behind them. */
export type MarkdownAvailable = Record<MarkdownFilterKey, Set<string>>;

/** One choice in a filter's list. */
export interface MarkdownOption {
  value: string;
  label: string;
}
