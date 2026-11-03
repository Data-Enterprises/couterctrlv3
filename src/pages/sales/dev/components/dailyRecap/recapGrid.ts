/**
 * The class strings and column template the recap's pieces share.
 *
 * The day head, the day rows and the cards inside an open day are drawn by
 * separate components but have to line up, so they read from one place, the
 * way the LP case grids keep theirs level.
 *
 * The look is the popup's own (the Top 200 tab beside this one): an 11px bold
 * uppercase head on gray-50, a gray-100 hairline under every row, an open row
 * marked with the row-selected pair, and cards on brand_paper rather than raw
 * white.
 */

export const HEAD =
  "grid items-end gap-3 px-3.5 py-1.5 border-b border-gray-100 bg-gray-50 text-[11px] font-bold uppercase tracking-wide text-content";

const ROW_BASE =
  "w-full grid items-center gap-3 px-3.5 py-1.5 min-h-[44px] text-left text-[13px] text-content border-b border-b-gray-100 border-l-2 transition-colors";

export const ROW = `${ROW_BASE} border-transparent hover:bg-gray-50`;

// The pair, exactly as Top 200 writes it: the colour lands on the left edge
// only, because the bottom keeps its own gray-100 above.
export const ROW_OPEN = `${ROW_BASE} bg-row_selected border-row_selected_border`;

export const CARD = "rounded-[10px] border border-gray-200 bg-brand_paper";

export const CARD_TITLE = "text-[11px] font-bold uppercase tracking-wide text-content";

export const NUM = "text-right tabular-nums";

/** Chevron, day, net sales (bar + figure), transactions, avg basket, units,
 *  [pounds], busiest hour (sparkline + label). */
export const dayCols = (withPounds: boolean) =>
  withPounds
    ? "20px 92px minmax(0,2fr) repeat(4,minmax(0,.8fr)) minmax(0,1.5fr)"
    : "20px 92px minmax(0,2fr) repeat(3,minmax(0,.9fr)) minmax(0,1.5fr)";
