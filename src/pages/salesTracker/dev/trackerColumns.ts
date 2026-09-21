/**
 * Column widths for the tracker's two tables.
 *
 * In their own module rather than beside the row components because a
 * non-component export from a `.tsx` file breaks Fast Refresh, and because a
 * header row and its cells have to read the same numbers — a header drifting
 * away from its column is the failure this prevents.
 *
 * Both tables are laid out with CSS grid rather than flex: the template strings
 * below are the single definition of each table, so the header and every row
 * are aligned by construction instead of by matching widths on each cell.
 */

/** Sub-department list, left panel. Sized for a seven-figure currency string
 *  at 13.5px tabular with room to spare — a column that only just fits its
 *  widest value looks cramped even when nothing wraps. */
export const SUB_GRID = "minmax(0,1fr) 104px 104px 80px 182px";

/** Day rows inside an expanded week: day, this year, last year, ATS, vs LY. */
export const DAY_GRID = "minmax(0,1fr) 100px 100px 78px 168px";

/**
 * Top line of a week card: chevron, week and dates, TY, then the vs-LY pill.
 *
 * The pill column is sized to roughly what the pill needs, so the pill hugs
 * its own content and still lands beside the sales figure. Wider than this and
 * the sales figure is marooned across a band of empty space.
 */
export const WEEK_GRID = "auto minmax(0,1fr) 120px 178px";

/**
 * Tabular figures, so a column of dollars lines up digit under digit.
 *
 * Proportional numerals make the same five-digit figure a different width row
 * to row, which is what turns a right-aligned money column into a ragged one.
 */
export const NUM = "tabular-nums";
