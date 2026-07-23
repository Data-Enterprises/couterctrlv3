import { useEffect, useMemo, useState } from "react";
import { useUpcDevCtx } from "../../hooks/useUpcDevCtx";
import { useAppDispatch } from "../../../../../hooks";
import {
  setDevPriceOptLoaded,
  setDevPriceOptLoading,
  setDevOptBestPrices,
  setDevOptBestPricesByUpc,
  setDevCurrentPriceCost,
  setDevStoreScopedPriceOpt,
  setDevUpcItems,
} from "../../../../../features/upcDevSlice";
import { getPriceOpt } from "../../../../../api/upc";
import { getItemLookupSingleStore } from "../../../../../api/itemLookup";
import type { ItemLookupHistory } from "../../../../../features/itemLookupSlice";
import type { UpcItem } from "../../../../../interfaces";
import { computePriceOptRowSummary } from "./priceOptStats";
import PriceOptLeftList from "./PriceOptLeftList";
import PriceOptDetailPanel from "./PriceOptDetailPanel";

const PriceOptTab = () => {
  const ctx = useUpcDevCtx();
  const dispatch = useAppDispatch();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  // Initial fetch: historical price/qty/revenue for every UPC in the search,
  // scoped to ctx.storeids (a single store in Store search, every group
  // member in Group search). This is the one batch fetch that's still worth
  // doing eagerly — it's the source for "Best price" on every list row
  // without needing a per-item lookup. Current price/cost never comes from
  // here; that's always a separate, lazy, per-selected-item fetch below.
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

  const resolvedStoreId = ctx.searchType === "Store" ? ctx.selectedStore.storeid : ctx.priceOptStoreId;

  const rows = useMemo(() => {
    const src = ctx.selectedUpcs.length > 0
      ? ctx.optBestPricesByUpc.filter((o) => ctx.selectedUpcs.includes(o.product_code))
      : ctx.optBestPricesByUpc;

    return src.map((row) => {
      const key = resolvedStoreId !== null ? `${resolvedStoreId}:${row.product_code}` : "";
      const cpc = resolvedStoreId !== null ? ctx.currentPriceCost[key] : undefined;
      const storeScopedRows = resolvedStoreId !== null ? ctx.storeScopedPriceOpt[key] : undefined;
      return computePriceOptRowSummary(row, ctx.optBestPrices, cpc, storeScopedRows, resolvedStoreId !== null);
    });
  }, [ctx.optBestPricesByUpc, ctx.optBestPrices, ctx.selectedUpcs, ctx.currentPriceCost, ctx.storeScopedPriceOpt, resolvedStoreId]);

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

  // Lazy current price/cost — only for whichever item is actually selected,
  // never batched for the whole list. Fires immediately once a store's
  // known (Store search: always; Group search: once picked).
  useEffect(() => {
    if (!selectedCode || resolvedStoreId === null) return;
    const key = `${resolvedStoreId}:${selectedCode}`;
    if (ctx.currentPriceCost[key]) return;

    const fetchCurrent = async () => {
      const res = await getItemLookupSingleStore(ctx.url, ctx.token, selectedCode, resolvedStoreId);
      const history = (res.data?.history ?? []) as ItemLookupHistory[];
      const last = history[history.length - 1];
      dispatch(
        setDevCurrentPriceCost({
          key,
          data: {
            product_code: selectedCode,
            currentPrice: last ? last.price : null,
            currentCost: last ? last.casecost : null,
          },
        }),
      );
    };
    fetchCurrent();
  }, [selectedCode, resolvedStoreId, ctx.currentPriceCost]);

  // Lazy store-scoped price history — Group search only. Store search's
  // initial batch is already single-store scoped, so there's nothing to
  // re-fetch. Re-runs the exact same getPriceOpt call, just narrowed to the
  // one picked store and the one selected item, so Best price/Elasticity/
  // Profit at risk reflect this store's own demand instead of a blend
  // across the whole group.
  useEffect(() => {
    if (ctx.searchType !== "Group" || !selectedCode || resolvedStoreId === null) return;
    const key = `${resolvedStoreId}:${selectedCode}`;
    if (ctx.storeScopedPriceOpt[key]) return;

    const fetchStoreScoped = async () => {
      const res = await getPriceOpt(
        ctx.url,
        ctx.token,
        String(resolvedStoreId),
        ctx.startDate,
        ctx.endDate,
        selectedCode,
      );
      const j = res.data;
      dispatch(setDevStoreScopedPriceOpt({ key, rows: j.error === 0 ? (j.best_prices ?? []) : [] }));
    };
    fetchStoreScoped();
  }, [selectedCode, resolvedStoreId, ctx.searchType, ctx.storeScopedPriceOpt]);

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
      {selectedSummary && (
        <PriceOptDetailPanel summary={selectedSummary} isGroupSearch={ctx.searchType === "Group"} />
      )}
    </div>
  );
};

export default PriceOptTab;
