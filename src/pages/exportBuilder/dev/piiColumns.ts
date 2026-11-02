/**
 * Which columns hold personal data.
 *
 * The endpoint returns 102 flat column names and says nothing about what is
 * sensitive, so the judgement is made here. It labels them -- the marker in
 * the picker, the "Personal columns" toggle, the note on the export bar --
 * and hides nothing: the sample shows their values as the file does. The
 * people exporting need to see that information (Steve, 2 Nov 2026), so the
 * masking the sample used to apply is gone.
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
