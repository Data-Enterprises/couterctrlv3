// Utils
import { addDays, sameWeekDayLastYear } from "../../../../../utils";

// Interfaces
import type { SalesCompRange, UpcSalesCompStats } from "./interfaces";
import type { UpcSalesComp } from "../../../../../interfaces";

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function rowTotal(row: UpcSalesComp): number {
  return DAYS.reduce((acc, d) => acc + (row[d] ?? 0), 0);
}

/**
 * One row per UPC per week, as everything downstream assumes.
 *
 * upload_upcs_daily_sales groups by description as well as UPC and week, so an
 * item whose sales rang under two descriptions — often one of them blank —
 * comes back as two rows for the same week. Left split, the period total
 * counted both while the week-by-week table showed only the first, and the
 * day-of-week averages divided by row count instead of week count.
 *
 * Days are summed, and the first non-blank description wins.
 */
export function combineSalesCompRows(rows: UpcSalesComp[]): UpcSalesComp[] {
  const byKey = new Map<string, UpcSalesComp>();
  for (const r of rows) {
    const key = `${r.product_code}|${r.week}`;
    const acc = byKey.get(key);
    if (!acc) {
      byKey.set(key, { ...r });
      continue;
    }
    for (const d of DAYS) {
      // Null only when neither side had a figure, so "no data" still reads
      // as no data rather than a zero.
      acc[d] = acc[d] === null && r[d] === null ? null : (acc[d] ?? 0) + (r[d] ?? 0);
    }
    if (!acc.description && r.description) acc.description = r.description;
  }
  return [...byKey.values()];
}

