/**
 * The longest range this page will search.
 *
 * The preview reads every line in the window to work out what the filter
 * lists hold, so its cost follows the range rather than the file — a quarter
 * takes minutes and then hands back the same two hundred sample rows. The
 * export itself has no such limit: build a month at a time, or load a
 * configuration onto whatever range you like once it is right.
 *
 * Thirty-one rather than thirty so a calendar month always fits.
 */
export const MAX_RANGE_DAYS = 31;

/**
 * Days from one to the other, inclusive.
 *
 * Counted in UTC: both ends are plain days by the time they reach here, and
 * stepping a local Date across the two days a year the clocks move would
 * count one twice or not at all.
 */
export const countDays = (start: string, end: string) => {
  const from = Date.parse(start + "T00:00:00Z");
  const to = Date.parse(end + "T00:00:00Z");
  if (Number.isNaN(from) || Number.isNaN(to) || to < from) return 0;
  return Math.round((to - from) / 86_400_000) + 1;
};

/** Why this range cannot be searched, in a sentence, or null. */
export const rangeBlock = (start: string, end: string) => {
  const days = countDays(start, end);
  if (days === 0) return "The end date is before the start date.";
  if (days > MAX_RANGE_DAYS) {
    return `That is ${days} days. This page reads every line in the range to work out what you can filter on, so it takes ${MAX_RANGE_DAYS} days at a time — pick a shorter range.`;
  }
  return null;
};
