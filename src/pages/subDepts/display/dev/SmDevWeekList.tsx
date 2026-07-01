import { useEffect, useState } from "react";
import { useSubMarginCtx, useParams } from "../../hooks";
import { useAppDispatch } from "../../../../hooks";
import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import { getSubMargins } from "../../../../api/subMargins";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { setDates } from "../..";
import { formatDate } from "../widgets";
import { formatCurrency2 } from "../../../../utils";
import { gpm } from "../../../../functions";
import { calculateCogs } from "../..";
import type { JsonError, SubDeptMargin, SubMarginsJsonResp } from "../../../../interfaces";
import type { MarginWeek } from "../../../../features/subMarginSlice";

const SmDevWeekList = () => {
  const toast = useToast();
  const ctx = useSubMarginCtx();
  const params = useParams();
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();

  // Per-week loading state tracked locally (TW and LY separately)
  const [weekLoading, setWeekLoading] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
  });
  const [, setWeekLoadingLY] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
  });

  const setLoading = (week: number, val: boolean) =>
    setWeekLoading((prev) => ({ ...prev, [week]: val }));
  const setLoadingLY = (week: number, val: boolean) =>
    setWeekLoadingLY((prev) => ({ ...prev, [week]: val }));

  const getData = (start: string, end: string, week: number) => {
    setLoading(week, true);
    getSubMargins(
      ctx.url,
      ctx.token,
      ctx.selectedSubDeptId,
      start,
      end,
      params.useGroups,
      params.searchValue,
      params.singleStore,
    )
      .then((resp) => {
        const j: SubMarginsJsonResp = resp.data;
        if (j.error === 0) {
          let marginData: SubDeptMargin[] = j.subs;
          if (j.total_pages > 1) {
            const pages: { page: number; fetched: boolean }[] = [];
            for (let page = 2; page <= j.total_pages; page++) {
              pages.push({ page, fetched: false });
            }
            for (let page = 2; page <= j.total_pages; page++) {
              getSubMargins(
                ctx.url,
                ctx.token,
                ctx.selectedSubDeptId,
                start,
                end,
                params.useGroups,
                params.searchValue,
                params.singleStore,
                page,
              )
                .then((resp) => {
                  const j: SubMarginsJsonResp = resp.data;
                  if (j.error === 0) {
                    marginData = [...marginData, ...j.subs];
                    pages.find((p) => p.page === page)!.fetched = true;
                    if (pages.every((p) => p.fetched)) {
                      dispatch(actions.setWeekTrendMargins({ data: marginData, week }));
                      setLoading(week, false);
                    }
                  }
                })
                .catch((err: JsonError) => {
                  toast.error(err.message);
                  setLoading(week, false);
                });
            }
          } else {
            dispatch(actions.setWeekTrendMargins({ data: marginData, week }));
            setLoading(week, false);
          }
        }
      })
      .catch((err: JsonError) => {
        toast.error(err.message);
        setLoading(week, false);
      });
  };

  const getDataLY = (start: string, end: string, week: number) => {
    setLoadingLY(week, true);
    getSubMargins(
      ctx.url,
      ctx.token,
      ctx.selectedSubDeptId,
      start,
      end,
      params.useGroups,
      params.searchValue,
      params.singleStore,
    )
      .then((resp) => {
        const j: SubMarginsJsonResp = resp.data;
        if (j.error === 0) {
          let marginData: SubDeptMargin[] = j.subs;
          if (j.total_pages > 1) {
            const pages: { page: number; fetched: boolean }[] = [];
            for (let page = 2; page <= j.total_pages; page++) {
              pages.push({ page, fetched: false });
            }
            for (let page = 2; page <= j.total_pages; page++) {
              getSubMargins(
                ctx.url,
                ctx.token,
                ctx.selectedSubDeptId,
                start,
                end,
                params.useGroups,
                params.searchValue,
                params.singleStore,
                page,
              )
                .then((resp) => {
                  const j: SubMarginsJsonResp = resp.data;
                  if (j.error === 0) {
                    marginData = [...marginData, ...j.subs];
                    pages.find((p) => p.page === page)!.fetched = true;
                    if (pages.every((p) => p.fetched)) {
                      dispatch(actions.setWeekTrendMarginsLY({ data: marginData, week }));
                      setLoadingLY(week, false);
                    }
                  }
                })
                .catch((err: JsonError) => {
                  toast.error(err.message);
                  setLoadingLY(week, false);
                });
            }
          } else {
            dispatch(actions.setWeekTrendMarginsLY({ data: marginData, week }));
            setLoadingLY(week, false);
          }
        }
      })
      .catch((err: JsonError) => {
        toast.error(err.message);
        setLoadingLY(week, false);
      });
  };

  // Auto-fetch all 4 TW weeks + all 4 LY weeks when sub dept is selected
  useEffect(() => {
    if (!ctx.selectedSubDeptId) return;
    // TW weeks
    if (!ctx.weekOneMargins.length) getData(params.start, params.end, 1);
    if (!ctx.weekTwoMargins.length) {
      getData(setDates(new Date(params.end), 13), setDates(new Date(params.end), 7), 2);
    }
    if (!ctx.weekThreeMargins.length) {
      getData(setDates(new Date(params.end), 20), setDates(new Date(params.end), 14), 3);
    }
    if (!ctx.weekFourMargins.length) {
      getData(setDates(new Date(params.end), 27), setDates(new Date(params.end), 21), 4);
    }
    // LY weeks — same ranges shifted 364 days back (52 weeks)
    if (!ctx.weekOneMarginsLY.length) {
      getDataLY(setDates(new Date(params.start), 364), setDates(new Date(params.end), 364), 1);
    }
    if (!ctx.weekTwoMarginsLY.length) {
      getDataLY(setDates(new Date(params.end), 377), setDates(new Date(params.end), 371), 2);
    }
    if (!ctx.weekThreeMarginsLY.length) {
      getDataLY(setDates(new Date(params.end), 384), setDates(new Date(params.end), 378), 3);
    }
    if (!ctx.weekFourMarginsLY.length) {
      getDataLY(setDates(new Date(params.end), 391), setDates(new Date(params.end), 385), 4);
    }
  }, [ctx.selectedSubDeptId]);

  const handleWeekClick = (week: MarginWeek) => {
    dispatch(actions.setLoadingMargins(true));
    dispatch(actions.setSelectedWeek(week));
    dispatch(actions.setSelectedWeekDay(""));
  };

  const showWeekRange = (week: number): string => {
    switch (week) {
      case 1:
        return `${formatDate(setDates(new Date(ctx.singleDate), 6))} – ${formatDate(setDates(new Date(ctx.singleDate), 0))}`;
      case 2:
        return `${formatDate(setDates(new Date(ctx.singleDate), 13))} – ${formatDate(setDates(new Date(ctx.singleDate), 7))}`;
      case 3:
        return `${formatDate(setDates(new Date(ctx.singleDate), 20))} – ${formatDate(setDates(new Date(ctx.singleDate), 14))}`;
      case 4:
        return `${formatDate(setDates(new Date(ctx.singleDate), 27))} – ${formatDate(setDates(new Date(ctx.singleDate), 21))}`;
      default:
        return "All Weeks";
    }
  };

  const formatPct = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;

  const weekSummary = (tw: SubDeptMargin[], ly: SubDeptMargin[]) => {
    if (!tw.length) return null;
    const twSales = tw.reduce((acc, m) => acc + (m.total_sales - m.total_tax), 0);
    const twCogs = tw.reduce((acc, m) => acc + calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight), 0);
    const lySales = ly.reduce((acc, m) => acc + (m.total_sales - m.total_tax), 0);
    const lyCogs = ly.reduce((acc, m) => acc + calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight), 0);
    const vsLY = lySales ? ((twSales - lySales) / Math.abs(lySales)) * 100 : null;
    const twMarginPct = twSales > 0 ? ((twSales - twCogs) / twSales) * 100 : 0;
    const lyMarginPct = lySales > 0 ? ((lySales - lyCogs) / lySales) * 100 : 0;
    const vsLYMarginPts = lySales > 0 ? twMarginPct - lyMarginPct : null;
    return {
      tw: formatCurrency2(twSales),
      twMargin: gpm(twSales, twCogs),
      ly: lySales ? formatCurrency2(lySales) : null,
      lyMargin: lySales ? gpm(lySales, lyCogs) : null,
      vsLY,
      vsLYMarginPts,
    };
  };

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

  const weeks: MarginWeek[] = [1, 2, 3, 4, 5];

  return (
    <div className="flex flex-col divide-y divide-gray-100">
      {weeks.map((wk) => {
        const isSelected = ctx.selectedWeek === wk;
        const isLoading = wk < 5 && weekLoading[wk];
        const summary = wk < 5 ? weekSummary(weekDataMap[wk], weekLYMap[wk]) : null;
        const allLoading = wk === 5 && Object.values(weekLoading).some(Boolean);

        // All Weeks totals
        const allTW = wk === 5 ? [...ctx.weekOneMargins, ...ctx.weekTwoMargins, ...ctx.weekThreeMargins, ...ctx.weekFourMargins] : [];
        const allLY = wk === 5 ? [...ctx.weekOneMarginsLY, ...ctx.weekTwoMarginsLY, ...ctx.weekThreeMarginsLY, ...ctx.weekFourMarginsLY] : [];
        const allSummary = wk === 5 ? weekSummary(allTW, allLY) : null;

        return (
          <div
            key={wk}
            className={`px-3 py-2.5 cursor-pointer transition-colors ${
              isSelected ? "bg-white" : "bg-gray-50/40 hover:bg-gray-50"
            }`}
            style={isSelected ? { boxShadow: "inset 0 0 8px rgba(37, 99, 235, 0.22)" } : undefined}
            onClick={() => handleWeekClick(wk)}
          >
            {/* Row 1: label + date range */}
            <div className="text-center w-full mb-1.5">
              <div className="text-[11px] font-medium text-content">{wk < 5 ? `Week ${wk}` : "All Weeks"}</div>
              {wk < 5 && <div className="text-[9px] text-content/60 mt-0.5">{showWeekRange(wk)}</div>}
            </div>

            {isLoading || (wk === 5 && allLoading) ? (
              <div className="flex items-center gap-1.5 py-1">
                <div className="w-3 h-3 border-2 border-gray-200 border-t-[#1e2a4a] rounded-full animate-spin" />
                <span className="text-[10px] text-content/35 italic">Loading…</span>
              </div>
            ) : (summary || allSummary) ? (() => {
              const s = (summary ?? allSummary)!;
              return (
                <div className="grid grid-cols-4">
                  <div className="px-1.5 py-1 text-center">
                    <div className="text-[7px] text-content/45 uppercase tracking-wide">TY Sales</div>
                    <div className="text-[10px] font-medium text-content mt-0.5">{s.tw}</div>
                  </div>
                  <div className="px-1.5 py-1 text-center">
                    <div className="text-[7px] text-content/45 uppercase tracking-wide">LY Sales</div>
                    <div className="text-[10px] font-medium text-content mt-0.5">{s.ly ?? "—"}</div>
                    {s.vsLY !== null && (
                      <div className={`text-[9px] font-medium mt-0.5 ${s.vsLY >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {formatPct(s.vsLY)}
                      </div>
                    )}
                  </div>
                  <div className="px-1.5 py-1 text-center">
                    <div className="text-[7px] text-content/45 uppercase tracking-wide">TY Margin</div>
                    <div className="text-[10px] font-medium text-content mt-0.5">{s.twMargin}</div>
                  </div>
                  <div className="px-1.5 py-1 text-center">
                    <div className="text-[7px] text-content/45 uppercase tracking-wide">LY Margin</div>
                    <div className="text-[10px] font-medium text-content mt-0.5">{s.lyMargin ?? "—"}</div>
                    {s.vsLYMarginPts !== null && (
                      <div className={`text-[9px] font-medium mt-0.5 ${s.vsLYMarginPts >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {s.vsLYMarginPts >= 0 ? "+" : ""}{s.vsLYMarginPts.toFixed(1)} pts
                      </div>
                    )}
                  </div>
                </div>
              );
            })() : wk < 5 ? (
              <p className="text-[10px] text-content/25 italic">No data</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export default SmDevWeekList;
