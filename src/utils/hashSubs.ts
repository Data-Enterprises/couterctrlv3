/**
 * Hash sub departments — the ones a store leaves out of its own net sales.
 *
 * Fuel, lottery, cash accounts. Which ones is a per-store setting, so there
 * is no list to hard-code: the row says. `sales/weekly` and `sales/daily`
 * already drop them server-side, while the sub-department endpoints return
 * them on purpose, because a page drilling into one store needs to see its
 * fuel. That split is fine until something SUMS the department rows and sets
 * the result beside a store total — then the two disagree, by $79,943 on
 * Brooks Tupelo for the week to 10/22/2026.
 *
 * So: show them when you are listing a store's departments, drop them when
 * you are totalling to compare against a store figure. One helper, because
 * the rule is easy to half-apply and the failure is silent.
 */

/** A row that carries the flag. Optional, so a response from before the flag
 *  existed reads as "not known to be hash" rather than as `false` with
 *  conviction. */
export interface MaybeHashRow {
  is_hash?: boolean;
}

export const isHashRow = (r: MaybeHashRow) => r.is_hash === true;

/** Everything a store actually counts. What to total against `sales/weekly`. */
export const countedRows = <T extends MaybeHashRow>(rows: T[]): T[] =>
  rows.filter((r) => !isHashRow(r));

/** The rows left out, kept rather than discarded: a reader asking why a
 *  comparison skips fuel is owed the figure it skipped. */
export const hashRows = <T extends MaybeHashRow>(rows: T[]): T[] =>
  rows.filter(isHashRow);

/**
 * Both halves in one pass, for callers that need to show what they dropped.
 *
 * `known` is false when no row carries the flag at all — an endpoint that has
 * not been updated, or a week with no rows. Callers that would otherwise
 * announce "nothing is excluded here" can tell that apart from having
 * checked.
 */
export const splitHash = <T extends MaybeHashRow>(rows: T[]) => ({
  counted: countedRows(rows),
  hash: hashRows(rows),
  known: rows.some((r) => r.is_hash !== undefined),
});
