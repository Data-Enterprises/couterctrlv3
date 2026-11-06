// Interfaces
import type { UpcSalesComp } from "../../../../../../interfaces";

/**
 * The dates a Sales Comp answer covers: the search's, and last year's that the
 * tab asked for alongside them. Any of the app's date forms: m/d/yyyy, or ISO
 * with or without a time.
 */
export type SalesCompRange = { start: string; end: string; lyStart: string; lyEnd: string };

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
  // Day-of-week % change vs LY, and this item's own peak-day scale for
  // heat coloring — both derived once here so the list, detail panel, and
  // export summary all read the same numbers.
  dayDeltaPcts: (number | null)[];
  rowMax: number;
  // Total ÷ count of individual (week, weekday) cells that actually had a
  // sale — a true per-active-day average. The KPI strip counts days the same
  // way, so with one UPC selected the two agree.
  avgDaily: number;
};

export type StatusTone = "up" | "down" | "flat" | "muted";

export type StatusPhrase = { text: string; tone: StatusTone };

export type Direction = "up" | "flat" | "down";

export type Trajectory = "improving" | "flat" | "declining";
