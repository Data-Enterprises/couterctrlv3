import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useSubMarginCtx } from "../../hooks";
import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import { calculateCogs, getLYDate } from "../..";
import { addDays, formatCurrency2 } from "../../../../utils";
import { getHolidayName } from "../../../../utils/holidays";
import { StarIcon } from "@heroicons/react/20/solid";
import type { SubDeptMargin } from "../../../../interfaces";

const fmtPct = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
const fmtPts = (pts: number) => `${pts >= 0 ? "+" : ""}${pts.toFixed(1)} pts`;

const agg = (rows: SubDeptMargin[]) => {
  const sales = rows.reduce((acc, m) => acc + (m.total_sales - m.total_tax), 0);
  const cogs = rows.reduce(
    (acc, m) =>
      acc + calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight),
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
      Array.from(
        new Set(ctx.weekOneMargins.map((m) => m.sale_date.split("T")[0])),
      ).sort(),
    [ctx.weekOneMargins],
  );

  const weekTw = useMemo(() => agg(ctx.weekOneMargins), [ctx.weekOneMargins]);
  const weekLy = useMemo(
    () => agg(ctx.weekOneMarginsLY),
    [ctx.weekOneMarginsLY],
  );
  const weekLw = useMemo(() => agg(ctx.weekTwoMargins), [ctx.weekTwoMargins]);

  const primaryValue = (a: { sales: number; marginPct: number }) =>
    gradingMetric === "margin" ? `${a.marginPct.toFixed(1)}%` : formatCurrency2(a.sales);

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
            ? "border-[#1e2a4a] ring-2 ring-[#1e2a4a]/30"
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
            onClick={() =>
              dispatch(actions.setSelectedWeekDay(isSelected ? "" : tyDate))
            }
            className={`relative flex flex-col rounded-md overflow-hidden flex-1 border transition-colors ${
              isSelected
                ? "border-[#1e2a4a] ring-2 ring-[#1e2a4a]/30"
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
