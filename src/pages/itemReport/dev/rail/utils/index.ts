/** How far a unit swing has to go before the pill calls it critical rather than
 *  watch. Sales' own delta pill is binary red/green, which would paint a 2% dip
 *  as a crisis — the false alarm this page is built to avoid. */
export const DELTA_THRESHOLD = 10;

/** Shown in the Unit movement heading before receipts land, so the section
 *  names its own window rather than appearing to cover all time. */
export const MOVEMENT_FALLBACK = 14;

/** A unit count as the rail prints it: whole, or to one place. */
export const fmtUnits = (n: number | null) =>
  n === null ? "—" : n % 1 === 0 ? String(n) : n.toFixed(1);

/**
 * The grid every section's rows sit on.
 *
 * Real columns rather than "24 · $3.11" crammed into one, and sized to the
 * number of values a section actually has — a two-value section uses a
 * two-track template so its figures finish flush at the right edge instead of
 * stopping short against an empty third column.
 */
/** The transactions grid's own shape. "TRANSACTIONS" is a long heading and the
 *  shared three-column template is sized for the estimated section's "Days". */
export const TXN_COLS = "1fr 52px 104px";

export const TEMPLATE: Record<number, string> = {
  2: "1fr 76px",
  3: "1fr 60px 76px",
  5: "1fr 44px 58px 58px 50px",
};
