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
 * One location's rows, with no escape hatch.
 *
 * `scopeToStoreNumber` leaves an array alone when it holds fewer than two
 * numbers, which is right when the question is "does this response need
 * splitting at all" and wrong when the question is "which location is the
 * reader looking at". A co-located store can easily have a period only one of
 * its locations traded in -- a last year where 370 has no history and 369
 * does -- and the guarded form then hands 369's rows back to somebody on the
 * 370 tab, which is the error the split exists to prevent.
 *
 * So: use `scopeToStoreNumber` to narrow a response that may or may not need
 * it, and this when a location has been chosen and the answer must be that
 * location or nothing.
 */
export const onlyStoreNumber = <T extends { store_number: string }>(
  rows: T[],
  storeNumber: string,
): T[] => rows.filter((r) => r.store_number === storeNumber);

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

/**
 * The name for the combined view of a co-located pair.
 *
 * `applyStoreNumberToName` answers "which one of these am I looking at". This
 * answers "both of them", which the combined tab had no way to say: with no
 * location selected it fell through to the stored name, and that name has one
 * of the two numbers baked into it. Categories showed 369 $303.2K, 370
 * $121.2K and Both $424.4K — the last of those under the heading "Bruces
 * Foodland 369".
 *
 * Built by swapping the embedded number for the joined list, so the rest of
 * the name survives: "Foodland 369 (Hwy 431)" becomes "Foodland 369 + 370
 * (Hwy 431)". Falls back to appending, same as its sibling, and no-ops for an
 * ordinary store with nothing to combine.
 */
export const combinedStoreName = (
  name: string,
  numbersForId: string[],
): string => {
  if (numbersForId.length < 2) return name;
  const joined = [...numbersForId].sort().join(" + ");
  const known = new Set(numbersForId);
  const match = [...name.matchAll(/\d+/g)].find((m) => known.has(m[0]));
  if (!match || match.index === undefined) return `${name} ${joined}`;
  return (
    name.slice(0, match.index) +
    joined +
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

/**
 * Normalise a store list from stores/unassigned_stores for display.
 *
 * Drops closed stores (they come back with a null name/number), orders by
 * store number, and strips the trailing "(123)" the payload appends to some
 * names. Shared because the login loader is no longer the only thing that
 * fetches these — a base group delete can revoke a store from the logged-in
 * user, and a re-fetch that skipped this would put raw names and null rows
 * back into a picker the loader had already cleaned.
 */
export const normalizeUserStores = <T extends { store_number: string; store_name: string }>(
  rows: T[],
): T[] =>
  (rows ?? [])
    .filter((s) => s.store_number !== null && s.store_name !== null)
    .sort((a, b) => parseInt(a.store_number) - parseInt(b.store_number))
    .map((s) => ({ ...s, store_name: s.store_name.replace(/\s*\(\d+\)\s*$/, "") }));
