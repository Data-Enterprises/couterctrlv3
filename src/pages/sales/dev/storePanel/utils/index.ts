// Utils
import { addDays, formatGoliathDate, sameWeekDayLastYear } from "../../../../../utils";
import { computeDayMatchedTotals, describeLyWindow } from "../../utils/ledgerUtils";

// Interfaces
import type { GradingMetric } from "../../../../../features/dev/devSalesLedgerSlice";
import type { DayDot } from "../../../../../interfaces";
import type {
  DateLabels,
  HeaderTotals,
  PopupTab,
  WeekWindow,
} from "../interfaces";

const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

/** The searched week (ending on `singleDate`), last week, and last year's
 *  matched days. */
export const buildWeekWindow = (singleDate: string): WeekWindow => {
const twStart = addDays(singleDate, -6).toISOString().split("T")[0];
const twEnd = formatGoliathDate(singleDate);
const lwStart = addDays(singleDate, -13).toISOString().split("T")[0];
const lwEnd = addDays(singleDate, -7).toISOString().split("T")[0];
// The full 7 calendar days of the searched week — deliberately NOT
// selection.days (the store's weekly-sales row list), which only has an
// entry for days that list actually returned a row for. A day missing
// there doesn't mean this specific dept/hour/item has no real data for
// it — using the true calendar range means every entity's LW/LY match is
// scoped to its own genuine data, not gated by a different fetch's gaps.
const twRealDates = Array.from(
  { length: 7 },
  (_, i) => addDays(new Date(twStart), i).toISOString().split("T")[0],
);
/**
 * What the LY comparison actually looks at, as opposed to what was fetched.
 *
 * `lyStart`/`lyEnd` are min/max of the shifted dates and exist to make the
 * FETCH wide enough — a Labor Day in this week matches Labor Day last year,
 * which can sit ten days from the rest of the week, and the row has to be
 * inside the requested range. Printing those bounds as the label is what put
 * "Sep 1 – Sep 11" over a seven-day week.
 */
const lyWindow = describeLyWindow(twRealDates);
const lyWeekDates = [...lyWindow.dates].sort();
const lyStart = lyWeekDates[0];
const lyEnd = lyWeekDates[lyWeekDates.length - 1];
const lwWeekDates = twRealDates.map(
  (d) => addDays(new Date(d), -7).toISOString().split("T")[0],
);

const twYear = new Date(twEnd + "T12:00:00").getFullYear();

// Static range strings
const staticTwDate = `${fmtDate(twStart)} – ${fmtDate(twEnd)}, ${twYear}`;

  return {
    twStart,
    twEnd,
    lwStart,
    lwEnd,
    twRealDates,
    lyWindow,
    lyWeekDates,
    lyStart,
    lyEnd,
    lwWeekDates,
    staticTwDate,
  };
};

export const buildDateLabels = (
  { twStart, twEnd, lwStart, lwEnd, lyWindow }: WeekWindow,
  selectedDate: string | null,
): DateLabels => {
// Dynamic date labels — update when a day is selected
const twDateLabel = selectedDate
  ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  : `${fmtDate(twStart)} – ${fmtDate(twEnd)}`;
const lwDateLabel = selectedDate
  ? new Date(
      addDays(new Date(selectedDate), -7).toISOString().split("T")[0] +
        "T12:00:00",
    ).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  : `${fmtDate(lwStart)} – ${fmtDate(lwEnd)}`;
const lyDateLabel = selectedDate
  ? (() => {
      const label = new Date(
        sameWeekDayLastYear(selectedDate).date + "T12:00:00",
      ).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      // A holiday is matched to last year's holiday rather than shifted by
      // weekday, so this date deliberately breaks the pattern of the days
      // either side of it. Unnamed, it reads as an off-by-something.
      const hol = lyWindow.holidays.find((h) => h.twDate === selectedDate);
      return hol ? `${label} · ${hol.name}` : label;
    })()
  : lyWindow.label;

  return { twDateLabel, lwDateLabel, lyDateLabel };
};

