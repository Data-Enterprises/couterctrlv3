import { useEffect, useMemo, useState } from "react";
import { useUpcDevCtx } from "../../hooks/useUpcDevCtx";
import { useAppDispatch } from "../../../../../hooks";
import {
  setDevPriceOptLoaded,
  setDevPriceOptLoading,
  setDevOptBestPrices,
  setDevOptBestPricesByUpc,
  setDevUpcItems,
} from "../../../../../features/upcDevSlice";
import { getPriceOpt } from "../../../../../api/upc";
import type { UpcItem } from "../../../../../interfaces";
import { computePriceOptRowSummary } from "./priceOptStats";
import PriceOptLeftList from "./PriceOptLeftList";
import PriceOptDetailPanel from "./PriceOptDetailPanel";

const PriceOptTab = () => {
  const ctx = useUpcDevCtx();
  const dispatch = useAppDispatch();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  // The one fetch this tab needs: historical price/qty/revenue for every
  // UPC in the search, scoped to ctx.storeids (a single store in Store
  // search, every group member in Group search — no per-store re-scoping,
  // that data is what we have). No current price or cost anywhere in this
  // data, so there's nothing else to fetch.
  useEffect(() => {
    if (ctx.priceOptLoaded || ctx.priceOptLoading || !ctx.upcs.length || !ctx.storeids) return;

    const load = async () => {
      dispatch(setDevPriceOptLoading(true));
      const upcParam = ctx.upcs.join(",");
      const upcItemsMap = new Map<string, UpcItem>();

      const res = await getPriceOpt(ctx.url, ctx.token, ctx.storeids, ctx.startDate, ctx.endDate, upcParam);
      const j = res.data;
      if (j.error === 0 && j.best_prices_by_upc?.length > 0) {
        dispatch(setDevOptBestPrices(j.best_prices));
        dispatch(setDevOptBestPricesByUpc(j.best_prices_by_upc));
        for (const item of j.best_prices_by_upc) {
          upcItemsMap.set(item.product_code, {
            product_code: item.product_code,
            description: item.product_description,
          });
        }
      }

      if (upcItemsMap.size) dispatch(setDevUpcItems(Array.from(upcItemsMap.values())));
      dispatch(setDevPriceOptLoaded(true));
      dispatch(setDevPriceOptLoading(false));
    };

    load();
  }, [ctx.searchVersion]);

  const rows = useMemo(() => {
    const src = ctx.selectedUpcs.length > 0
      ? ctx.optBestPricesByUpc.filter((o) => ctx.selectedUpcs.includes(o.product_code))
      : ctx.optBestPricesByUpc;

    return src.map((row) => computePriceOptRowSummary(row, ctx.optBestPrices));
  }, [ctx.optBestPricesByUpc, ctx.optBestPrices, ctx.selectedUpcs]);

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

  if (!ctx.priceOptLoaded) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/85">
        Navigate here to load price optimization data
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
      {selectedSummary && <PriceOptDetailPanel summary={selectedSummary} />}
    </div>
  );
};

export default PriceOptTab;
