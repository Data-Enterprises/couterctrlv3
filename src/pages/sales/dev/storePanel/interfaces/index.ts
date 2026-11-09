// Interfaces
import type { DayDot } from "../../../../../interfaces";
import type { DayMatchedTotals, LyWindow } from "../../utils/ledgerUtils";

export type PopupTab =
  | "subdept"
  | "hourly"
  | "comparison"
  | "topitems"
  | "dailyrecap";

/** The searched week and the weeks it is compared with. */
export interface WeekWindow {
  twStart: string;
  twEnd: string;
  lwStart: string;
  lwEnd: string;
  /** The full 7 calendar days of the searched week. */
  twRealDates: string[];
  lyWindow: LyWindow;
  lyWeekDates: string[];
  lyStart: string;
  lyEnd: string;
  lwWeekDates: string[];
  /** The export's date line, with the year. */
  staticTwDate: string;
}

/** The KPI strip's date lines: the week, or the picked day. */
export interface DateLabels {
  twDateLabel: string;
  lwDateLabel: string;
  lyDateLabel: string;
}

/** The KPI strip's figures for the week or the picked day. */
export interface HeaderTotals {
  activeDay: DayDot | null | undefined;
  weekTotals: DayMatchedTotals;
  headerTwTotal: number;
  headerLwTotal: number | null;
  headerLyTotal: number | null;
  headerHasLW: boolean;
  headerHasLY: boolean;
  headerVsLWPct: number | null;
  headerVsLYPct: number | null;
  headerLYDays: number;
  headerLWDays: number;
  headerDays: number;
  noLyHistory: boolean;
}