export const buildHeaderTotals = (
  days: DayDot[],
  selectedDate: string | null,
  gradingMetric: GradingMetric,
): HeaderTotals => {
  const isQty = gradingMetric === "qty";
// KPI strip values — full week or selected day
const sortedDays = [...days].sort((a, b) =>
  a.sale_date.localeCompare(b.sale_date),
);
const activeDay = selectedDate
  ? sortedDays.find((d) => d.sale_date.startsWith(selectedDate))
  : null;
// Whole-week figures go through computeDayMatchedTotals so the header
// agrees with the left panel and day strip — the TW side of each
// comparison is restricted to just the days with a genuine LW/LY match,
// same as buildLedgerRows/PopupDaySidebar. A single selected day has no
// aggregation to do, but its lwNet/lyNet (or lwQty/lyQty) can still be
// null (no match). Every figure below follows gradingMetric — Sales
// shows dollars, Qty shows units — same toggle as the left panel.
const weekTotals = computeDayMatchedTotals(sortedDays, gradingMetric);
const headerTwTotal = activeDay
  ? isQty
    ? activeDay.twQty
    : activeDay.twNet
  : isQty
    ? weekTotals.twQty
    : weekTotals.twTotal;
const headerLwTotal = activeDay
  ? isQty
    ? activeDay.lwQty
    : activeDay.lwNet
  : isQty
    ? weekTotals.lwQty
    : weekTotals.lwTotal;
const headerLyTotal = activeDay
  ? isQty
    ? activeDay.lyQty
    : activeDay.lyNet
  : isQty
    ? weekTotals.lyQty
    : weekTotals.lyTotal;
const headerHasLW = activeDay
  ? isQty
    ? activeDay.lwQty !== null && activeDay.lwQty > 0
    : activeDay.lwNet !== null && activeDay.lwNet > 0
  : weekTotals.hasLW;
const headerHasLY = activeDay
  ? isQty
    ? activeDay.lyQty !== null && activeDay.lyQty > 0
    : activeDay.lyNet !== null && activeDay.lyNet > 0
  : weekTotals.hasLY;
const headerVsLWPct = activeDay
  ? headerHasLW
    ? isQty
      ? ((activeDay.twQty - (activeDay.lwQty as number)) /
          (activeDay.lwQty as number)) *
        100
      : ((activeDay.twNet - (activeDay.lwNet as number)) /
          (activeDay.lwNet as number)) *
        100
    : null
  : weekTotals.hasLW
    ? weekTotals.vsLWPct
    : null;
/**
 * How much of the week each comparison covers.
 *
 * A selected day is its own comparison, so it is one of one or it has no
 * pill at all. The week is where this matters: three matched days out of
 * seven produced a -12.07% that read exactly like a complete one.
 */
const headerLYDays = activeDay ? 1 : weekTotals.lyDayCount;
const headerLWDays = activeDay ? 1 : weekTotals.lwDayCount;
const headerDays = activeDay ? 1 : weekTotals.dayCount;
/** No matching last-year row at all — for the week, not one day of it; for a
 *  selected day, its one date. Distinct from a genuine $0 day, which has a
 *  row (lyNet 0, not null). */
const noLyHistory = activeDay
  ? activeDay.lyNet === null
  : headerDays > 0 && headerLYDays === 0;
const headerVsLYPct = activeDay
  ? headerHasLY
    ? isQty
      ? ((activeDay.twQty - (activeDay.lyQty as number)) /
          (activeDay.lyQty as number)) *
        100
      : ((activeDay.twNet - (activeDay.lyNet as number)) /
          (activeDay.lyNet as number)) *
        100
    : null
  : weekTotals.hasLY
    ? weekTotals.vsLYPct
    : null;

  return {
    activeDay,
    weekTotals,
    headerTwTotal,
    headerLwTotal,
    headerLyTotal,
    headerHasLW,
    headerHasLY,
    headerVsLWPct,
    headerVsLYPct,
    headerLYDays,
    headerLWDays,
    headerDays,
    noLyHistory,
  };
};

/** The header strip's pills grade on the store-row threshold. */
export const THRESHOLD = 9;

/** Each store panel tab's name. */
export const LABELS: Record<PopupTab, string> = {
  dailyrecap: "Summary",
  subdept: "Sub depts",
  comparison: "Compare",
  hourly: "Hourly",
  topitems: "Top 200",
};
