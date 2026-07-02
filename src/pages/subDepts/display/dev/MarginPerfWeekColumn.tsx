import { useMemo } from "react";
import { useAppDispatch } from "../../../../hooks";
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
  return { tyPct, lyPct, ptsDelta };
};

const MarginPerfWeekColumn = () => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();

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

  const showWeekRange = (week: number) => {
    const e = ctx.singleDate;
    switch (week) {
      case 1: return `${formatDate(setDates(new Date(e), 6))} – ${formatDate(setDates(new Date(e), 0))}`;
      case 2: return `${formatDate(setDates(new Date(e), 13))} – ${formatDate(setDates(new Date(e), 7))}`;
      case 3: return `${formatDate(setDates(new Date(e), 20))} – ${formatDate(setDates(new Date(e), 14))}`;
      case 4: return `${formatDate(setDates(new Date(e), 27))} – ${formatDate(setDates(new Date(e), 21))}`;
      default: return "";
    }
  };

  // Sort weeks by worst pts delta first (most negative = worst)
  const sortedWeeks = useMemo(() => {
    const weeks = [1, 2, 3, 4] as const;
    return [...weeks].sort((a, b) => {
      const sa = weekSummary(weekDataMap[a], weekLYMap[a]);
      const sb = weekSummary(weekDataMap[b], weekLYMap[b]);
      const da = sa?.ptsDelta ?? 999;
      const db = sb?.ptsDelta ?? 999;
      return da - db;
    });
  }, [ctx.weekOneMargins, ctx.weekTwoMargins, ctx.weekThreeMargins, ctx.weekFourMargins,
      ctx.weekOneMarginsLY, ctx.weekTwoMarginsLY, ctx.weekThreeMarginsLY, ctx.weekFourMarginsLY]);

  const handleWeekClick = (week: MarginWeek) => {
    dispatch(actions.setLoadingMargins(true));
    dispatch(actions.setSelectedWeek(week));
    dispatch(actions.setSelectedWeekDay(""));
  };

  return (
    <div className="flex flex-col divide-y divide-gray-100 overflow-y-auto no-scrollbar">
      {sortedWeeks.map((wk) => {
        const isSelected = ctx.selectedWeek === wk;
        const tw = weekDataMap[wk];
        const ly = weekLYMap[wk];
        const summary = weekSummary(tw, ly);
        const isLoading = !tw.length;

        return (
          <div
            key={wk}
            className={`px-2 py-2.5 cursor-pointer transition-colors flex-shrink-0 ${
              isSelected ? "bg-white" : "bg-gray-50/40 hover:bg-gray-50"
            }`}
            style={
              isSelected
                ? { borderLeft: "3px solid #ef4444", boxShadow: "inset 0 0 6px rgba(239,68,68,0.1)" }
                : { borderLeft: "3px solid transparent" }
            }
            onClick={() => handleWeekClick(wk)}
          >
            <div className="text-[10px] font-semibold text-content/70 mb-0.5">Week {wk}</div>
            <div className="text-[8px] text-content/40 mb-1.5">{showWeekRange(wk)}</div>

            {isLoading ? (
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 border border-gray-200 border-t-[#1e2a4a] rounded-full animate-spin" />
                <span className="text-[9px] text-content/30 italic">Loading</span>
              </div>
            ) : summary ? (
              <>
                <div className="flex justify-between text-[9px]">
                  <span className="text-content/40">TY</span>
                  <span className="font-semibold text-content">{summary.tyPct.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-content/40">LY</span>
                  <span className="text-content/60">{summary.lyPct.toFixed(1)}%</span>
                </div>
                {summary.ptsDelta !== null && (
                  <div
                    className="text-[9px] font-bold mt-1 text-center"
                    style={{ color: summary.ptsDelta >= 0 ? "#16a34a" : "#dc2626" }}
                  >
                    {summary.ptsDelta >= 0 ? "+" : ""}{summary.ptsDelta.toFixed(1)} pts
                  </div>
                )}
              </>
            ) : (
              <div className="text-[9px] text-content/25 italic">No data</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MarginPerfWeekColumn;
