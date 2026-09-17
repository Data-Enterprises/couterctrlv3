import { useEffect, useMemo, useState } from "react";
import { useUpcDevCtx } from "../../hooks/useUpcDevCtx";
import { useAppDispatch } from "../../../../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import {
  setDevPriceOptLoading,
  mergeDevPriceOpt,
  setDevUpcItems,
} from "../../../../../features/upcDevSlice";
import { getPriceOpt } from "../../../../../api/upc";
import { upcQueue } from "../../upcQueue";
import { missingFrom } from "../../coverage";
import type { UpcPriceOpt } from "../../../../../interfaces";
import { computePriceOptRowSummary } from "./priceOptStats";
import PriceOptLeftList from "./PriceOptLeftList";
import PriceOptDetailPanel from "./PriceOptDetailPanel";

const PriceOptTab = () => {
  const ctx = useUpcDevCtx();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  // searchedUpcs, not upcs: `upcs` is the search card's working list and
  // changes live as the user edits chips in the re-search popup, which would
  // start fetching the moment they typed rather than when they clicked Search.
  // `searchedUpcs` only moves when a search is actually committed.
  const missing = missingFrom(ctx.searchedUpcs, ctx.priceOptCoverage);
  const missingKey = missing.join(",");

  // The one fetch this tab needs: historical price/qty/revenue for every UPC
  // in the search, scoped to ctx.storeids (a single store in Store search,
  // every group member in Group search — no per-store re-scoping, that data is
  // what we have). No current price or cost anywhere in this data, so there's
  // nothing else to fetch.
  //
  // Gated two ways. activeTab means the call waits for an actual visit — all
  // four tabs stay mounted so their local selection survives a switch, which
  // used to mean all four fetched the moment the page rendered. missingKey
  // means it asks only for UPCs it doesn't already have, so a search that adds
  // one UPC to nine costs a one-UPC call rather than a ten-UPC one.
  useEffect(() => {
    if (ctx.activeTab !== "priceOpt") return;
    if (ctx.priceOptLoading || !ctx.storeids || !missingKey) return;

    const load = async () => {
      dispatch(setDevPriceOptLoading(true));
      try {
        const res = await upcQueue.enqueue(`priceOpt:${missingKey}`, (signal) =>
          getPriceOpt(ctx.url, ctx.token, ctx.storeids, ctx.startDate, ctx.endDate, missingKey, signal),
        );
        // Superseded by a newer search. Returning before any dispatch is the
        // whole point — a late response used to write its old UPC set into
        // setDevUpcItems and repopulate the left panel behind the new search.
        if (!res) return;

        const j = res.data;
        // An endpoint-level failure is a failure, not an empty answer — see
        // the same guard in TrendTab. Covering on it recorded these UPCs as
        // fetched-and-empty and the tab never asked again.
        if (ctx.fixes && j.error !== 0) {
          toast.warn(j.msg || "Price optimization failed for these UPCs");
          return;
        }
        const ok = j.error === 0 && j.best_prices_by_upc?.length > 0;
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
      }
    };

    load();
  }, [ctx.activeTab, missingKey]);

  const rows = useMemo(() => {
    const src = ctx.selectedUpcs.length > 0
      ? ctx.optBestPricesByUpc.filter((o) => ctx.selectedUpcs.includes(o.product_code))
      : ctx.optBestPricesByUpc;

    return src.map((row) => computePriceOptRowSummary(row, ctx.optBestPrices, ctx.fixes));
  }, [ctx.optBestPricesByUpc, ctx.optBestPrices, ctx.selectedUpcs, ctx.fixes]);

  // Keep the detail panel pointed at a valid item — same pattern as Sales
  // Comp: default to the first row, re-pick if the current selection drops
  // out of the filtered set.
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
