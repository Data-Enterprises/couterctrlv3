import React, { useEffect, useMemo, useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
import { useUpcDevCtx } from "../../hooks/useUpcDevCtx";
import { useAppDispatch } from "../../../../../hooks";
import {
  setDevPriceOptLoaded,
  setDevPriceOptLoading,
  setDevOptBestPrices,
  setDevOptBestPricesByUpc,
  setDevCurrentPriceCost,
  setDevUpcItems,
} from "../../../../../features/upcDevSlice";
import { getPriceOpt } from "../../../../../api/upc";
import { getItemLookupSingleStore } from "../../../../../api/itemLookup";
import type { ItemLookupHistory } from "../../../../../features/itemLookupSlice";
import { formatCurrency2 } from "../../../../../utils";
import type { UpcPriceOpt, UpcItem } from "../../../../../interfaces";
import {
  pricePoints,
  bestPriceByProfit,
  computeProfitAtRisk,
  elasticityFromPoints,
  getStatus,
  type PriceOptStatus,
} from "./priceOptStats";
import { runBatched } from "./runBatched";

const STATUS_LABEL: Record<PriceOptStatus, string> = {
  "no-comparison-data": "No comparison data",
  "no-current-price": "No current price",
  "no-cost-data": "No cost data",
  overpriced: "Overpriced",
  optimal: "Optimal",
};

const STATUS_CLASS: Record<PriceOptStatus, string> = {
  "no-comparison-data": "bg-gray-100 text-content/85",
  "no-current-price": "bg-gray-100 text-content/85",
  "no-cost-data": "bg-gray-100 text-content/85",
  overpriced: "bg-severity_critical_bg text-severity_critical_text",
  optimal: "bg-severity_healthy_bg text-severity_healthy_text",
};

const PriceOptTab = () => {
  const ctx = useUpcDevCtx();
  const dispatch = useAppDispatch();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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
        for (const item of j.best_prices_by_upc as UpcPriceOpt[]) {
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
    // ctx.searchVersion: a re-search resets priceOptLoaded/Loading, but this
    // effect otherwise has no dependency guaranteed to change on a re-search
    // (same store, same UPCs is a valid re-search) — without it, this would
    // only ever run once per mount and never refetch.
  }, [ctx.searchVersion]);

  const resolvedStoreId = ctx.searchType === "Store" ? ctx.selectedStore.storeid : ctx.priceOptStoreId;

  // Current price/cost is fetched reactively once a single store is
  // resolved — immediately in Store mode, on picking one in Group mode.
  // Never blocks the historical table above from rendering.
  useEffect(() => {
    if (!resolvedStoreId || !ctx.optBestPricesByUpc.length) return;

    const codes = [...new Set(ctx.optBestPricesByUpc.map((r) => r.product_code))];
    const toFetch = codes.filter((code) => !ctx.currentPriceCost[`${resolvedStoreId}:${code}`]);
    if (!toFetch.length) return;

    runBatched(
      toFetch,
      async (code) => {
        const res = await getItemLookupSingleStore(ctx.url, ctx.token, code, resolvedStoreId);
        const history = (res.data?.history ?? []) as ItemLookupHistory[];
        const last = history[history.length - 1];
        return { currentPrice: last ? last.price : null, currentCost: last ? last.casecost : null };
      },
      20,
      (code, data) => {
        dispatch(setDevCurrentPriceCost({ key: `${resolvedStoreId}:${code}`, data: { product_code: code, ...data } }));
      },
    );
  }, [resolvedStoreId, ctx.optBestPricesByUpc]);

  const toggle = (code: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const rows = useMemo(() => {
    const src = ctx.selectedUpcs.length > 0
      ? ctx.optBestPricesByUpc.filter((o) => ctx.selectedUpcs.includes(o.product_code))
      : ctx.optBestPricesByUpc;

    return src.map((row) => {
      const points = pricePoints(ctx.optBestPrices, row.product_code);
      const cpc = resolvedStoreId ? ctx.currentPriceCost[`${resolvedStoreId}:${row.product_code}`] : undefined;
      const currentPrice = cpc?.currentPrice ?? null;
      const currentCost = cpc?.currentCost ?? null;
      const best = bestPriceByProfit(points, currentCost, row.price, row.total_qty, row.total_revenue);
      const status = getStatus(points, currentPrice, currentCost, resolvedStoreId !== null, best.price);
      const risk = computeProfitAtRisk(currentPrice, currentCost, best.price, best.qty, points);
      const elasticity = elasticityFromPoints(points);
      return { row, points, best, currentPrice, currentCost, status, risk, elasticity };
    });
  }, [ctx.optBestPricesByUpc, ctx.optBestPrices, ctx.selectedUpcs, ctx.currentPriceCost, resolvedStoreId]);

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

  const hasStore = resolvedStoreId !== null;
  const colSpan = hasStore ? 7 : 6;

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex-1 overflow-auto thin-scrollbar min-h-0">
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="sticky top-0 bg-gray-100 z-10">
              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-content/85" style={{ width: 220 }}>Product</th>
              {hasStore ? (
                <>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-content/85">Current price</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-content/85">Current cost</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-content/85">Best price</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-content/85">Status</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-content/85">Profit impact</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-content/85">Elasticity</th>
                </>
              ) : (
                <>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-content/85">Best price</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-content/85">Best revenue</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-content/85">Best qty</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-content/85">Elasticity</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-content/85">Price points</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ row, points, best, currentPrice, currentCost, status, risk, elasticity }) => {
              const isOpen = expanded.has(row.product_code);
              return (
                <React.Fragment key={row.product_code}>
                  <tr
                    className="border-b border-gray-100 hover:bg-gray-50/80 cursor-pointer"
                    onClick={() => toggle(row.product_code)}
                  >
                    <td className="px-3 py-[7px]">
                      <div className="flex items-center gap-1.5">
                        {isOpen
                          ? <ChevronDownIcon className="w-3 h-3 text-content/85 flex-shrink-0" />
                          : <ChevronRightIcon className="w-3 h-3 text-content/85 flex-shrink-0" />}
                        <div className="min-w-0">
                          <div className="text-content font-medium truncate">{row.product_description}</div>
                          <div className="text-content/85 font-mono">{row.product_code}</div>
                        </div>
                      </div>
                    </td>
                    {hasStore ? (
                      <>
                        <td className={`px-3 py-[7px] text-right tabular-nums ${status === "overpriced" ? "text-severity_critical_text font-semibold" : "text-content"}`}>
                          {currentPrice !== null ? formatCurrency2(currentPrice) : "—"}
                        </td>
                        <td className="px-3 py-[7px] text-right tabular-nums text-content/85">
                          {currentCost !== null ? formatCurrency2(currentCost) : "—"}
                        </td>
                        <td className="px-3 py-[7px] text-right tabular-nums text-severity_healthy_text font-semibold">
                          {formatCurrency2(best.price)}
                        </td>
                        <td className="px-3 py-[7px] text-right">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${STATUS_CLASS[status]}`}>
                            {STATUS_LABEL[status]}
                          </span>
                        </td>
                        <td className="px-3 py-[7px] text-right tabular-nums">
                          {risk.status === "ok"
                            ? <span className="text-severity_healthy_text font-semibold">+{formatCurrency2(risk.profitAtRisk)}</span>
                            : <span className="text-content/85">—</span>}
                        </td>
                        <td className="px-3 py-[7px] text-right tabular-nums text-content/85">
                          {elasticity !== null ? elasticity.toFixed(1) : "—"}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-[7px] text-right tabular-nums text-severity_healthy_text font-semibold">
                          {formatCurrency2(best.price)}
                        </td>
                        <td className="px-3 py-[7px] text-right tabular-nums text-content/85">{formatCurrency2(best.revenue)}</td>
                        <td className="px-3 py-[7px] text-right tabular-nums text-content/85">{best.qty}</td>
                        <td className="px-3 py-[7px] text-right tabular-nums text-content/85">
                          {elasticity !== null ? elasticity.toFixed(1) : "—"}
                        </td>
                        <td className="px-3 py-[7px] text-right tabular-nums text-content/85">{points.length}</td>
                      </>
                    )}
                  </tr>

                  {isOpen && (
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <td colSpan={colSpan} className="px-3 py-2">
                        <table className="w-full text-[11px] border-collapse">
                          <thead>
                            <tr>
                              <th className="text-left py-1 text-[10px] font-semibold uppercase tracking-wide text-content/85">Price</th>
                              <th className="text-right py-1 text-[10px] font-semibold uppercase tracking-wide text-content/85">Qty</th>
                              <th className="text-right py-1 text-[10px] font-semibold uppercase tracking-wide text-content/85">Revenue</th>
                              {hasStore && <th className="text-right py-1 text-[10px] font-semibold uppercase tracking-wide text-content/85">Profit</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {[...points].sort((a, b) => b.revenue - a.revenue).map((p) => {
                              const isBest = p.price === best.price;
                              const isCurrent = currentPrice !== null && p.price === currentPrice;
                              return (
                                <tr key={p.price} className={isBest ? "bg-severity_healthy_bg/40" : isCurrent ? "bg-severity_critical_bg/30" : undefined}>
                                  <td className="py-1 text-content">
                                    {formatCurrency2(p.price)}
                                    {isBest && <span className="ml-1.5 text-[10px] font-semibold text-severity_healthy_text">best</span>}
                                    {isCurrent && <span className="ml-1.5 text-[10px] font-semibold text-severity_critical_text">current</span>}
                                  </td>
                                  <td className="py-1 text-right tabular-nums text-content/85">{p.qty}</td>
                                  <td className="py-1 text-right tabular-nums text-content/85">{formatCurrency2(p.revenue)}</td>
                                  {hasStore && (
                                    <td className="py-1 text-right tabular-nums text-content/85">
                                      {currentCost !== null ? formatCurrency2((p.price - currentCost) * p.qty) : "—"}
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {!hasStore && (
                          <div className="mt-2 text-[10px] text-content/85 italic">
                            Select a store above to see profit and current price comparison.
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-3 py-1.5 text-[10px] text-content/85 italic flex-shrink-0 border-t border-gray-100">
        Best price = highest total profit once cost is known, otherwise highest revenue in history · Profit = (price − cost) × qty
      </div>
    </div>
  );
};

export default PriceOptTab;
