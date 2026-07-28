// Helpers for the small set of stores where `storeid` is not a unique
// location key — some ids carry two store_numbers (e.g. 685 returns both
// "369" and "370", genuinely separate operations with different tax profiles
// that were never given their own storeid).
//
// Every store-scoped endpoint is queried BY STOREID, so those responses come
// back with both locations combined. These two helpers are what let a page
// present them as separate entities: one narrows the data, the other labels it.
//
// Shared rather than page-local because Sales and Sub Dept Margins have to
// agree on these stores — if one page merges them and the other splits them,
// the numbers stop lining up.

/**
 * Narrow rows fetched by storeid down to a single location.
 *
 * The size check is the safety valve: a response that only ever mentions one
 * store_number is passed through untouched, so a formatting mismatch between
 * the caller's number and the payload's can't silently empty a normal store.
 */
export const scopeToStoreNumber = <T extends { store_number: string }>(
  rows: T[],
  storeNumber: string,
): T[] => scopeRowsToStore(rows, storeNumber, (r) => r.store_number);

/**
 * Same as scopeToStoreNumber, for row types that spell the field differently
 * (Orders' AllOrder uses `storenumber`, no underscore).
 */
export const scopeRowsToStore = <T>(
  rows: T[],
  storeNumber: string,
  getNumber: (row: T) => string,
): T[] => {
  if (new Set(rows.map(getNumber)).size < 2) return rows;
  return rows.filter((r) => getNumber(r) === storeNumber);
};

/**
 * Rewrite the store number embedded in a store's name so each co-located
 * location identifies itself — "Bruces Foodland 369" becomes "Bruces Foodland
 * 370" for the 370 row. Needed because assignedStores resolves by storeid, so
 * both locations otherwise render with the identical name.
 *
 * `numbersForId` is every store_number under this storeid, and it's what makes
 * the swap exact rather than a guess: the digit run replaced is the one that
 * IS one of this store's numbers. "Foodland 369 (Hwy 431)" becomes "Foodland
 * 370 (Hwy 431)", not "Foodland 369 (Hwy 370)" — brand numbers, highways and
 * suite numbers are left alone.
 *
 * No-ops for the overwhelming majority of stores (one number → nothing to
 * disambiguate). If the name embeds no recognizable number, the number is
 * appended instead, so co-located labels are never identical.
 */
export const applyStoreNumberToName = (
  name: string,
  storeNumber: string,
  numbersForId: string[],
): string => {
  if (numbersForId.length < 2) return name;
  const known = new Set(numbersForId);
  const match = [...name.matchAll(/\d+/g)].find((m) => known.has(m[0]));
  if (!match || match.index === undefined) return `${name} ${storeNumber}`;
  return (
    name.slice(0, match.index) +
    storeNumber +
    name.slice(match.index + match[0].length)
  );
};

/** Every distinct store_number present in a storeid-scoped response, sorted.
 *  Length > 1 means the storeid is co-located. */
export const storeNumbersIn = (rows: { store_number: string }[]): string[] =>
  [...new Set(rows.map((r) => r.store_number))].sort();

/** storeid -> every store_number returned under it. Entries with more than one
 *  number are co-located. Feeds applyStoreNumberToName, which needs the full
 *  set per id to know which digits in a name are the store number. */
export const numbersByStoreId = <T>(
  rows: T[],
  getId: (row: T) => number,
  getNumber: (row: T) => string,
): Record<number, string[]> =>
  rows.reduce((acc: Record<number, string[]>, row) => {
    const nums = (acc[getId(row)] ??= []);
    const n = getNumber(row);
    if (!nums.includes(n)) nums.push(n);
    return acc;
  }, {});
