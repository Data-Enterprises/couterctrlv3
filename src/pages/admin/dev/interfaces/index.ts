/**
 * Whether a store is open, closed, or not reporting.
 *
 * `deactivated_at` is optional on `Store` because only
 * `stores/unassigned_stores` returns it, so `undefined` and `null` mean
 * different things and both have to survive: undefined is "nobody asked",
 * null is "asked, and it is open".
 */
export type Status = "open" | "closed" | "unknown";