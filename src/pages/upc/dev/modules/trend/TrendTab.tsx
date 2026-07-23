import { useEffect, useMemo, useState } from "react";
import { useUpcDevCtx } from "../../hooks/useUpcDevCtx";
import { useAppDispatch } from "../../../../../hooks";
import {
  setDevTrendLoaded,
  setDevTrendLoading,
  // setDevTrendPeriods, // parked with the Window input row — re-enable together
  setDevUpcTrends,
  setDevTopFiveTrends,
  setDevBottomFiveTrends,
  setDevUpcItems,
} from "../../../../../features/upcDevSlice";
import { getTrendDetect } from "../../../../../api/upc";
import type { UpcTrend, UpcItem } from "../../../../../interfaces";
import { getTrendStatus } from "./trendStats";
import TrendLeftList from "./TrendLeftList";
import TrendDetailPanel from "./TrendDetailPanel";

// Parked with the Window input row below — re-enable together.
// const WINDOW_OPTIONS = [30, 60, 90, 120, 180, 365];

const TrendTab = () => {
  const ctx = useUpcDevCtx();
  const dispatch = useAppDispatch();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  // Echoed back once per fetch — the actual pivot the backend split
  // before/after on, needed to compute window lengths since "after" always
  // runs through today, not a fixed end date.
  const [trendStartDate, setTrendStartDate] = useState<string | null>(null);

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
      setTrendStartDate(j.startdate);
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
    // ctx.searchVersion: see the same note in PriceOptTab.tsx — without it
    // this effect would never re-fire on a re-search.
  }, [ctx.searchVersion]);

  // Parked with the Window input row below — re-enable together.
  // const handleWindowChange = (periods: number) => {
  //   dispatch(setDevTrendPeriods(periods));
  //   fetchTrends(periods);
  // };

  const rows = useMemo(() => {
    const src =
      ctx.selectedUpcs.length > 0
        ? ctx.upcTrends.filter((t) => ctx.selectedUpcs.includes(t.product_code))
        : ctx.upcTrends;
    return [...src]
      .map((t) => ({ t, status: getTrendStatus(t) }))
      .sort((a, b) => a.t.impact_units - b.t.impact_units);
  }, [ctx.upcTrends, ctx.selectedUpcs]);

  // Keep the detail panel pointed at a valid item — same pattern as Sales
  // Comp/Price Opt: default to the first row, re-pick if the current
  // selection drops out of the filtered set.
  useEffect(() => {
    if (!rows.length) {
      setSelectedCode(null);
      return;
    }
    if (!selectedCode || !rows.some((r) => r.t.product_code === selectedCode)) {
      setSelectedCode(rows[0].t.product_code);
    }
  }, [rows, selectedCode]);

  if (ctx.trendLoading) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/85">
        Loading trend detection…
      </div>
    );
  }

  if (!ctx.trendLoaded) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/85">
        Navigate here to load trend data
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/85">
        No trend data
      </div>
    );
  }

  const selected = rows.find((r) => r.t.product_code === selectedCode) ?? rows[0];

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Window input parked for now — re-enable when ready.
      <div className="flex items-center justify-end gap-1.5 px-3 py-2 border-b border-gray-100 flex-shrink-0">
        <label className="flex items-center gap-1.5 text-[10px] text-content">
          Window
          <select
            value={ctx.trendPeriods}
            onChange={(e) => handleWindowChange(Number(e.target.value))}
            className="text-[10px] pl-1.5 pr-4 py-1 rounded border border-content/20 bg-custom-white"
            style={{ outline: "none", boxShadow: "none" }}
          >
            {WINDOW_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}d
              </option>
            ))}
          </select>
        </label>
      </div>
      */}

      <div className="flex-1 overflow-hidden flex min-h-0">
        <TrendLeftList rows={rows} selectedCode={selectedCode} onSelect={setSelectedCode} />
        {selected && (
          <TrendDetailPanel
            trend={selected.t}
            status={selected.status}
            periods={ctx.trendPeriods}
            trendStartDate={trendStartDate}
          />
        )}
      </div>
    </div>
  );
};

export default TrendTab;