export function fmtWeekRange(weekStart: string): string {
  const start = new Date(weekStart);
  const end = addDays(weekStart, 6);
  const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${startStr} - ${endStr}`;
}

/** The range for a search, with last year's dates worked out the same way the
 *  tab's last-year call works them out. */
export function salesCompRange(startDate: string, endDate: string): SalesCompRange {
  return {
    start: startDate,
    end: endDate,
    lyStart: sameWeekDayLastYear(startDate).date,
    lyEnd: sameWeekDayLastYear(endDate).date,
  };
}

/** A date as a local midnight: "2026-09-07T00:00:00", "2026-09-07" or
 *  "9/7/2026". ISO without a time would otherwise parse as UTC and land on the
 *  day before anywhere in the US. */
export function dayOf(s: string): Date {
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const [m, d, y] = s.split("/").map(Number);
  return new Date(y, m - 1, d);
}

const plusDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/**
 * Whether a week's seven days all fall inside the searched range.
 *
 * Both ends. A range that starts mid-week makes its first week partial just as
 * one that ends mid-week makes its last, and only the end used to be checked:
 * a Wednesday start counted Wed-Sun as a full week, so flat sales read as up
 * 16.7% week over week. A partial week's total would skew both the "recent
 * week" figure and the average it's compared against, so it's left out of both.
 */
export function makeIsWeekComplete(startDate: string, endDate: string) {
  const first = dayOf(startDate);
  const last = dayOf(endDate);
  return (wk: string) => {
    const weekStart = dayOf(wk);
    return weekStart >= first && plusDays(weekStart, 6) <= last;
  };
}

const pad2 = (n: number) => String(n).padStart(2, "0");
const isoDay = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/**
 * Every week the range touches, by its Monday, written the way the endpoint
 * writes a row's week ("2026-09-07T00:00:00").
 *
 * The endpoint only answers weeks that sold, so the weeks have to come from
 * the range: built from the rows, a week with no sales simply wasn't there,
 * and an item that stopped selling in its last week read as flat or up.
 */
export function weeksIn(startDate: string, endDate: string): string[] {
  const end = dayOf(endDate);
  const start = dayOf(startDate);
  const weeks: string[] = [];
  for (let monday = plusDays(start, -((start.getDay() + 6) % 7)); monday <= end; monday = plusDays(monday, 7)) {
    weeks.push(`${isoDay(monday)}T00:00:00`);
  }
  return weeks;
}

/**
 * How many times each weekday falls in the range, Monday first.
 *
 * What a weekday's average divides by. Dividing by the number of weeks
 * understated any weekday the range holds fewer of: Monday 10/5 to Wednesday
 * 10/14 has two Mondays but one Saturday, so a $100 Saturday averaged $50 and
 * lost the peak to two $60 Mondays.
 */
export function weekdayCounts(startDate: string, endDate: string): number[] {
  const counts = DAYS.map(() => 0);
  const end = dayOf(endDate);
  for (let d = dayOf(startDate); d <= end; d = plusDays(d, 1)) counts[(d.getDay() + 6) % 7]++;
  return counts;
}

/**
 * Every UPC with sales in either year, this year's first.
 *
 * Built from this year's rows alone, an item that sold last year and nothing
 * this year wasn't in the list, the strip or the export at all: a -100% item
 * simply vanished.
 */
export function salesCompCodes(tyRows: UpcSalesComp[], lyRows: UpcSalesComp[]): string[] {
  return [...new Set([...tyRows.map((r) => r.product_code), ...lyRows.map((r) => r.product_code)])];
}

/** A week with no sales, for the week table: every day blank. */
const emptyWeek = (code: string, description: string, week: string): UpcSalesComp => ({
  product_code: code,
  description,
  week,
  Monday: null,
  Tuesday: null,
  Wednesday: null,
  Thursday: null,
  Friday: null,
  Saturday: null,
  Sunday: null,
});

// Per-UPC Total / vs LY / WoW / Peak day — shared by the table, the KPI
// strip, and the export summary so the three never drift out of sync.
export function computeUpcSalesCompStats(
  upcCodes: string[],
  tyRows: UpcSalesComp[],
  lyRows: UpcSalesComp[],
  range: SalesCompRange,
): UpcSalesCompStats[] {
  const isWeekComplete = makeIsWeekComplete(range.start, range.end);
  const rangeWeeks = weeksIn(range.start, range.end);
  const tyDays = weekdayCounts(range.start, range.end);
  const lyDays = weekdayCounts(range.lyStart, range.lyEnd);

  return upcCodes.map((code) => {
    const rows = tyRows.filter((r) => r.product_code === code);
    const lyRowsForCode = lyRows.filter((r) => r.product_code === code);
    // Last year's description for an item that only sold last year.
    const desc =
      rows.find((r) => r.description)?.description ||
      lyRowsForCode.find((r) => r.description)?.description ||
      code;
    // Every week in the range, sold or not, plus any week a row carries that
    // the range somehow doesn't. Matched on the date alone, so the row's own
    // spelling of its week doesn't matter.
    const byWeek = new Map(rows.map((r) => [r.week.slice(0, 10), r]));
    const sortedWeeks = [
      ...new Set([...rangeWeeks.map((w) => w.slice(0, 10)), ...byWeek.keys()]),
    ].sort((a, b) => a.localeCompare(b));

    // Per occurrence of that weekday in the range: see weekdayCounts.
    const dayAvgs = DAYS.map(
      (d, i) => rows.reduce((acc, r) => acc + (r[d] ?? 0), 0) / (tyDays[i] || 1),
    );
    const periodTotal = rows.reduce((acc, r) => acc + rowTotal(r), 0);
    // No peak without sales: -1, shown as a dash. indexOf(max) of seven zeros
    // would otherwise name Monday.
    const peakIdx = periodTotal > 0 ? dayAvgs.indexOf(Math.max(...dayAvgs)) : -1;

    const weekRows = sortedWeeks.map((day) => {
      const row = byWeek.get(day);
      const week = row?.week ?? `${day}T00:00:00`;
      return { week, row: row ?? emptyWeek(code, desc, week) };
    });
    // A week that sold nothing is a 0, here and in the average it's compared
    // against.
    const weekTotals = weekRows.map(({ row }) => rowTotal(row));
    const completeTotals = weekRows
      .map(({ week }, i) => (isWeekComplete(week) ? weekTotals[i] : null))
      .filter((v): v is number => v !== null);
    let wowPct: number | null = null;
    if (completeTotals.length >= 2) {
      const lw = completeTotals[completeTotals.length - 1];
      const avg = completeTotals.reduce((a, b) => a + b, 0) / completeTotals.length;
      wowPct = avg === 0 ? null : ((lw - avg) / avg) * 100;
    }

    const hasLY = lyRowsForCode.length > 0;
    const lyDayAvgs = DAYS.map(
      (d, i) => lyRowsForCode.reduce((acc, r) => acc + (r[d] ?? 0), 0) / (lyDays[i] || 1),
    );
    const lyPeriodTotal = lyRowsForCode.reduce((acc, r) => acc + rowTotal(r), 0);
    const lyPeakIdx = hasLY && lyPeriodTotal > 0 ? lyDayAvgs.indexOf(Math.max(...lyDayAvgs)) : -1;
    const vsLYPct = hasLY && lyPeriodTotal > 0 ? ((periodTotal - lyPeriodTotal) / lyPeriodTotal) * 100 : null;
    const peakShifted = peakIdx >= 0 && lyPeakIdx >= 0 && lyPeakIdx !== peakIdx;

    const dayDeltaPcts = DAYS.map((_, di) =>
      hasLY && lyDayAvgs[di] > 0 ? ((dayAvgs[di] - lyDayAvgs[di]) / lyDayAvgs[di]) * 100 : null,
    );
    const rowMax = Math.max(...dayAvgs, 1);

    const activeDayCount = weekRows.reduce(
      (count, { row }) => count + DAYS.filter((d) => (row[d] ?? 0) > 0).length,
      0,
    );
    const avgDaily = activeDayCount > 0 ? periodTotal / activeDayCount : 0;

    return {
      code, desc, dayAvgs, peakIdx, periodTotal, weekTotals, weekRows, wowPct,
      hasLY, lyDayAvgs, lyPeakIdx, lyPeriodTotal, vsLYPct, peakShifted,
      dayDeltaPcts, rowMax, avgDaily,
    };
  });
}
