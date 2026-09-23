/**
 * Which columns hold personal data.
 *
 * The endpoint returns 102 flat column names and says nothing about what is
 * sensitive, so the judgement is made here. It decides two things: the marker
 * beside a column in the picker, and whether a sample VALUE is shown on screen
 * — the file gets the real thing, the preview does not, because a preview is
 * read over someone's shoulder far more often than a CSV is opened.
 */
const PII = new Set([
  "customer_name",
  "customer_email",
  "customer_phone",
  "customer_address",
  "customer_city",
  "customer_zipcode",
  "customer_longitude",
  "customer_latitude",
]);

export const isPii = (column: string) => PII.has(column);

/** How many of the given columns are personal. */
export const countPii = (columns: string[]) =>
  columns.filter((c) => PII.has(c)).length;

/**
 * A masked stand-in, shaped like the value it replaces so the column still
 * reads as populated or empty.
 */
export const maskValue = (value: unknown) =>
  value === null || value === undefined || value === "" ? "" : "••••••";
