// Utils
import { formatCurrency2, formatBigNumber } from "../../../../../utils";
import { fmtDayLabel, fmtRangeLabel } from "../../../../../utils/dateLabels";
import { gradeBasis, type Coverage } from "../../../../../utils/grading";
import {
  pctChange,
  shiftIso,
  LW_OFFSET,
  LY_OFFSET,
  tierOf,
  formatHour,
  type CategoryDay,
  type CategoryRow,
} from "../../utils";

// Interfaces
import type { DayCardEntry } from "../../../../../components-dev/interfaces";
import type { HourListRow, HourRow } from "../interfaces";

/** A figure as the detail panel shows it: whole units, or exact currency. */
export const fmtDetail = (isQty: boolean, n: number) =>
  isQty ? formatBigNumber(n, 0) : formatCurrency2(n);

const dayTw = (d: CategoryDay, isQty: boolean) => (isQty ? d.twQty : d.twNet);
const dayLw = (d: CategoryDay, isQty: boolean) => (isQty ? d.lwQty : d.lwNet);
const dayLy = (d: CategoryDay, isQty: boolean) => (isQty ? d.lyQty : d.lyNet);

/** The KPI figures: the whole week, or the selected day, against LW and LY. */
export const kpiFigures = (
  row: CategoryRow,
  activeDay: CategoryDay | null,
  isQty: boolean,
) => {
  const twValue = activeDay
    ? dayTw(activeDay, isQty)
    : isQty
      ? row.twQty
      : row.twNet;
  const lwValue = activeDay
    ? dayLw(activeDay, isQty)
    : row.hasLW
      ? isQty
        ? row.lwQty
        : row.lwNet
      : null;
  const lyValue = activeDay
    ? dayLy(activeDay, isQty)
    : row.hasLY
      ? isQty
        ? row.lyQty
        : row.lyNet
      : null;
  const twForLW = activeDay
    ? dayTw(activeDay, isQty)
    : isQty
      ? row.twQtyForLW
      : row.twNetForLW;
  const twForLY = activeDay
    ? dayTw(activeDay, isQty)
    : isQty
      ? row.twQtyForLY
      : row.twNetForLY;
  const lwPct =
    lwValue === null || lwValue === 0 ? null : pctChange(twForLW, lwValue);
  const lyPct =
    lyValue === null || lyValue === 0 ? null : pctChange(twForLY, lyValue);
  return { twValue, lwValue, lyValue, lwPct, lyPct };
};

/** The KPI date lines: the selected day and its LW and LY days, or the weeks. */
export const periodLabels = (
  selectedDay: string | null,
  twStart: string,
  twEnd: string,
) => ({
  twLabel: selectedDay
    ? fmtDayLabel(selectedDay)
    : fmtRangeLabel(twStart, twEnd),
  lwLabel: selectedDay
    ? fmtDayLabel(shiftIso(selectedDay, LW_OFFSET))
    : fmtRangeLabel(shiftIso(twStart, LW_OFFSET), shiftIso(twEnd, LW_OFFSET)),
  lyLabel: selectedDay
    ? fmtDayLabel(shiftIso(selectedDay, LY_OFFSET))
    : fmtRangeLabel(shiftIso(twStart, LY_OFFSET), shiftIso(twEnd, LY_OFFSET)),
});

/**
 * The week's days, graded. Each card names its own baseline: a day with a
 * last-year figure is graded against LY, one without falls back to LW, and
 * the card says which. The hover title carries the actual baseline value.
 */
export const dayCardsFor = (row: CategoryRow, isQty: boolean): DayCardEntry[] =>
  row.days.map((d) => {
    const l = dayLw(d, isQty);
    const y = dayLy(d, isQty);
    const lp = l === null || l === 0 ? null : pctChange(dayTw(d, isQty), l);
    const yp = y === null || y === 0 ? null : pctChange(dayTw(d, isQty), y);
    return {
      iso: d.date,
      value: fmtDetail(isQty, dayTw(d, isQty)),
      delta: yp ?? lp,
      basis: yp !== null ? "LY" : lp !== null ? "LW" : undefined,
      deltaTitle:
        yp !== null
          ? `vs last year: ${fmtDetail(isQty, y as number)}`
          : lp !== null
            ? `vs last week: ${fmtDetail(isQty, l as number)}`
            : "No baseline",
    };
  });

/** The whole week's change against LW and LY, for the strip's leading card,
 *  which is always the week, never the selected day. */
export const weekDeltas = (row: CategoryRow, isQty: boolean) => {
  const weekLwValue = row.hasLW ? (isQty ? row.lwQty : row.lwNet) : null;
  const weekLyValue = row.hasLY ? (isQty ? row.lyQty : row.lyNet) : null;
  return {
    weekLwPct:
      weekLwValue === null || weekLwValue === 0
        ? null
        : pctChange(isQty ? row.twQtyForLW : row.twNetForLW, weekLwValue),
    weekLyPct:
      weekLyValue === null || weekLyValue === 0
        ? null
        : pctChange(isQty ? row.twQtyForLY : row.twNetForLY, weekLyValue),
  };
};

/** The hours as the list draws them. The category's coverage applies to its
 *  hours: last year only when it covers the whole week, else last week, else
 *  ungraded. */
export const hourList = (
  hourRows: HourRow[],
  cov: Coverage,
  threshold: number,
): HourListRow[] =>
  hourRows.map((h) => {
    const basis = gradeBasis(
      { hasLY: h.lyPct !== null, hasLW: h.lwPct !== null },
      cov,
    );
    const shownPct = basis === "LY" ? h.lyPct : basis === "LW" ? h.lwPct : null;
    return {
      key: String(h.hour),
      label: formatHour(h.hour),
      value: h.tw,
      lp: h.lwPct,
      yp: h.lyPct,
      shownPct,
      sev: tierOf(shownPct, threshold),
    };
  });

/** The report column for the picked hour, or null when none is picked. */
export const hourReport = (
  hourRows: HourRow[],
  selectedHour: number | null,
  isQty: boolean,
) => {
  const h = hourRows.find((x) => x.hour === selectedHour);
  if (!h?.detail) return null;
  const dt = h.detail;
  return {
    title: formatHour(h.hour),
    stats: [
      ["Gross sales", formatCurrency2(dt.gross)],
      ["Net sales", formatCurrency2(dt.v)],
      ["Tax", formatCurrency2(dt.tax)],
      ["Units", formatBigNumber(dt.qty, 0)],
      [
        "Avg basket",
        isQty
          ? formatBigNumber(dt.basket / Math.max(dt.n, 1), 0)
          : formatCurrency2(dt.basket / Math.max(dt.n, 1)),
      ],
      ["Avg item price", formatCurrency2(dt.avgPrice / Math.max(dt.n, 1))],
    ] as [string, string][],
  };
};
