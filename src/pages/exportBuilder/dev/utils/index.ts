// Redux
import {
  failBuildsLoad,
  failQueriesLoad,
  failSavedWork,
} from "../../../../features/dev/devExportBuilderSlice";

// Interfaces
import type { ExportTableKey } from "../../../../api/salesExport";

/** The load balancer gives up at 150s. The page says so at 120, so the
 *  explanation arrives before the failure does. */
export const SLOW_AFTER_MS = 120_000;

/**
 * A day list is only offered for a range someone could reasonably tick
 * through. Past this the section is hidden and the range itself is the filter
 * — a thousand checkboxes is not a question anyone answers.
 */
const MAX_DAYS = 366;

/**
 * Every day the range covers, inclusive, as `YYYY-MM-DD`.
 *
 * Built in UTC on purpose. Both ends are already plain days by the time they
 * get here, and stepping a local Date by 24 hours skips or repeats one on the
 * two days a year the clocks move — which would drop a day out of the list
 * or offer the same one twice.
 */
export const daysInRange = (start: string, end: string) => {
  const from = Date.parse(start + "T00:00:00Z");
  const to = Date.parse(end + "T00:00:00Z");
  if (Number.isNaN(from) || Number.isNaN(to) || to < from) return [];
  const days: string[] = [];
  const DAY = 86_400_000;
  for (let at = from; at <= to && days.length <= MAX_DAYS; at += DAY) {
    days.push(new Date(at).toISOString().slice(0, 10));
  }
  return days.length > MAX_DAYS ? [] : days;
};

/**
 * The search a configuration answers, as one key: the store or the group, and
 * the dates. Two sources loaded under the same key answered the same question
 * of different tables, so either can come back without a fetch.
 */
export const scopeKey = (
  group: boolean,
  id: number,
  startDate: string,
  endDate: string,
) => `${group ? "group" : "store"}:${id}:${startDate}:${endDate}`;

/** A saved-query or saved-export failure, for the table it happened on. */
export const queriesFailed = (source: ExportTableKey, message: string) =>
  failQueriesLoad({ source, message });
export const savedFailed = (source: ExportTableKey, message: string) =>
  failSavedWork({ source, message });
export const buildsFailed = (source: ExportTableKey, message: string) =>
  failBuildsLoad({ source, message });

/**
 * An answer that failed while reporting 200. A validation or permission
 * failure raises properly on this router, but an unexpected one comes back as
 * 200 with `success: false`, so both have to be checked.
 */
export const answerFailed = (j: { error?: number; success?: boolean }) =>
  j.error !== 0 || j.success === false;

/** A saved query's date, short. */
export const savedOn = (iso: string) => {
  const at = new Date(iso);
  return Number.isNaN(at.getTime())
    ? ""
    : at.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};
