// Interfaces
import type { RollupRow } from "../../../../api/rollup";
import type { SubDeptMargin } from "../../../../interfaces";

/** Sortable columns. Trend is a shape, not a figure, so it stays static. */
export type SdSortCol = "ty" | "lw" | "ly";

/** A threshold filter's comparison. */
export type Operator = ">" | "<" | "=";

/** The cost grid's sortable columns. */
export type SortCol = "description" | "upc" | "unitCost" | "caseCost" | "qty" | "cogs";

/**
 * The three item reads for one search, unscoped.
 *
 * One source for the whole page now. `subs/subs` carries store number, sale
 * date, department, sales, tax, quantity and cost on every row, which is
 * everything the store header, the department list, the Sales-metric totals
 * and the margin grades were previously taking from three endpoints between
 * them.
 *
 * Held unscoped so switching between co-located locations re-derives without
 * touching the network.
 */
export type RawSearch = {
  /** Department totals per location per day, from `subs/rollup`. The list
   *  is graded from these first. */
  totals: { ty: RollupRow[]; lw: RollupRow[]; ly: RollupRow[] };
  items: { ty: SubDeptMargin[]; lw: SubDeptMargin[]; ly: SubDeptMargin[] };
  /** The item rows have landed, so the page derives from them. */
  itemsReady: boolean;
};
