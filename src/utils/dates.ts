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

/**
 * A payload's clock as zero-padded HHMMSS, or "" when it has none.
 *
 * Takes the time off `sale_date` when the date carries a real one, and
 * otherwise a separate start-time field. That field comes back as bare digits
 * — "93045" with the leading zero dropped — so it is padded rather than parsed.
 * A midnight stamp is treated as no time: it is what a date-only value looks
 * like once serialised, and sorting on it would put every sale at 00:00.
 */
export const clockOf = (saleDate: string, startTime?: unknown): string => {
  const fromDate = (String(saleDate ?? "").split("T")[1] ?? "")
    .replace(/\D/g, "")
    .slice(0, 6);
  if (fromDate.length >= 4 && Number(fromDate) !== 0)
    return fromDate.padEnd(6, "0");
  const digits = String(startTime ?? "").replace(/\D/g, "");
  if (digits.length < 3 || digits.length > 6) return "";
  return (digits.length % 2 === 1 ? `0${digits}` : digits).padEnd(6, "0");
};
