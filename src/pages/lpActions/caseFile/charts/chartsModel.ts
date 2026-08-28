import type { CashierTransaction, TransactionListItem } from "../../../../interfaces";
import type { WeekWindow } from "../../lpActionsMetrics";
import { weekdayOf } from "../../../lossPrevention/gradingUtils";
import { hourOf } from "../../case/hourProfile";
import { typeOrder } from "../../typeColour";

/**
 * The same week, cut three ways.
 *
 * Two of the three cost nothing: the day and the weekday both come off
 * `sale_date`, which the walk already has. The hour does not — the walked row
 * carries no time at all, only `sale_start_time` on the receipt LINE does, so
 * the hour chart is the one piece of this block that waits on a read.
 *
 * Bins are built in STORE-LOCAL terms, straight off the date string. A void at
 * 8:47pm belongs to that store's Saturday close, and parsing these through a
 * Date would hand the evening ones to the next day in half the world's
 * timezones — which would quietly wreck the weekday chart, the one whose
 * entire purpose is shift patterns.
 */

export interface StackCategory {
  key: string;
  /** Axis label, e.g. "8" or "Sat" or "7p". */
  label: string;
  /** Second axis line, e.g. the weekday initial under a date. */
  sublabel?: string;
  counts: Record<string, number>;
  total: number;
  /** Shaded column — weekends on the shift chart, and the emphasised days on
   *  the weekday one. */
  band?: boolean;
  /** Heavier axis label. */
  emphasis?: boolean;
}

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const INITIAL = ["S", "M", "T", "W", "T", "F", "S"];

const dayOf = (saleDate: string) => saleDate.slice(0, 10);

/** yyyy-mm-dd + n days, by string surgery. Deliberately not `addDays`, which
 *  parses as UTC and reads back local — an ISO date through it lands a day
 *  early. */
const addDays = (iso: string, days: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d + days);
  const next = new Date(t);
  return [
    next.getUTCFullYear(),
    String(next.getUTCMonth() + 1).padStart(2, "0"),
    String(next.getUTCDate()).padStart(2, "0"),
  ].join("-");
};

const emptyCounts = (types: string[]) =>
  Object.fromEntries(types.map((t) => [t, 0])) as Record<string, number>;

const tally = (
  rows: { sale_type: string }[],
  types: string[],
): { counts: Record<string, number>; total: number } => {
  const counts = emptyCounts(types);
  let total = 0;
  for (const r of rows) {
    if (!(r.sale_type in counts)) continue;
    counts[r.sale_type] += 1;
    total += 1;
  }
  return { counts, total };
};

/** Slot order, so a stack never reorders itself between two views. */
export const stackOrder = (types: string[]) =>
  [...types].sort((a, b) => typeOrder(a) - typeOrder(b));

/** Every day in the window, including the ones with nothing on them — a gap in
 *  a run of shifts is information, and dropping empty days would close it up
 *  and make a three-day cluster look continuous. */
export const byShift = (
  rows: CashierTransaction[],
  window: WeekWindow,
  types: string[],
): StackCategory[] => {
  const out: StackCategory[] = [];
  for (let day = window.start; day <= window.end; day = addDays(day, 1)) {
    const wd = weekdayOf(day);
    const onDay = rows.filter((r) => dayOf(r.sale_date) === day);
    out.push({
      key: day,
      label: String(Number(day.slice(8))),
      sublabel: INITIAL[wd],
      band: wd === 0 || wd === 6,
      ...tally(onDay, types),
    });
  }
  return out;
};

export const byWeekday = (
  rows: CashierTransaction[],
  types: string[],
): StackCategory[] =>
  WEEKDAY.map((label, i) => {
    const onDay = rows.filter((r) => weekdayOf(dayOf(r.sale_date)) === i);
    return {
      key: label,
      label,
      band: i === 0 || i === 6,
      emphasis: i === 0 || i === 6,
      ...tally(onDay, types),
    };
  });

const hourLabel = (h: number) => {
  const suffix = h < 12 ? "a" : "p";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}${suffix}`;
};

/**
 * By hour, trimmed to the hours that actually traded.
 *
 * Built from receipt LINES, not walked rows — the hour only exists on
 * `sale_start_time`. Lines carry every type on the receipt, so this filters to
 * the exception types the case is about rather than counting the whole basket.
 */
export const byHour = (
  lines: TransactionListItem[],
  types: string[],
): StackCategory[] => {
  const wanted = new Set(types);
  const buckets = new Map<number, { sale_type: string }[]>();

  for (const line of lines) {
    if (!wanted.has(line.sale_type)) continue;
    const h = hourOf(line);
    if (h < 0) continue;
    const list = buckets.get(h);
    if (list) list.push(line);
    else buckets.set(h, [line]);
  }
  if (buckets.size === 0) return [];

  const hours = [...buckets.keys()].sort((a, b) => a - b);
  const out: StackCategory[] = [];
  for (let h = hours[0]; h <= hours[hours.length - 1]; h += 1) {
    out.push({
      key: String(h),
      label: hourLabel(h),
      ...tally(buckets.get(h) ?? [], types),
    });
  }
  return out;
};

/**
 * The reference line on the shift chart: their own normal, per day.
 *
 * Divided by the days the window SPANS, not by the days they happened to work
 * — the same rule the rest of LP's grading uses. Dividing by days worked would
 * give a part-timer a higher bar than a full-timer for identical behaviour.
 */
export const baselinePerDay = (baseline: number, window: WeekWindow) => {
  const days =
    Math.round(
      (Date.parse(`${window.end}T12:00:00Z`) -
        Date.parse(`${window.start}T12:00:00Z`)) /
        86400000,
    ) + 1;
  return days > 0 ? baseline / days : 0;
};
