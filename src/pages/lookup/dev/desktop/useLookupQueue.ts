import { useCallback, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { getItemLookupSingleStore } from "../../../../api/itemLookup";
import { addRecentLookup } from "../../../../features/itemLookupSlice";
import type { ItemLookupHistory } from "../../../../features/itemLookupSlice";
import { computeMargin } from "../lookupMetrics";

const MAX_CONCURRENT = 15;

export type QueueItemStatus = "queued" | "loading" | "loaded" | "error";

export interface QueueItem {
  upc: string;
  status: QueueItemStatus;
  productCode?: string;
  description?: string;
  categoryDescription?: string;
  history?: ItemLookupHistory[];
  totalSales?: number;
  totalQty?: number;
  daysSold?: number;
  marginPct?: number | null;
  errorMessage?: string;
}

export const useLookupQueue = () => {
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((s) => s.app);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedUpc, setSelectedUpc] = useState<string | null>(null);

  const updateItem = (upc: string, patch: Partial<QueueItem>) => {
    setQueue((prev) => prev.map((q) => (q.upc === upc ? { ...q, ...patch } : q)));
  };

  const runBatch = useCallback(
    async (upcs: string[], storeId: number) => {
      const initial: QueueItem[] = upcs.map((upc) => ({ upc, status: "queued" }));
      setQueue(initial);
      setSelectedUpc(null);

      let index = 0;
      const next = async (): Promise<void> => {
        const i = index++;
        if (i >= upcs.length) return;
        const upc = upcs[i];
        updateItem(upc, { status: "loading" });

        try {
          const resp = await getItemLookupSingleStore(url, token, upc, storeId, 14);
          const j = resp.data;
          if (j.error === 0) {
            const margin = computeMargin(j.history, j.total_sales, j.total_qty);
            updateItem(upc, {
              status: "loaded",
              productCode: j.product_code,
              description: j.description,
              categoryDescription: j.category_description,
              history: j.history,
              totalSales: j.total_sales,
              totalQty: j.total_qty,
              daysSold: j.days_sold,
              marginPct: margin.marginPct,
            });
            dispatch(
              addRecentLookup({
                productCode: j.product_code,
                description: j.description,
                marginPct: margin.marginPct,
              }),
            );
            setSelectedUpc((current) => current ?? upc);
          } else {
            updateItem(upc, { status: "error", errorMessage: "Not found at this store" });
          }
        } catch {
          updateItem(upc, { status: "error", errorMessage: "Not found at this store" });
        }

        return next();
      };

      await Promise.all(
        Array.from({ length: Math.min(MAX_CONCURRENT, upcs.length) }, () => next()),
      );
    },
    [url, token, dispatch],
  );

  return { queue, selectedUpc, setSelectedUpc, runBatch };
};
