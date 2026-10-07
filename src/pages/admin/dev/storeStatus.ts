import type { Store } from "../../../interfaces";

/**
 * Whether a store is open, closed, or not reporting.
 *
 * `deactivated_at` is optional on `Store` because only
 * `stores/unassigned_stores` returns it, so `undefined` and `null` mean
 * different things and both have to survive: undefined is "nobody asked",
 * null is "asked, and it is open".
 */
export type Status = "open" | "closed" | "unknown";

export type StatusFilter = "all" | "open" | "closed";

/**
 * A store is closed only if the field holds a date that parses.
 *
 * Testing `!== null` was not enough and marked open stores closed. The
 * unassigned half of that endpoint is built with `pd.merge`, which types a
 * column holding any real timestamp as `datetime64` and turns its nulls into
 * `NaT` — and `NaT` leaves Python as a STRING, not as null. So the moment one
 * store anywhere was closed, every store in that half read as closed too.
 *
 * The date is the test, not the absence of null. `NaT`, `NaN`, an empty
 * string and anything else unparseable all mean what the column means when it
 * is null: this store is open.
 */
export const statusOf = (s: Pick<Store, "deactivated_at">): Status => {
  const raw = s.deactivated_at;
  if (raw === undefined) return "unknown";
  if (raw === null || raw === "") return "open";
  return Number.isNaN(new Date(raw).getTime()) ? "open" : "closed";
};

/**
 * Is the endpoint reporting status at all?
 *
 * One store carrying the field is enough — it is either in the select or it
 * is not. A list where every store happens to be open still counts as
 * reporting, which is why this asks about the FIELD and not about the value.
 */
export const statusReported = (stores: Pick<Store, "deactivated_at">[]) =>
  stores.some((s) => s.deactivated_at !== undefined);

/**
 * The day it closed, for the row. The column is a timestamp and nobody needs
 * the time of day it happened at.
 */
export const closedOn = (v: string) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};

/* ------------------------------------------------------------------ */
/* The CLOSED marker in the name                                       */
/* ------------------------------------------------------------------ */

/**
 * Stores already carry their state in the name — "614 - PW CLOSED",
 * "042 - IGA COOKEVILLE TN CLOSED" — because for years the name was the only
 * place to put it. Everywhere outside this page still reads that marker, so
 * closing a store has to keep writing it or half the app disagrees with the
 * other half.
 *
 * Case-insensitive and repeat-tolerant on the way out: names have been edited
 * by hand for a long time and "SAL CLOSED Closed" exists in the wild.
 */
const TRAILING_CLOSED = /(\s+closed)+\s*$/i;

/** True if the name already ends in the marker, however it is cased. */
export const hasClosedMark = (name: string) => TRAILING_CLOSED.test(name);

/** The name a closed store should carry. Adding it twice is not an edit. */
export const withClosedMark = (name: string) => {
  const base = name.trim();
  return hasClosedMark(base) ? base : `${base} CLOSED`;
};

/**
 * The name an open store should carry.
 *
 * Falls back to the original when stripping would leave nothing — a store
 * actually named "CLOSED" is a bad name, and an empty one is worse.
 */
export const withoutClosedMark = (name: string) => {
  const stripped = name.replace(TRAILING_CLOSED, "").trim();
  return stripped === "" ? name.trim() : stripped;
};
