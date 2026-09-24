import type { SelectFilterOption } from "../../../components-dev/filters/SelectFilter";

/**
 * PARKED, 2026-09-24. The endpoint does not take a date format.
 *
 * The final contract for /sales/export lists fileFormat, filePrefix,
 * userQueryId and dryRun, and nothing about dates — so a page that formatted
 * them would show 09/14/2026 in the preview and hand back a file holding
 * 2026-09-14T00:00:00. Everything here is kept and switched off rather than
 * deleted: the endpoint side is written up as Part 4 of
 * computed-measures-handoff.md, and turning this back on is uncommenting the
 * four places that call it.
 */


/**
 * How dates are written in the file.
 *
 * The table stores timestamps, so a date column arrives as
 * `2026-09-14T00:00:00` and lands in a spreadsheet looking like machine
 * output. Most people opening a sales export want `09/14/2026`.
 *
 * The values here are the Postgres patterns themselves rather than names for
 * them. They are still a closed set — the endpoint checks membership before
 * it uses one, exactly as it checks a function name — and a pattern that
 * reads as what it produces is worth more in a payload and in Show SQL than
 * `format_3` would be.
 */
export const DATE_FORMATS: SelectFilterOption[] = [
  { value: "", label: "As stored (2026-09-14T00:00:00)" },
  { value: "YYYY-MM-DD", label: "2026-09-14" },
  { value: "MM/DD/YYYY", label: "09/14/2026" },
  { value: "DD/MM/YYYY", label: "14/09/2026" },
  { value: "YYYY/MM/DD", label: "2026/09/14" },
  { value: "MM/DD/YYYY HH24:MI", label: "09/14/2026 14:30" },
  { value: "YYYY-MM-DD HH24:MI:SS", label: "2026-09-14 14:30:00" },
];

const PATTERNS = new Set(DATE_FORMATS.map((f) => f.value).filter(Boolean));

/** True for a pattern this page offers; anything else is left alone. */
export const isKnownDateFormat = (pattern: string) => PATTERNS.has(pattern);

/**
 * A column the format applies to.
 *
 * `date` and every flavour of `timestamp`. Not `time`, which has no date in
 * it to write differently, and not a varchar that happens to hold a date —
 * the endpoint would have nothing to convert there either.
 */
export const isDateColumn = (dataType: string) => {
  const type = dataType.toLowerCase();
  return type === "date" || type.startsWith("timestamp");
};

const pad = (n: number) => (n < 10 ? "0" + n : String(n));

/**
 * One value, written the way the file will write it.
 *
 * Read in UTC on purpose: these arrive as `2026-09-14T00:00:00` with no zone,
 * meaning that day at the store, and a local reading of midnight turns it
 * into the evening before for anyone west of Greenwich. Postgres will format
 * the stored value itself, which is the same thing this does.
 *
 * Anything that is not a date it can read comes back untouched — a preview
 * that hides a value it did not understand is worse than one that shows it.
 */
export const formatDateValue = (value: unknown, pattern: string) => {
  if (!pattern || value === null || value === undefined || value === "") {
    return value;
  }
  const text = String(value);
  const at = new Date(text.length <= 10 ? text + "T00:00:00Z" : text + "Z");
  if (Number.isNaN(at.getTime())) return value;

  const parts: Record<string, string> = {
    YYYY: String(at.getUTCFullYear()),
    MM: pad(at.getUTCMonth() + 1),
    DD: pad(at.getUTCDate()),
    HH24: pad(at.getUTCHours()),
    MI: pad(at.getUTCMinutes()),
    SS: pad(at.getUTCSeconds()),
  };
  // Longest tokens first, so HH24 is not read as HH followed by 24.
  return pattern.replace(/YYYY|HH24|MM|DD|MI|SS/g, (token) => parts[token]);
};
