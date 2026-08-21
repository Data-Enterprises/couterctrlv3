import type { TransactionListItem } from "../../../interfaces";
import { isAll } from "./caseModel";

/**
 * When in the day each exception type happened.
 *
 * Built for **every** type, not just the selected one, because the muted
 * series answer the objection the selected one raises: an evening cluster is
 * only evidence if the same cashier's other exceptions are spread across the
 * trading day. If everything clusters after seven, that is a shift.
 *
 * `sale_start_time` arrives as a bare clock string — "93240" is 09:32:40 — so
 * the hour is the leading one or two digits rather than anything parseable as
 * a date.
 */
export interface HourProfile {
  /** 24 buckets per type, index = hour. */
  byType: Map<string, number[]>;
  /** Hours with any activity, for trimming the axis to trading hours. */
  firstHour: number;
  lastHour: number;
}

export const hourOf = (t: TransactionListItem): number => {
  const raw = String(t.sale_start_time ?? "").trim();
  if (!raw) return -1;
  const padded = raw.length >= 6 ? raw : raw.padStart(6, "0");
  const hour = Number(padded.slice(0, 2));
  return Number.isFinite(hour) && hour >= 0 && hour < 24 ? hour : -1;
};

export const buildHourProfile = (
  lines: TransactionListItem[],
  weekStart: string,
  weekEnd: string,
): HourProfile => {
  const byType = new Map<string, number[]>();
  let firstHour = 23;
  let lastHour = 0;

  // One row per receipt per type: a receipt with six cancelled lines happened
  // at one moment, not six.
  const seen = new Set<string>();

  for (const l of lines) {
    const day = l.sale_date.slice(0, 10);
    if (day < weekStart || day > weekEnd) continue;
    const hour = hourOf(l);
    if (hour < 0) continue;
    const key = `${l.sale_id}__${l.sale_type}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const buckets = byType.get(l.sale_type) ?? Array(24).fill(0);
    buckets[hour] += 1;
    byType.set(l.sale_type, buckets);
    if (hour < firstHour) firstHour = hour;
    if (hour > lastHour) lastHour = hour;
  }

  return {
    byType,
    firstHour: firstHour <= lastHour ? firstHour : 6,
    lastHour: firstHour <= lastHour ? lastHour : 22,
  };
};

/** The busiest hour for one type, or across every type on the All tab. */
export const peakHourOf = (
  profile: HourProfile,
  saleType: string,
): { hour: number; count: number } => {
  const buckets = Array(24).fill(0) as number[];
  for (const [type, counts] of profile.byType) {
    if (!isAll(saleType) && type !== saleType) continue;
    counts.forEach((n, h) => {
      buckets[h] += n;
    });
  }
  let hour = -1;
  let count = 0;
  buckets.forEach((n, h) => {
    if (n > count) {
      count = n;
      hour = h;
    }
  });
  return { hour, count };
};
