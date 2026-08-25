import { useEffect, useMemo, useState } from "react";
import { useUpcDevCtx } from "../../hooks/useUpcDevCtx";
import { useAppDispatch } from "../../../../../hooks";
import {
  setDevTrendLoading,
  // setDevTrendPeriods, // parked with the Window input row — re-enable together
  mergeDevTrends,
  setDevUpcItems,
} from "../../../../../features/upcDevSlice";
import { getTrendDetect } from "../../../../../api/upc";
import { upcQueue } from "../../upcQueue";
import { missingFrom } from "../../coverage";
import type { UpcTrend } from "../../../../../interfaces";
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

  const missing = missingFrom(ctx.upcs, ctx.trendCoverage);
  const missingKey = missing.join(",");

  // Waits for an actual visit, then asks only for the UPCs it's missing — see
  // the same pattern in PriceOptTab.
  useEffect(() => {
    if (ctx.activeTab !== "trend") return;
    if (ctx.trendLoading || !ctx.storeids || !missingKey) return;

    const load = async () => {
      dispatch(setDevTrendLoading(true));
      try {
        const res = await upcQueue.enqueue(`trend:${ctx.trendPeriods}:${missingKey}`, (signal) =>
          getTrendDetect(
            ctx.url, ctx.token, ctx.storeids, ctx.startDate, ctx.endDate,
            ctx.trendPeriods, missingKey, signal,
          ),
        );
        // Superseded by a newer search — see the same guard in PriceOptTab.
        if (!res) return;

        const j = res.data;
        const rows: UpcTrend[] = j.error === 0 && j.trends?.length > 0 ? j.trends : [];
        // j.top_5 / j.bottom_5 are dropped on the floor: they're the backend's
        // own cross-UPC rankings, and nothing in this page reads them — the
        // left list ranks by impact_units itself, so a stored ranking would
        // only be one more thing to keep true as UPCs are added and removed.
        // They'd also be wrong under delta fetching, being a ranking of
        // whatever subset that one call happened to ask about.
        if (rows.length) setTrendStartDate(j.startdate);
        dispatch(mergeDevTrends({ rows, codes: missing }));
        dispatch(
          setDevUpcItems(
            rows.map((t) => ({ product_code: t.product_code, description: t.product_description })),
          ),
        );
      } catch {
        // Coverage is left alone, so revisiting the tab retries.
      } finally {
        dispatch(setDevTrendLoading(false));
      }
    };

    load();
  }, [ctx.activeTab, missingKey]);

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
