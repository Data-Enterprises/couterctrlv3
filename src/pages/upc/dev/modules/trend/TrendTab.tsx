import { useEffect, useMemo } from "react";
import { useUpcDevCtx } from "../../hooks/useUpcDevCtx";
import { useAppDispatch } from "../../../../../hooks";
import {
  setDevTrendLoaded,
  setDevTrendLoading,
  setDevTrendMode,
  setDevTrendPeriods,
  setDevUpcTrends,
  setDevTopFiveTrends,
  setDevBottomFiveTrends,
  setDevUpcItems,
  type UpcDevTrendMode,
} from "../../../../../features/upcDevSlice";
import { getTrendDetect } from "../../../../../api/upc";
import type { UpcTrend, UpcItem } from "../../../../../interfaces";

const MODES: UpcDevTrendMode[] = ["Totals", "Mean", "Volatility"];
const WINDOW_OPTIONS = [30, 60, 90, 120, 180, 365];

const TrendTab = () => {
  const ctx = useUpcDevCtx();
  const dispatch = useAppDispatch();

  const fetchTrends = async (periods: number) => {
    dispatch(setDevTrendLoading(true));
    const upcParam = ctx.upcs.join(",");
    const upcItemsMap = new Map<string, UpcItem>();

    const res = await getTrendDetect(ctx.url, ctx.token, ctx.storeids, ctx.startDate, ctx.endDate, periods, upcParam);
    const j = res.data;
    if (j.error === 0 && j.trends?.length > 0) {
      dispatch(setDevUpcTrends(j.trends));
      dispatch(setDevTopFiveTrends(j.top_5));
      dispatch(setDevBottomFiveTrends(j.bottom_5));
      for (const item of j.trends as UpcTrend[]) {
        upcItemsMap.set(item.product_code, {
          product_code: item.product_code,
          description: item.product_description,
        });
      }
    }

    if (upcItemsMap.size) dispatch(setDevUpcItems(Array.from(upcItemsMap.values())));
    dispatch(setDevTrendLoaded(true));
    dispatch(setDevTrendLoading(false));
  };

  useEffect(() => {
    if (ctx.trendLoaded || ctx.trendLoading || !ctx.upcs.length || !ctx.storeids) return;
    fetchTrends(ctx.trendPeriods);
  }, []);

  const handleWindowChange = (periods: number) => {
    dispatch(setDevTrendPeriods(periods));
    fetchTrends(periods);
  };

  const filtered = useMemo(() => {
    const src = ctx.selectedUpcs.length > 0
      ? ctx.upcTrends.filter((t) => ctx.selectedUpcs.includes(t.product_code))
      : ctx.upcTrends;
    return [...src].sort((a, b) => Math.abs(b.slope_change) - Math.abs(a.slope_change));
  }, [ctx.upcTrends, ctx.selectedUpcs, ctx.trendMode]);

  const getValue = (t: (typeof filtered)[0]) => {
    switch (ctx.trendMode) {
      case "Totals":
        return { before: t.total_before, after: t.total_after, change: t.slope_change };
      case "Mean":
        return { before: t.mean_before, after: t.mean_after, change: t.pct_change_mean };
      case "Volatility":
        return { before: t.volatility_before, after: t.volatility_after, change: t.slope_change };
    }
  };

  if (ctx.trendLoading) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/40">
        Loading trend detection…
      </div>
    );
  }

  if (!ctx.trendLoaded) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/30">
        Navigate here to load trend data
      </div>
    );
  }

  if (!filtered.length) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/30">
        No trend data
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex items-center justify-between gap-1 px-3 py-2 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-1">
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => dispatch(setDevTrendMode(m))}
              className={`px-3 py-1 rounded text-[10px] font-medium transition-colors ${
                ctx.trendMode === m
                  ? "bg-[#1e2a4a] text-custom-white"
                  : "text-content/50 hover:text-content/80 hover:bg-gray-100"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-[10px] text-content">
          Window
          <select
            value={ctx.trendPeriods}
            onChange={(e) => handleWindowChange(Number(e.target.value))}
            className="text-[10px] pl-1.5 pr-4 py-1 rounded border border-content/20 bg-custom-white"
            style={{ outline: "none", boxShadow: "none" }}
          >
            {WINDOW_OPTIONS.map((d) => (
              <option key={d} value={d}>{d}d</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex-1 overflow-auto thin-scrollbar min-h-0">
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="sticky top-0 bg-gray-100 z-10">
              <th className="px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-wide text-content/40 whitespace-nowrap">UPC</th>
              <th className="px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-wide text-content/40">Description</th>
              <th className="px-3 py-2 text-right text-[9px] font-semibold uppercase tracking-wide text-content/40">Before</th>
              <th className="px-3 py-2 text-right text-[9px] font-semibold uppercase tracking-wide text-content/40">After</th>
              <th className="px-3 py-2 text-right text-[9px] font-semibold uppercase tracking-wide text-content/40">Change</th>
              <th className="px-3 py-2 text-right text-[9px] font-semibold uppercase tracking-wide text-content/40">Impact</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => {
              const vals = getValue(t);
              const isUp = t.slope_change > 0;
              return (
                <tr
                  key={t.product_code}
                  className="border-b border-gray-100 hover:bg-gray-50/80"
                  style={{ background: i % 2 === 1 ? "rgba(30,42,74,0.015)" : undefined }}
                >
                  <td className="px-3 py-[7px] text-content/50 tabular-nums whitespace-nowrap">{t.product_code}</td>
                  <td className="px-3 py-[7px] text-content max-w-[200px] truncate">{t.product_description}</td>
                  <td className="px-3 py-[7px] text-right tabular-nums text-content/70">{vals.before.toFixed(2)}</td>
                  <td className="px-3 py-[7px] text-right tabular-nums text-content/70">{vals.after.toFixed(2)}</td>
                  <td className="px-3 py-[7px] text-right tabular-nums">
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        isUp ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {vals.change >= 0 ? "+" : ""}{vals.change.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-3 py-[7px] text-right tabular-nums text-content/60">{t.impact_units.toFixed(0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrendTab;
