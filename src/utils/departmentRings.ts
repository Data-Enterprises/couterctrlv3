/**
 * The department's own sales: what a cashier rings on the department key
 * rather than by scanning an item.
 *
 * `subs/subs` and `categories/cats` carry these as item rows with no real
 * product code (`0`, null or blank, plus a matching `Refunded` twin) and the
 * department's name as the description, so an item list shows them as an
 * "item" called "Grocery" sitting inside Grocery.
 *
 * Shared by mobile Sales and the mobile margin screen behind Categories,
 * Vendors and Sub Dept Margins, which both label them rather than drop them.
 */

/** Whether a code is the department's own bucket rather than an item: null,
 *  blank, or `0` / `0.0`. */
export const isDepartmentRing = (code: unknown): boolean => {
  if (code === null || code === undefined) return true;
  const text = String(code).trim();
  if (text === "" || text.toLowerCase() === "null") return true;
  // `0` and `0.0` are the department bucket, never a scanned item.
  return Number(text) === 0;
};

/** The key and the words the department's own sales go under in an item list. */
export const DEPT_RING_KEY = "department";
export const DEPT_RING_LABEL = "Sold directly to the sub department";

/** What stands where the UPC would be, since there is none. */
export const DEPT_RING_NOTE = "No item scanned: rung on the department key";

/**
 * Keep the department's own sales as one labelled row instead of dropping them.
 *
 * Dropping them takes real money with them: the item list stops adding up to
 * the department above it. Here every bucket row, its `Refunded` twin
 * included, takes one key and one name, so the list pairs them into a single
 * row that says what it is, and the refunds net against the sales.
 *
 * Mobile Sales asked for this (Amanda, 28 Oct), and the margin screens
 * followed. Desktop still drops them.
 */
export const foldDepartmentRings = <
  T extends { product_code: string; product_description: string },
>(
  rows: T[],
): T[] =>
  rows.map((r) =>
    isDepartmentRing(r.product_code)
      ? { ...r, product_code: DEPT_RING_KEY, product_description: DEPT_RING_LABEL }
      : r,
  );
