// Hooks
import { useMemo } from "react";
import { useAppDispatch } from "../../../../hooks";
import { useSubMarginCtx, useSubMarginActions, useSubMarginState } from "../hooks";

// Utils
import { getLYDate } from "../../../../utils/dates";
import { formatCurrency2 } from "../../../../utils";
import { getHolidayName } from "../../../../utils/holidays";
import { gradeBasis, type Coverage, shiftIso } from "../../../../utils/grading";
import { agg, byDate, fmtPct, fmtPts } from "../utils";

// Interfaces
import type { SubDeptMargin } from "../../../../interfaces";

// Components
import { StarIcon } from "@heroicons/react/20/solid";

interface MarginPerfDaySidebarProps {
  /** The store's coverage for the week — the All Week card grades on last
   *  year only when it covers every day. See utils/grading. */
  coverage?: Coverage;
}

/** The day column beside a sub dept's margin panel: an All Week card plus one card per day with its figure
 *  and change vs last year (or last week). Clicking a day filters the panel to it; a holiday gets a star. */
const MarginPerfDaySidebar = ({ coverage }: MarginPerfDaySidebarProps) => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const { gradingMetric } = useSubMarginState();
  const unit = gradingMetric === "margin" ? "pts" : "pct";

  const tyDates = useMemo(
    () =>
      Array.from(
        new Set(ctx.weekOneMargins.map((m) => m.sale_date.split("T")[0])),
      ).sort(),
    [ctx.weekOneMargins],
  );

  const weekTw = useMemo(() => agg(ctx.weekOneMargins), [ctx.weekOneMargins]);

  // Day-matched: each comparison uses only the TY days that found a
  // counterpart, and the week grades on last year only when that covers
  // every day — the same rule as the sub-dept list.
  const week = useMemo(() => {
    const day = (m: SubDeptMargin) => m.sale_date.split("T")[0];
    const lwOf = (d: string) => shiftIso(d, -7);
    const lwDates = new Set(ctx.weekTwoMargins.map(day));
    const lyDates = new Set(ctx.weekOneMarginsLY.map(day));
    const lwWanted = new Set(tyDates.map(lwOf));
    const lyWanted = new Set(tyDates.map((d) => getLYDate(d)));
    const twLw = agg(ctx.weekOneMargins.filter((m) => lwDates.has(lwOf(day(m)))));
    const twLy = agg(ctx.weekOneMargins.filter((m) => lyDates.has(getLYDate(day(m)))));
    const lw = agg(ctx.weekTwoMargins.filter((m) => lwWanted.has(day(m))));
    const ly = agg(ctx.weekOneMarginsLY.filter((m) => lyWanted.has(day(m))));
    return { twLw, twLy, lw, ly };
  }, [ctx.weekOneMargins, ctx.weekTwoMargins, ctx.weekOneMarginsLY, tyDates]);

  const primaryValue = (a: { sales: number; marginPct: number }) =>
    gradingMetric === "margin" ? `${a.marginPct.toFixed(2)}%` : formatCurrency2(a.sales);

  const cmp = (tw: { sales: number; marginPct: number }, ref: { sales: number; marginPct: number }) =>
    unit === "pts" ? tw.marginPct - ref.marginPct : ((tw.sales - ref.sales) / ref.sales) * 100;
  const weekSuffix = gradeBasis(
    { hasLY: week.ly.sales > 0, hasLW: week.lw.sales > 0 },
    coverage ?? { dayCount: 0, lwDayCount: 0, lyDayCount: 0 },
  );
  const weekDelta =
    weekSuffix === "LY"
      ? cmp(week.twLy, week.ly)
      : weekSuffix === "LW"
        ? cmp(week.twLw, week.lw)
        : null;
  const weekIsNeg = weekDelta !== null && weekDelta < 0;

  const firstDate = tyDates[0] ?? "";
  const lastDate = tyDates[tyDates.length - 1] ?? "";
  const fmtShort = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  const weekRange =
    firstDate && lastDate
      ? `${fmtShort(firstDate)} – ${fmtShort(lastDate)}`
      : "";

  const allSelected = ctx.selectedWeekDay === "";

  return (
    <div className="flex gap-1.5 p-1.5 border-b border-gray-100 bg-gray-50">
      {/* All week card */}
      <button
        onClick={() => dispatch(actions.setSelectedWeekDay(""))}
        className={`flex flex-col rounded-md overflow-hidden flex-[1.3] border transition-colors ${
          allSelected
            ? "border-brand_navy ring-2 ring-brand_navy/30"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-0.5 py-2 px-1 bg-custom-white">
          <div className="text-[9px] font-bold uppercase tracking-wide text-content">
            All Week
          </div>
          <div className="text-[12px] font-bold text-content leading-none">{weekRange}</div>
          <div className="text-[12px] font-bold text-content mt-1">{primaryValue(weekTw)}</div>
          <div
            className={`text-[11px] font-semibold ${
              weekDelta === null
                ? "text-content"
                : weekIsNeg
                  ? "text-severity_critical_text"
                  : "text-severity_healthy_text"
            }`}
          >
            {weekDelta !== null
              ? `${weekIsNeg ? "▼" : "▲"} ${unit === "pts" ? fmtPts(weekDelta) : fmtPct(weekDelta)} ${weekSuffix}`
              : "—"}
          </div>
        </div>
      </button>

      {/* Day cards */}
      {tyDates.map((tyDate) => {
        const date = new Date(tyDate + "T12:00:00");
        const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
        const dateNum = `${date.getMonth() + 1}/${date.getDate()}`;
        const isSelected = ctx.selectedWeekDay === tyDate;

        const lyDate = getLYDate(tyDate);
        const lwDate = shiftIso(tyDate, -7);

        const twDay = agg(byDate(ctx.weekOneMargins, tyDate));
        const lyDay = agg(byDate(ctx.weekOneMarginsLY, lyDate));
        const lwDay = agg(byDate(ctx.weekTwoMargins, lwDate));

        const hasLY = lyDay.sales > 0;
        const hasLW = lwDay.sales > 0;
        const delta = hasLY
          ? unit === "pts"
            ? twDay.marginPct - lyDay.marginPct
            : ((twDay.sales - lyDay.sales) / lyDay.sales) * 100
          : hasLW
            ? unit === "pts"
              ? twDay.marginPct - lwDay.marginPct
              : ((twDay.sales - lwDay.sales) / lwDay.sales) * 100
            : null;
        const suffix = hasLY ? "LY" : hasLW ? "LW" : null;
        const isNeg = delta !== null && delta < 0;
        const holidayName = getHolidayName(tyDate);

        return (
          <button
            key={tyDate}
            onClick={() =>
              dispatch(actions.setSelectedWeekDay(isSelected ? "" : tyDate))
            }
            className={`relative flex flex-col rounded-md overflow-hidden flex-1 border transition-colors ${
              isSelected
                ? "border-brand_navy ring-2 ring-brand_navy/30"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {holidayName && (
              <span
                title={holidayName}
                className="absolute top-1 right-1 z-10"
              >
                <StarIcon className="w-2.5 h-2.5 text-amber-500" />
              </span>
            )}
            <div className="flex flex-col items-center justify-center gap-0.5 py-2 px-1 bg-custom-white">
              <div className="text-[9px] font-bold uppercase tracking-wide text-content">
                {dayName}
              </div>
              <div className="text-[12px] font-bold text-content leading-none">
                {dateNum}
              </div>
              <div className="text-[12px] font-bold text-content mt-1">
                {primaryValue(twDay)}
              </div>
              <div
                className={`text-[11px] font-semibold ${
                  delta === null
                    ? "text-content"
                    : isNeg
                      ? "text-severity_critical_text"
                      : "text-severity_healthy_text"
                }`}
              >
                {delta !== null
                  ? `${isNeg ? "▼" : "▲"} ${unit === "pts" ? fmtPts(delta) : fmtPct(delta)} ${suffix}`
                  : "—"}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default MarginPerfDaySidebar;
