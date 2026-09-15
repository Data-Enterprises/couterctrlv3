/**
 * Register line types on `items/itemlookup/{storeid}`.
 *
 * The endpoint began returning every line type in `history` — Sale alongside
 * Backup, Cancelled and Voided — while its own top-level totals still count
 * Sale only. Anything that sums `history` has to sum Sale rows, or a cancelled
 * banana lands in revenue.
 *
 * A row with no `sale_type` is a Sale: that is the response from before the
 * field existed, which is still what production returns.
 */
export const isSaleRow = (row: { sale_type?: string | null }): boolean =>
  !row.sale_type || row.sale_type === "Sale";
