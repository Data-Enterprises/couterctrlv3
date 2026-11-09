// Hooks
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch } from "../../../../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import { useUpcDevCtx } from "../../hooks/useUpcDevCtx";
import { useAbandonedRetry } from "../../hooks/useAbandonedRetry";

// Redux
import {
  setDevTrendLoading,
  mergeDevTrends,
  setDevTrendWindow,
  setDevUpcItems,
} from "../../../../../features/dev/devUpcDevSlice";

// API
import { getTrendDetect } from "../../../../../api/upc";

// Utils
import { upcQueue } from "../../upcQueue";
import { missingFrom } from "../../coverage";
import { answerOf } from "../../utils";
import { getTrendStatus, impactUnits } from "./trendStats";
import { trendRequest } from "./utils/trendWindow";

// Interfaces
import type { UpcTrend } from "../../../../../interfaces";

// Components
import TrendLeftList from "./components/TrendLeftList";
import TrendDetailPanel from "./components/TrendDetailPanel";

/** The UPC List's Trend tab: fetches before/after trend detection for the searched UPCs
 *  on its first visit, then shows the items in a left list and the picked item's trend
 *  detail on the right. */
const TrendTab = () => {
  const ctx = useUpcDevCtx();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [retryTick, retry] = useAbandonedRetry();

  // searchedUpcs, not upcs (see PriceOptTab).
  const missing = missingFrom(ctx.searchedUpcs, ctx.trendCoverage);
  const missingKey = missing.join(",");

  // Waits for an actual visit, then asks only for the UPCs it's missing — see
  // the same pattern in PriceOptTab.
  useEffect(() => {
    if (ctx.activeTab !== "trend") return;
    if (ctx.trendLoading || !ctx.storeids || !missingKey) return;

    // `trendPeriods` is the baseline (days before the start date); what goes
    // out adds the days since the start date, since the endpoint counts its
    // window back from today.
    const { periods, window } = trendRequest(ctx.startDate, ctx.trendPeriods);

    const load = async () => {
      dispatch(setDevTrendLoading(true));
      let abandoned = false;
      try {
        const res = await upcQueue.enqueue(`trend:${periods}:${missingKey}`, (signal) =>
          getTrendDetect(
            ctx.url, ctx.token, ctx.storeids, ctx.startDate, ctx.endDate,
            periods, missingKey, signal,
          ),
        );
        // Superseded by a newer search — see the same guard in PriceOptTab.
        if (!res) {
          abandoned = true;
          return;
        }

        const j = res.data;
        const answer = answerOf(j);
        // A failure is a failure, not an empty answer, so coverage is left
        // alone and the tab asks again. No sales in the window is a real
        // answer and covers them.
        if (ctx.fixes && answer === "failed") {
          toast.warn(j.msg || "Trend detection failed for these UPCs");
          return;
        }
        const rows: UpcTrend[] = answer === "ok" && j.trends?.length > 0 ? j.trends : [];
        // j.top_5 / j.bottom_5 are ignored: the left list ranks by impact
        // itself, and a ranking of one delta call's subset would be wrong.
        dispatch(setDevTrendWindow(window));
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
        if (abandoned) retry();
      }
    };

    load();
  }, [ctx.activeTab, missingKey, retryTick]);

  const rows = useMemo(() => {
    const src =
      ctx.selectedUpcs.length > 0
        ? ctx.upcTrends.filter((t) => ctx.selectedUpcs.includes(t.product_code))
        : ctx.upcTrends;
    return [...src]
      .map((t) => ({ t, status: getTrendStatus(t, ctx.fixes, ctx.trendWindow) }))
      // Worst first. Ranked on the same figure the rows print, so the order
      // can be read off them.
      .sort(
        (a, b) =>
          impactUnits(a.t, ctx.fixes, ctx.trendWindow) -
          impactUnits(b.t, ctx.fixes, ctx.trendWindow),
      );
  }, [ctx.upcTrends, ctx.selectedUpcs, ctx.fixes, ctx.trendWindow]);

  // Keep the detail panel on a valid item: the first row by default, re-picked
  // if the selection drops out of the filtered set.
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
      <div className="flex-1 overflow-hidden flex min-h-0">
        <TrendLeftList
          rows={rows}
          selectedCode={selectedCode}
          onSelect={setSelectedCode}
          fixes={ctx.fixes}
          window={ctx.trendWindow}
        />
        {selected && (
          <TrendDetailPanel
            trend={selected.t}
            status={selected.status}
            window={ctx.trendWindow}
            fixes={ctx.fixes}
          />
        )}
      </div>
    </div>
  );
};

export default TrendTab;
