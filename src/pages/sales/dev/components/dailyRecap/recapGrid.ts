/**
 * The class strings and column templates the recap's three grids share.
 *
 * Day, sub dept and item rows are drawn by separate components but sit inside
 * one another, so a padding or a rule that drifted between them would show as
 * a ragged edge. One definition keeps them level, the way the LP case grids
 * keep theirs.
 *
 * The look is the popup's own grid (the Top 200 tab beside this one): an 11px
 * bold uppercase head on gray-50, a gray-100 hairline under every row, and an
 * open row marked with the row-selected pair, never a fill of its own.
 */

export const HEAD =
  "grid items-end gap-2 px-3 py-1.5 border-b border-gray-100 bg-gray-50 text-[11px] font-bold uppercase tracking-wide text-content";

const ROW_BASE =
  "w-full grid items-center gap-2 px-3 py-2 text-left text-[13px] text-content border-b border-b-gray-100 border-l-2 transition-colors";

export const ROW = `${ROW_BASE} border-transparent hover:bg-gray-50`;

// The pair, exactly as Top 200 writes it: the colour lands on the left edge
// only, because the bottom keeps its own gray-100 above.
export const ROW_OPEN = `${ROW_BASE} bg-row_selected border-row_selected_border`;

/** Week and All sub depts: the figures the rows above must add up to. */
export const TOTAL_ROW =
  "grid items-center gap-2 px-3 py-2 text-[13px] font-bold text-content bg-gray-50 border-t border-brand_line_2 border-b border-b-gray-100";

/** Item rows are the dense grid, so they stripe. */
export const ITEM_ROW =
  "grid items-center gap-2 px-3 py-1.5 text-[12px] text-content border-b border-gray-100 even:bg-row_stripe";

export const NOTE = "px-3 py-1.5 text-[11.5px] text-content border-b border-gray-100";

export const NUM = "text-right tabular-nums";

/** Chevron, day, net sales, transactions, avg basket, units, [pounds], busiest hour. */
export const dayCols = (withPounds: boolean) =>
  withPounds
    ? "20px minmax(0,1.3fr) repeat(6,minmax(0,1fr))"
    : "20px minmax(0,1.3fr) repeat(5,minmax(0,1fr))";

/** Chevron, sub dept, share bar, items, units, [pounds], sales. */
export const subCols = (withPounds: boolean) =>
  withPounds
    ? "20px minmax(0,1.2fr) minmax(0,1.5fr) 64px 72px 80px 104px"
    : "20px minmax(0,1.2fr) minmax(0,1.6fr) 64px 72px 104px";

/** Item, UPC, units, [pounds], sales, avg price. */
export const itemCols = (withPounds: boolean) =>
  withPounds
    ? "minmax(0,2fr) 130px 64px 80px 104px 96px"
    : "minmax(0,2fr) 130px 64px 104px 96px";
