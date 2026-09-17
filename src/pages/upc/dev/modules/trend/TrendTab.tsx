import { useEffect, useMemo, useState } from "react";
import { useUpcDevCtx } from "../../hooks/useUpcDevCtx";
import { useAppDispatch } from "../../../../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
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
import { getTrendStatus, impactUnits } from "./trendStats";
import TrendLeftList from "./TrendLeftList";
import TrendDetailPanel from "./TrendDetailPanel";

// Parked with the Window input row below — re-enable together.
// const WINDOW_OPTIONS = [30, 60, 90, 120, 180, 365];

const TrendTab = () => {
  const ctx = useUpcDevCtx();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  // Echoed back once per fetch — the actual pivot the backend split
  // before/after on, needed to compute window lengths.
  const [trendStartDate, setTrendStartDate] = useState<string | null>(null);
  // The window's far end, also echoed back. The after window is the searched
  // range, not "startdate through today" — see getWindowDays.
  const [trendEndDate, setTrendEndDate] = useState<string | null>(null);

  // searchedUpcs, not upcs: `upcs` is the search card's working list and
  // changes live as the user edits chips in the re-search popup, which would
  // start fetching the moment they typed rather than when they clicked Search.
  // `searchedUpcs` only moves when a search is actually committed.
  const missing = missingFrom(ctx.searchedUpcs, ctx.trendCoverage);
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
        // An endpoint-level failure is a failure, not an empty answer. Taking
        // the success path here extended coverage, which recorded these UPCs
        // as fetched-and-empty and meant the tab never asked again — the
        // catch below deliberately leaves coverage alone for exactly this
        // reason, and `error !== 0` has to behave the same way.
        if (ctx.fixes && j.error !== 0) {
          toast.warn(j.msg || "Trend detection failed for these UPCs");
          return;
        }
        const rows: UpcTrend[] = j.error === 0 && j.trends?.length > 0 ? j.trends : [];
        // j.top_5 / j.bottom_5 are dropped on the floor: they're the backend's
        // own cross-UPC rankings, and nothing in this page reads them — the
        // left list ranks by impact_units itself, so a stored ranking would
        // only be one more thing to keep true as UPCs are added and removed.
        // They'd also be wrong under delta fetching, being a ranking of
        // whatever subset that one call happened to ask about.
        if (rows.length) {
          setTrendStartDate(j.startdate);
          setTrendEndDate(j.end_date ?? null);
        }
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
      .map((t) => ({ t, status: getTrendStatus(t, ctx.fixes) }))
      // Worst first. Ranked on the same figure the rows print, so the order
      // can be read off them.
      .sort((a, b) => impactUnits(a.t, ctx.fixes) - impactUnits(b.t, ctx.fixes));
  }, [ctx.upcTrends, ctx.selectedUpcs, ctx.fixes]);

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
        <TrendLeftList
          rows={rows}
          selectedCode={selectedCode}
          onSelect={setSelectedCode}
          fixes={ctx.fixes}
        />
        {selected && (
          <TrendDetailPanel
            trend={selected.t}
            status={selected.status}
            periods={ctx.trendPeriods}
            trendStartDate={trendStartDate}
            trendEndDate={trendEndDate}
            fixes={ctx.fixes}
          />
        )}
      </div>
    </div>
  );
};

export default TrendTab;
