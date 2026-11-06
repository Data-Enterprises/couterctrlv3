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
 * One row per UPC per week. upload_upcs_daily_sales also groups by
 * description, so an item rung under two descriptions comes back as two rows a
 * week; days are summed, and the first non-blank description wins.
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

/** A date as a local midnight, from "2026-09-07T00:00:00", "2026-09-07" or
 *  "9/7/2026" (a bare ISO date would parse as UTC, the day before in the US). */
export function dayOf(s: string): Date {
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const [m, d, y] = s.split("/").map(Number);
  return new Date(y, m - 1, d);
}

const plusDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/**
 * Whether a week's seven days all fall inside the searched range, at both
 * ends. A partial week is left out of both the "recent week" figure and the
 * average it's compared against.
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
 * Every week the range touches, by its Monday, in the endpoint's own form
 * ("2026-09-07T00:00:00"). From the range, not the rows: the endpoint omits
 * weeks with no sales.
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
 * How many times each weekday falls in the range, Monday first: what a
 * weekday's average divides by (not the week count, which skews weekdays the
 * range holds fewer of).
 */
export function weekdayCounts(startDate: string, endDate: string): number[] {
  const counts = DAYS.map(() => 0);
  const end = dayOf(endDate);
  for (let d = dayOf(startDate); d <= end; d = plusDays(d, 1)) counts[(d.getDay() + 6) % 7]++;
  return counts;
}

/**
 * Every UPC with sales in either year, this year's first, so an item that
 * stopped selling still shows (at -100%).
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
    // Every week in the range, sold or not, plus any week a row carries outside
    // it, matched on the date alone.
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
