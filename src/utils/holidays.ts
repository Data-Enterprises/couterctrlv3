// Static US holiday calendar (2025–2035), used to correctly align last-year
// comparisons for dates that land on a holiday. A plain weekday-preserving
// shift (see sameWeekDayLastYear in ./index.ts) is wrong for these: fixed-date
// holidays (July 4, Christmas) fall on a different weekday each year, and
// floating holidays (Thanksgiving, Labor Day, Memorial Day, Easter) are
// defined by weekday position rather than a fixed calendar date at all.

export type HolidayName =
  | "New Year's Day"
  | "Easter"
  | "Memorial Day"
  | "Independence Day"
  | "Labor Day"
  | "Thanksgiving"
  | "Black Friday"
  | "Christmas Eve"
  | "Christmas Day"
  | "New Year's Eve";

// holidayName -> year -> "YYYY-MM-DD"
export const HOLIDAYS: Record<HolidayName, Record<number, string>> = {
  "New Year's Day": {
    2025: "2025-01-01", 2026: "2026-01-01", 2027: "2027-01-01", 2028: "2028-01-01",
    2029: "2029-01-01", 2030: "2030-01-01", 2031: "2031-01-01", 2032: "2032-01-01",
    2033: "2033-01-01", 2034: "2034-01-01", 2035: "2035-01-01",
  },
  "Easter": {
    2025: "2025-04-20", 2026: "2026-04-05", 2027: "2027-03-28", 2028: "2028-04-16",
    2029: "2029-04-01", 2030: "2030-04-21", 2031: "2031-04-13", 2032: "2032-03-28",
    2033: "2033-04-17", 2034: "2034-04-09", 2035: "2035-03-25",
  },
  "Memorial Day": {
    2025: "2025-05-26", 2026: "2026-05-25", 2027: "2027-05-31", 2028: "2028-05-29",
    2029: "2029-05-28", 2030: "2030-05-27", 2031: "2031-05-26", 2032: "2032-05-31",
    2033: "2033-05-30", 2034: "2034-05-29", 2035: "2035-05-28",
  },
  "Independence Day": {
    2025: "2025-07-04", 2026: "2026-07-04", 2027: "2027-07-04", 2028: "2028-07-04",
    2029: "2029-07-04", 2030: "2030-07-04", 2031: "2031-07-04", 2032: "2032-07-04",
    2033: "2033-07-04", 2034: "2034-07-04", 2035: "2035-07-04",
  },
  "Labor Day": {
    2025: "2025-09-01", 2026: "2026-09-07", 2027: "2027-09-06", 2028: "2028-09-04",
    2029: "2029-09-03", 2030: "2030-09-02", 2031: "2031-09-01", 2032: "2032-09-06",
    2033: "2033-09-05", 2034: "2034-09-04", 2035: "2035-09-03",
  },
  "Thanksgiving": {
    2025: "2025-11-27", 2026: "2026-11-26", 2027: "2027-11-25", 2028: "2028-11-23",
    2029: "2029-11-22", 2030: "2030-11-28", 2031: "2031-11-27", 2032: "2032-11-25",
    2033: "2033-11-24", 2034: "2034-11-23", 2035: "2035-11-22",
  },
  "Black Friday": {
    2025: "2025-11-28", 2026: "2026-11-27", 2027: "2027-11-26", 2028: "2028-11-24",
    2029: "2029-11-23", 2030: "2030-11-29", 2031: "2031-11-28", 2032: "2032-11-26",
    2033: "2033-11-25", 2034: "2034-11-24", 2035: "2035-11-23",
  },
  "Christmas Eve": {
    2025: "2025-12-24", 2026: "2026-12-24", 2027: "2027-12-24", 2028: "2028-12-24",
    2029: "2029-12-24", 2030: "2030-12-24", 2031: "2031-12-24", 2032: "2032-12-24",
    2033: "2033-12-24", 2034: "2034-12-24", 2035: "2035-12-24",
  },
  "Christmas Day": {
    2025: "2025-12-25", 2026: "2026-12-25", 2027: "2027-12-25", 2028: "2028-12-25",
    2029: "2029-12-25", 2030: "2030-12-25", 2031: "2031-12-25", 2032: "2032-12-25",
    2033: "2033-12-25", 2034: "2034-12-25", 2035: "2035-12-25",
  },
  "New Year's Eve": {
    2025: "2025-12-31", 2026: "2026-12-31", 2027: "2027-12-31", 2028: "2028-12-31",
    2029: "2029-12-31", 2030: "2030-12-31", 2031: "2031-12-31", 2032: "2032-12-31",
    2033: "2033-12-31", 2034: "2034-12-31", 2035: "2035-12-31",
  },
};

// Reverse lookup ("YYYY-MM-DD" -> holiday name), derived once from HOLIDAYS.
const DATE_TO_HOLIDAY: Record<string, HolidayName> = Object.fromEntries(
  Object.entries(HOLIDAYS).flatMap(([name, years]) =>
    Object.values(years).map((date) => [date, name as HolidayName]),
  ),
);

/** Returns the holiday name for a given "YYYY-MM-DD" date, or null if it isn't one. */
export const getHolidayName = (date: string): HolidayName | null =>
  DATE_TO_HOLIDAY[date] ?? null;

/**
 * Given a "YYYY-MM-DD" date that falls on a holiday, returns that same
 * holiday's date exactly one year earlier — or null if the date isn't a
 * holiday, or the prior year falls outside the 2025–2035 table range.
 */
export const getHolidayLastYear = (date: string): string | null => {
  const name = getHolidayName(date);
  if (!name) return null;
  const year = Number(date.slice(0, 4));
  return HOLIDAYS[name][year - 1] ?? null;
};
