// Interfaces
import type { UpcSalesComp } from "../../../../../../interfaces";

/**
 * The dates a Sales Comp answer covers: the search's, and last year's. Any of
 * the app's date forms (m/d/yyyy, or ISO with or without a time).
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
  // Day-of-week % change vs LY, and the item's peak-day scale for heat
  // colouring, derived once so list, detail and export agree.
  dayDeltaPcts: (number | null)[];
  rowMax: number;
  // Total ÷ (week, weekday) cells that had a sale: a per-active-day average,
  // counted the same way as the KPI strip.
  avgDaily: number;
};

export type StatusTone = "up" | "down" | "flat" | "muted";

export type StatusPhrase = { text: string; tone: StatusTone };

export type Direction = "up" | "flat" | "down";

export type Trajectory = "improving" | "flat" | "declining";
