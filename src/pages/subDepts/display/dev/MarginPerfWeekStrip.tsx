import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useSubMarginCtx } from "../../hooks";
import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import { calculateCogs } from "../..";
import { formatDate } from "../widgets";
import { setDates } from "../..";
import type { SubDeptMargin } from "../../../../interfaces";
import type { MarginWeek } from "../../../../features/subMarginSlice";

const weekSummary = (tw: SubDeptMargin[], ly: SubDeptMargin[]) => {
  if (!tw.length) return null;
  const tySales = tw.reduce((acc, m) => acc + (m.total_sales - m.total_tax), 0);
  const tyCogs = tw.reduce((acc, m) => acc + calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight), 0);
  const lySales = ly.reduce((acc, m) => acc + (m.total_sales - m.total_tax), 0);
  const lyCogs = ly.reduce((acc, m) => acc + calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight), 0);
  const tyPct = tySales > 0 ? ((tySales - tyCogs) / tySales) * 100 : 0;
  const lyPct = lySales > 0 ? ((lySales - lyCogs) / lySales) * 100 : 0;
  const ptsDelta = lySales > 0 ? tyPct - lyPct : null;
  const salesDelta = lySales > 0 ? ((tySales - lySales) / lySales) * 100 : null;
  return { ptsDelta, salesDelta };
};

const showWeekRange = (e: string, week: number) => {
  switch (week) {
    case 1: return `${formatDate(setDates(new Date(e), 6))} – ${formatDate(setDates(new Date(e), 0))}`;
    case 2: return `${formatDate(setDates(new Date(e), 13))} – ${formatDate(setDates(new Date(e), 7))}`;
    case 3: return `${formatDate(setDates(new Date(e), 20))} – ${formatDate(setDates(new Date(e), 14))}`;
    case 4: return `${formatDate(setDates(new Date(e), 27))} – ${formatDate(setDates(new Date(e), 21))}`;
    default: return "";
  }
};

const WEEKS = [1, 2, 3, 4] as const;

const MarginPerfWeekStrip = () => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const gradingMetric = useAppSelector((s) => s.subMargin.gradingMetric);

  const weekDataMap: Record<number, SubDeptMargin[]> = {
    1: ctx.weekOneMargins,
    2: ctx.weekTwoMargins,
    3: ctx.weekThreeMargins,
    4: ctx.weekFourMargins,
  };
  const weekLYMap: Record<number, SubDeptMargin[]> = {
    1: ctx.weekOneMarginsLY,
    2: ctx.weekTwoMarginsLY,
    3: ctx.weekThreeMarginsLY,
    4: ctx.weekFourMarginsLY,
  };

  const summaries = useMemo(() =>
    WEEKS.map((wk) => ({ wk, summary: weekSummary(weekDataMap[wk], weekLYMap[wk]) })),
    [ctx.weekOneMargins, ctx.weekTwoMargins, ctx.weekThreeMargins, ctx.weekFourMargins,
     ctx.weekOneMarginsLY, ctx.weekTwoMarginsLY, ctx.weekThreeMarginsLY, ctx.weekFourMarginsLY],
  );

  const handleWeekClick = (week: MarginWeek) => {
    dispatch(actions.setLoadingMargins(true));
    dispatch(actions.setSelectedWeek(week));
    dispatch(actions.setSelectedWeekDay(""));
  };

  return (
    <div className="flex flex-shrink-0 border-b border-gray-100 bg-gray-50/40">
      {summaries.map(({ wk, summary }) => {
        const isActive = ctx.selectedWeek === wk;
        const isLoading = weekDataMap[wk].length === 0;
        const delta = gradingMetric === "margin" ? (summary?.ptsDelta ?? null) : (summary?.salesDelta ?? null);
        const deltaLabel = delta !== null
          ? gradingMetric === "margin"
            ? `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} pts`
            : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`
          : null;

        return (
          <button
            key={wk}
            onClick={() => handleWeekClick(wk)}
            className={`flex-1 flex flex-col gap-0.5 px-3 py-2 text-left transition-colors border-r border-gray-100 last:border-r-0 ${
              isActive ? "bg-white" : "hover:bg-gray-50"
            }`}
            style={isActive ? {
              boxShadow: delta !== null && delta >= 0
                ? "inset 0 0 8px rgba(16,185,129,0.25)"
                : "inset 0 0 8px rgba(239,68,68,0.25)",
            } : undefined}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold text-content/70">Week {wk}</span>
              {isLoading ? (
                <span className="text-[9px] text-content/30 italic">loading…</span>
              ) : deltaLabel !== null ? (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={
                    delta! >= 0
                      ? { background: "rgba(22,163,74,0.1)", color: "#16a34a" }
                      : { background: "rgba(220,38,38,0.1)", color: "#dc2626" }
                  }
                >
                  {delta! >= 0 ? "▲" : "▼"} {deltaLabel}
                </span>
              ) : null}
            </div>
            <div className="text-[8px] text-content/35">{showWeekRange(ctx.singleDate, wk)}</div>
          </button>
        );
      })}
    </div>
  );
};

export default MarginPerfWeekStrip;
