import type { CashierTransaction, TransactionListItem } from "../../../../interfaces";
import type { WeekWindow } from "../../lpActionsMetrics";
import { weekdayOf } from "../../../lossPrevention/gradingUtils";
import { hourOf } from "../../case/hourProfile";
import { typeOrder } from "../../typeColour";

/**
 * The whole walked span, cut two ways: by weekday and by hour.
 *
 * The weekday costs nothing — it comes off `sale_date`, which the walk already
 * has. The hour does not: the walked row carries no time at all, only
 * `sale_start_time` on the receipt LINE does, so that chart waits on a read.
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
  /** Second axis line, under the main one. */
  sublabel?: string;
  counts: Record<string, number>;
  total: number;
  /** Shaded column — the weekend days. */
  band?: boolean;
  /** Heavier axis label. */
  emphasis?: boolean;
}

export const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const dayOf = (saleDate: string) => saleDate.slice(0, 10);

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

/** Inside the picked week, or anywhere when none is picked. */
const inWindow = (day: string, window?: WeekWindow | null) =>
  !window || (day >= window.start && day <= window.end);

/**
 * No weekend shading.
 *
 * Two of seven columns permanently greyed is a lot of ink for something a
 * reader already knows — Saturday is on the axis — and it competed with the
 * one column that genuinely needs marking, the picked one. The shading now
 * belongs to the selection instead.
 */
export const byWeekday = (
  rows: CashierTransaction[],
  types: string[],
  window?: WeekWindow | null,
): StackCategory[] =>
  WEEKDAY.map((label, i) => {
    const onDay = rows.filter((r) => {
      const day = dayOf(r.sale_date);
      return weekdayOf(day) === i && inWindow(day, window);
    });
    return { key: label, label, ...tally(onDay, types) };
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
  /** One weekday label, or null for every day. Narrowing the hours to a
   *  selected day is the question "when on Saturdays" — which neither chart
   *  answers alone. */
  weekday?: string | null,
  window?: WeekWindow | null,
): StackCategory[] => {
  const wanted = new Set(types);
  const buckets = new Map<number, { sale_type: string }[]>();

  for (const line of lines) {
    if (!wanted.has(line.sale_type)) continue;
    const day = dayOf(line.sale_date);
    if (!inWindow(day, window)) continue;
    if (weekday && WEEKDAY[weekdayOf(day)] !== weekday) continue;
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
