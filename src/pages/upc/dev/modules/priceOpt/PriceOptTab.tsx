// Hooks
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch } from "../../../../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import { useUpcDevCtx } from "../../hooks/useUpcDevCtx";
import { useAbandonedRetry } from "../../hooks/useAbandonedRetry";

// Redux
import {
  setDevPriceOptLoading,
  mergeDevPriceOpt,
  setDevUpcItems,
} from "../../../../../features/dev/devUpcDevSlice";

// API
import { getPriceOpt } from "../../../../../api/upc";

// Utils
import { upcQueue } from "../../upcQueue";
import { missingFrom } from "../../coverage";
import { answerOf } from "../../utils";
import { computePriceOptRowSummary } from "./priceOptStats";

// Interfaces
import type { UpcPriceOpt } from "../../../../../interfaces";

// Components
import PriceOptLeftList from "./components/PriceOptLeftList";
import PriceOptDetailPanel from "./components/PriceOptDetailPanel";

/** The UPC List's Price Opt tab: fetches price, qty and revenue history for the searched
 *  UPCs on its first visit, then shows the items in a left list and the picked item's
 *  best price, elasticity and price points on the right. */
const PriceOptTab = () => {
  const ctx = useUpcDevCtx();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [retryTick, retry] = useAbandonedRetry();

  // searchedUpcs, not upcs: `upcs` changes live while chips are edited in the
  // re-search popup; `searchedUpcs` only moves when a search is committed.
  const missing = missingFrom(ctx.searchedUpcs, ctx.priceOptCoverage);
  const missingKey = missing.join(",");

  // The tab's one fetch: price/qty/revenue history for the searched UPCs over
  // ctx.storeids. Gated two ways: activeTab (waits for an actual visit; all
  // tabs stay mounted) and missingKey (asks only for UPCs it doesn't have).
  useEffect(() => {
    if (ctx.activeTab !== "priceOpt") return;
    if (ctx.priceOptLoading || !ctx.storeids || !missingKey) return;

    const load = async () => {
      dispatch(setDevPriceOptLoading(true));
      let abandoned = false;
      try {
        const res = await upcQueue.enqueue(`priceOpt:${missingKey}`, (signal) =>
          getPriceOpt(ctx.url, ctx.token, ctx.storeids, ctx.startDate, ctx.endDate, missingKey, signal),
        );
        // Superseded by a newer search: return before any dispatch, so a late
        // response can't repopulate the left panel; looked at again once
        // loading clears.
        if (!res) {
          abandoned = true;
          return;
        }

        const j = res.data;
        const answer = answerOf(j);
        // A failure is a failure, not an empty answer, so it doesn't cover the
        // UPCs (see SalesCompTab). No price history at all is a real answer and
        // covers them.
        if (ctx.fixes && answer === "failed") {
          toast.warn(j.msg || "Price optimization failed for these UPCs");
          return;
        }
        const ok = answer === "ok" && j.best_prices_by_upc?.length > 0;
        const byUpc: UpcPriceOpt[] = ok ? j.best_prices_by_upc : [];
        // best_prices can be absent even on a good answer; mergeRows spreads
        // it, so undefined here throws rather than merging nothing.
        const bestPrices: UpcPriceOpt[] = ok ? j.best_prices ?? [] : [];

        // Codes are what was asked for, not what answered — a UPC with no
        // price history still counts as covered.
        dispatch(mergeDevPriceOpt({ bestPrices, byUpc, codes: missing }));
        dispatch(
          setDevUpcItems(
            byUpc.map((i) => ({ product_code: i.product_code, description: i.product_description })),
          ),
        );
      } catch {
        // Coverage is left alone, so revisiting the tab retries.
      } finally {
        dispatch(setDevPriceOptLoading(false));
        if (abandoned) retry();
      }
    };

    load();
  }, [ctx.activeTab, missingKey, retryTick]);

  const rows = useMemo(() => {
    const src = ctx.selectedUpcs.length > 0
      ? ctx.optBestPricesByUpc.filter((o) => ctx.selectedUpcs.includes(o.product_code))
      : ctx.optBestPricesByUpc;

    return src.map((row) => computePriceOptRowSummary(row, ctx.optBestPrices, ctx.fixes));
  }, [ctx.optBestPricesByUpc, ctx.optBestPrices, ctx.selectedUpcs, ctx.fixes]);

  // Keep the detail panel on a valid item: the first row by default, re-picked
  // if the selection drops out of the filtered set.
  useEffect(() => {
    if (!rows.length) {
      setSelectedCode(null);
      return;
    }
    if (!selectedCode || !rows.some((r) => r.code === selectedCode)) {
      setSelectedCode(rows[0].code);
    }
  }, [rows, selectedCode]);

  if (ctx.priceOptLoading) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/85">
        Loading price optimization…
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/85">
        No price optimization data
      </div>
    );
  }

  const selectedSummary = rows.find((r) => r.code === selectedCode) ?? rows[0];

  return (
    <div className="flex-1 overflow-hidden flex min-h-0">
      <PriceOptLeftList rows={rows} selectedCode={selectedCode} onSelect={setSelectedCode} />
      {selectedSummary && (
        <PriceOptDetailPanel summary={selectedSummary} fixes={ctx.fixes} />
      )}
    </div>
  );
};

export default PriceOptTab;
