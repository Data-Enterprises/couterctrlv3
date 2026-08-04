/** Date labels for graded comparison headers.
 *
 *  Every Performance page shows three figures — this year, last week, last year
 *  — and each one has to say *which dates it covers*, because the answer
 *  changes when a day is selected. "vs Last Year" alone doesn't tell you
 *  whether you're looking at a week or a Tuesday.
 *
 *  Sales (StoreDetailPopup) currently carries an inline copy of this logic.
 *  These are the same rules, extracted so a second page doesn't add a third
 *  copy; Sales can adopt them whenever it's next touched.
 *
 *  Parsed at T12:00:00 rather than midnight: a bare YYYY-MM-DD is parsed as UTC
 *  and then rendered in local time, which lands on the previous day for anyone
 *  west of Greenwich. Noon is far enough from either boundary to be safe.
 */

/** "Jul 28" */
export const fmtDate = (iso: string) =>
  new Date(iso.split("T")[0] + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

/** "Tue, Jul 28" — used when a single day is selected. */
export const fmtDayLabel = (iso: string) =>
  new Date(iso.split("T")[0] + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

/** "Jul 28 – Aug 3" */
export const fmtRangeLabel = (startIso: string, endIso: string) =>
  `${fmtDate(startIso)} – ${fmtDate(endIso)}`;

/**
 * "7/28 – 8/3/2026" — the numeric form the left-panel header uses.
 *
 * The year sits on the end date alone, not both: the pair is a week, so
 * repeating the year would be noise, but omitting it entirely loses the one
 * thing that distinguishes this week from the same week last year.
 */
export const fmtCompactRange = (startIso: string, endIso: string) => {
  const start = new Date(startIso.split("T")[0] + "T12:00:00");
  const end = new Date(endIso.split("T")[0] + "T12:00:00");
  const md = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${md(start)} – ${md(end)}/${end.getFullYear()}`;
};

/**
 * The label for one comparison column.
 *
 * With no day selected it names the period's range; with a day selected it
 * names that day's counterpart, which is what the figure beneath it has
 * narrowed to.
 */
export const comparisonLabel = (
  selectedDay: string | null,
  counterpartDay: string | null,
  rangeStart: string,
  rangeEnd: string,
) =>
  selectedDay && counterpartDay
    ? fmtDayLabel(counterpartDay)
    : fmtRangeLabel(rangeStart, rangeEnd);
