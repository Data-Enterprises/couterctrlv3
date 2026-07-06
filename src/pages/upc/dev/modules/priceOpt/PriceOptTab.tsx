import { useEffect, useMemo } from "react";
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
import type { UpcPriceOpt, UpcItem } from "../../../../../interfaces";

const PriceOptTab = () => {
  const ctx = useUpcDevCtx();
  const dispatch = useAppDispatch();

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
  }, []);

  const byUpc = useMemo(() => {
    const src = ctx.selectedUpcs.length > 0
      ? ctx.optBestPricesByUpc.filter((o) => ctx.selectedUpcs.includes(o.product_code))
      : ctx.optBestPricesByUpc;

    const map = new Map<string, typeof src>();
    for (const row of src) {
      const existing = map.get(row.product_code) ?? [];
      existing.push(row);
      map.set(row.product_code, existing);
    }
    return Array.from(map.entries());
  }, [ctx.optBestPricesByUpc, ctx.selectedUpcs]);

  if (ctx.priceOptLoading) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/40">
        Loading price optimization…
      </div>
    );
  }

  if (!ctx.priceOptLoaded) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/30">
        Navigate here to load price optimization data
      </div>
    );
  }

  if (!byUpc.length) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/30">
        No price optimization data
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto thin-scrollbar min-h-0">
      <table className="w-full text-[11px] border-collapse">
        <thead>
          <tr className="sticky top-0 bg-gray-100 z-10">
            <th className="px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-wide text-content/40 whitespace-nowrap">UPC</th>
            <th className="px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-wide text-content/40">Description</th>
            <th className="px-3 py-2 text-right text-[9px] font-semibold uppercase tracking-wide text-content/40">Price</th>
            <th className="px-3 py-2 text-right text-[9px] font-semibold uppercase tracking-wide text-content/40">Qty</th>
            <th className="px-3 py-2 text-right text-[9px] font-semibold uppercase tracking-wide text-content/40">Revenue</th>
            <th className="px-3 py-2 text-right text-[9px] font-semibold uppercase tracking-wide text-content/40">Weight</th>
          </tr>
        </thead>
        <tbody>
          {byUpc.map(([upc, rows]) =>
            rows.map((row, i) => (
              <tr
                key={`${upc}-${row.price}-${i}`}
                className="border-b border-gray-100 hover:bg-gray-50/80"
                style={{ background: i === 0 ? "rgba(30,42,74,0.025)" : undefined }}
              >
                <td className="px-3 py-[7px] text-content/50 tabular-nums whitespace-nowrap">
                  {i === 0 ? upc : ""}
                </td>
                <td className="px-3 py-[7px] text-content max-w-[200px] truncate">
                  {i === 0 ? row.product_description : ""}
                </td>
                <td className="px-3 py-[7px] text-right tabular-nums font-semibold text-[#1e2a4a]">
                  ${Number(row.price).toFixed(2)}
                </td>
                <td className="px-3 py-[7px] text-right tabular-nums text-content/80">{row.total_qty}</td>
                <td className="px-3 py-[7px] text-right tabular-nums text-content/80">
                  ${row.total_revenue.toFixed(2)}
                </td>
                <td className="px-3 py-[7px] text-right tabular-nums text-content/60">
                  {row.total_weight.toFixed(2)}
                </td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PriceOptTab;
