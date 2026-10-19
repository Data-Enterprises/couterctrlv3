/**
 * A bounded most-recently-used list of keys.
 *
 * The store popup used to remember exactly one store: `lastFetchedStoreKey`
 * was a single string, so opening 018, then 020, then 018 again refetched 018
 * from scratch — nine calls a bounce once Top items joined the six the popup
 * already fires. Store hopping is not an edge case here; comparing two stores
 * is most of what the counterpart feature exists for.
 *
 * Bounded rather than unbounded because the thing being kept is six arrays of
 * raw rows per store, and a group search can hold a hundred stores. Keeping
 * every store anybody clicked would grow until the tab did.
 */

/** How many stores' raw rows to keep.
 *
 *  Four covers the shape of the work — a store, its counterpart, and a couple
 *  either side while someone walks the ledger — without holding a group's
 *  worth of rows. */
export const STORE_CACHE_MAX = 4;

/**
 * Put `key` at the front, and say which keys fell off the end.
 *
 * Returns the eviction list rather than mutating a store, so the reducer can
 * delete exactly those entries and the rule stays testable on its own.
 */
export const lruPut = (
  order: string[],
  key: string,
  max: number = STORE_CACHE_MAX,
): { order: string[]; evicted: string[] } => {
  const without = order.filter((k) => k !== key);
  const next = [key, ...without];
  return {
    order: next.slice(0, max),
    evicted: next.slice(max),
  };
};

/** Move an already-held key to the front without adding anything. A read is a
 *  use: the store you just looked at should not be the next one evicted. */
export const lruTouch = (order: string[], key: string): string[] =>
  order.includes(key) ? [key, ...order.filter((k) => k !== key)] : order;
