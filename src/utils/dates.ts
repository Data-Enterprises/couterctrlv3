import { sameWeekDayLastYear } from ".";

/*
 * Date helpers used across pages. Moved here from pages/subDepts/index.ts,
 * which still re-exports them for its own files.
 */

export const setDates = (date: Date, days: number = 0) => {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  // returns yyyy-mm-dd so sub_sales endpoint can process the dates correctly
  return d.toISOString().split("T")[0];
};

// Last-year date for a given "YYYY-MM-DD", holiday- and leap-year-aware
// (see sameWeekDayLastYear) — use this instead of setDates(date, 364).
export const getLYDate = (date: string): string => sameWeekDayLastYear(date).date;

/** Days in every window Item Report reads. Fixed rather than user-chosen, so the
 *  three periods are always the same length and directly comparable — the same
 *  contract the graded pages work to. */
export const WINDOW_DAYS = 7;

/** The week ending on the picked date. One date in, seven days out. */
export const weekEnding = (singleDate: string) => ({
  start: setDates(new Date(singleDate), WINDOW_DAYS - 1),
  end: setDates(new Date(singleDate)),
});
