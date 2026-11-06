/**
 * Column widths for the tracker's two tables, as CSS grid templates: one
 * definition per table, so header and rows align by construction (kept out of
 * the `.tsx` files for Fast Refresh).
 */

/** Sub-department list, left panel, sized for a seven-figure currency string
 *  at 13.5px with room to spare. */
export const SUB_GRID = "minmax(0,1fr) 104px 104px 80px 182px";

/** Day rows inside an expanded week: day, this year, last year, ATS, vs LY. */
export const DAY_GRID = "minmax(0,1fr) 100px 100px 78px 168px";

/**
 * Top line of a week card: chevron, week and dates, TY, then the vs-LY pill,
 * its column sized so the pill sits beside the sales figure.
 */
export const WEEK_GRID = "auto minmax(0,1fr) 120px 178px";

/**
 * Tabular figures, so a dollar column lines up digit under digit.
 */
export const NUM = "tabular-nums";
