import { addDays } from "../../../../../utils";
import type { UpcSalesComp } from "../../../../../interfaces";

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function rowTotal(row: UpcSalesComp): number {
  return DAYS.reduce((acc, d) => acc + (row[d] ?? 0), 0);
}

// A trailing week whose 7-day span hasn't fully elapsed within the query
// range is "incomplete" — its partial total would skew both the "recent
// week" value and the average it's compared against if left in.
export function makeIsWeekComplete(endDate: string) {
  const queryEndDate = new Date(endDate);
  return (wk: string) => addDays(wk, 6) <= queryEndDate;
}

export type UpcSalesCompStats = {
  code: string;
  desc: string;
  dayAvgs: number[];
  peakIdx: number;
  periodTotal: number;
  weekTotals: number[];
  weekRows: { week: string; row: UpcSalesComp }[];
  wowPct: number | null;
  hasLY: boolean;
  lyDayAvgs: number[];
  lyPeakIdx: number;
  lyPeriodTotal: number;
  vsLYPct: number | null;
  peakShifted: boolean;
};

// Per-UPC Total / vs LY / WoW / Peak day — shared by the table, the KPI
// strip, and the export summary so the three never drift out of sync.
export function computeUpcSalesCompStats(
  upcCodes: string[],
  tyRows: UpcSalesComp[],
  lyRows: UpcSalesComp[],
  endDate: string,
): UpcSalesCompStats[] {
  const isWeekComplete = makeIsWeekComplete(endDate);

  return upcCodes.map((code) => {
    const rows = tyRows.filter((r) => r.product_code === code);
    const desc = rows[0]?.description ?? code;
    const sortedWeeks = [...new Set(rows.map((r) => r.week))].sort((a, b) => a.localeCompare(b));
    const weekCount = rows.length;

    const dayAvgs = DAYS.map((d) =>
      rows.reduce((acc, r) => acc + (r[d] ?? 0), 0) / (weekCount || 1),
    );
    const peakIdx = dayAvgs.indexOf(Math.max(...dayAvgs));
    const periodTotal = rows.reduce((acc, r) => acc + rowTotal(r), 0);

    const weekTotals = sortedWeeks.map(
      (wk) => rowTotal(rows.find((r) => r.week === wk)!),
    );
    const completeTotals = sortedWeeks
      .map((wk, i) => (isWeekComplete(wk) ? weekTotals[i] : null))
      .filter((v): v is number => v !== null);
    let wowPct: number | null = null;
    if (completeTotals.length >= 2) {
      const lw = completeTotals[completeTotals.length - 1];
      const avg = completeTotals.reduce((a, b) => a + b, 0) / completeTotals.length;
      wowPct = avg === 0 ? null : ((lw - avg) / avg) * 100;
    }

    const weekRows = sortedWeeks.map((wk) => ({
      week: wk,
      row: rows.find((r) => r.week === wk)!,
    }));

    const lyRowsForCode = lyRows.filter((r) => r.product_code === code);
    const hasLY = lyRowsForCode.length > 0;
    const lyDayAvgs = DAYS.map((d) =>
      lyRowsForCode.reduce((acc, r) => acc + (r[d] ?? 0), 0) / (lyRowsForCode.length || 1),
    );
    const lyPeakIdx = hasLY ? lyDayAvgs.indexOf(Math.max(...lyDayAvgs)) : -1;
    const lyPeriodTotal = lyRowsForCode.reduce((acc, r) => acc + rowTotal(r), 0);
    const vsLYPct = hasLY && lyPeriodTotal > 0 ? ((periodTotal - lyPeriodTotal) / lyPeriodTotal) * 100 : null;
    const peakShifted = hasLY && lyPeakIdx !== peakIdx;

    return {
      code, desc, dayAvgs, peakIdx, periodTotal, weekTotals, weekRows, wowPct,
      hasLY, lyDayAvgs, lyPeakIdx, lyPeriodTotal, vsLYPct, peakShifted,
    };
  });
}
