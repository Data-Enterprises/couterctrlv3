import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useSubMarginCtx } from "../../hooks";
import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import { calculateCogs, getLYDate } from "../..";
import { addDays } from "../../../../utils";
import { getHolidayName } from "../../../../utils/holidays";
import { StarIcon } from "@heroicons/react/20/solid";
import type { SubDeptMargin } from "../../../../interfaces";

const INSET_SHADOW = { boxShadow: "inset 0 -4px 0 rgba(30, 42, 74, 0.5)" };

const fmtPct = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
const fmtPts = (pts: number) => `${pts >= 0 ? "+" : ""}${pts.toFixed(1)} pts`;

const agg = (rows: SubDeptMargin[]) => {
  const sales = rows.reduce((acc, m) => acc + (m.total_sales - m.total_tax), 0);
  const cogs = rows.reduce(
    (acc, m) => acc + calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight),
    0,
  );
  return { sales, marginPct: sales > 0 ? ((sales - cogs) / sales) * 100 : 0 };
};

const byDate = (src: SubDeptMargin[], dateStr: string) =>
  src.filter((m) => m.sale_date.split("T")[0] === dateStr);

const MarginPerfDaySidebar = () => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const gradingMetric = useAppSelector((s) => s.subMargin.gradingMetric);
  const unit = gradingMetric === "margin" ? "pts" : "pct";

  const tyDates = useMemo(
    () =>
      Array.from(new Set(ctx.weekOneMargins.map((m) => m.sale_date.split("T")[0]))).sort(),
    [ctx.weekOneMargins],
  );

  const weekTw = useMemo(() => agg(ctx.weekOneMargins), [ctx.weekOneMargins]);
  const weekLy = useMemo(() => agg(ctx.weekOneMarginsLY), [ctx.weekOneMarginsLY]);
  const weekLw = useMemo(() => agg(ctx.weekTwoMargins), [ctx.weekTwoMargins]);

  const weekHasLY = weekLy.sales > 0;
  const weekHasLW = weekLw.sales > 0;
  const weekDelta = weekHasLY
    ? unit === "pts"
      ? weekTw.marginPct - weekLy.marginPct
      : ((weekTw.sales - weekLy.sales) / weekLy.sales) * 100
    : weekHasLW
      ? unit === "pts"
        ? weekTw.marginPct - weekLw.marginPct
        : ((weekTw.sales - weekLw.sales) / weekLw.sales) * 100
      : null;
  const weekSuffix = weekHasLY ? "LY" : weekHasLW ? "LW" : null;

  const firstDate = tyDates[0] ?? "";
  const lastDate = tyDates[tyDates.length - 1] ?? "";
  const fmtShort = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const weekRange = firstDate && lastDate ? `${fmtShort(firstDate)} – ${fmtShort(lastDate)}` : "";

  const allSelected = ctx.selectedWeekDay === "";

  return (
    <div className="flex border-b border-gray-100">
      {/* All week card */}
      <button
        onClick={() => dispatch(actions.setSelectedWeekDay(""))}
        className={`flex flex-col items-center justify-center px-3 py-2 border-r-2 border-gray-200 transition-colors flex-[1.3] ${
          allSelected ? "bg-gray-100" : "bg-gray-50 hover:bg-gray-100"
        }`}
        style={allSelected ? INSET_SHADOW : undefined}
      >
        <div className="text-[10px] font-bold text-content">All week</div>
        <div className="text-[8px] mt-0.5 text-content/35">{weekRange}</div>
        <div
          className={`text-[10px] font-semibold mt-0.5 ${
            weekDelta === null ? "text-content/25" : weekDelta < 0 ? "text-red-500" : "text-emerald-600"
          }`}
        >
          {weekDelta !== null
            ? `${unit === "pts" ? fmtPts(weekDelta) : fmtPct(weekDelta)} ${weekSuffix}`
            : "—"}
        </div>
      </button>

      {/* Day cards */}
      {tyDates.map((tyDate) => {
        const date = new Date(tyDate + "T12:00:00");
        const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" });
        const calLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const isSelected = ctx.selectedWeekDay === tyDate;

        const lyDate = getLYDate(tyDate);
        const lwDate = addDays(tyDate, -7).toISOString().split("T")[0];

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
            onClick={() => dispatch(actions.setSelectedWeekDay(isSelected ? "" : tyDate))}
            className={`relative flex flex-col items-center justify-center px-1 py-2 border-r border-gray-100 last:border-r-0 transition-colors flex-1 ${
              isSelected ? "bg-gray-100" : "bg-white hover:bg-gray-50"
            }`}
            style={isSelected ? INSET_SHADOW : undefined}
          >
            {holidayName && (
              <span title={holidayName} className="absolute top-1 right-1">
                <StarIcon className="w-2.5 h-2.5 text-amber-500" />
              </span>
            )}
            <div className="text-[10px] font-semibold text-content">{dayLabel}</div>
            <div className="text-[8px] mt-0.5 text-content/35">{calLabel}</div>
            <div
              className={`text-[9px] font-semibold mt-0.5 ${
                delta === null ? "text-content/25" : isNeg ? "text-red-500" : "text-emerald-600"
              }`}
            >
              {delta !== null ? `${unit === "pts" ? fmtPts(delta) : fmtPct(delta)} ${suffix}` : "—"}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default MarginPerfDaySidebar;
