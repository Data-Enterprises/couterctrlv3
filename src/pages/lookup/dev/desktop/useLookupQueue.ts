import { useCallback, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { getItemLookupSingleStore } from "../../../../api/itemLookup";
import {
  addRecentLookup,
  setLookupQueue,
  updateLookupQueueItem,
  setLookupSelectedUpc,
} from "../../../../features/itemLookupSlice";
import { computeMargin } from "../lookupMetrics";

const MAX_CONCURRENT = 15;

export const useLookupQueue = () => {
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((s) => s.app);
  const { lookupQueue: queue, lookupSelectedUpc: selectedUpc } = useAppSelector((s) => s.item);
  const selectionMadeRef = useRef(false);

  const setSelectedUpc = useCallback(
    (upc: string | null) => {
      dispatch(setLookupSelectedUpc(upc));
    },
    [dispatch],
  );

  const runBatch = useCallback(
    async (upcs: string[], storeId: number) => {
      dispatch(setLookupQueue(upcs.map((upc) => ({ upc, status: "queued" as const }))));
      dispatch(setLookupSelectedUpc(null));
      selectionMadeRef.current = false;

      let index = 0;
      const next = async (): Promise<void> => {
        const i = index++;
        if (i >= upcs.length) return;
        const upc = upcs[i];
        dispatch(updateLookupQueueItem({ upc, patch: { status: "loading" } }));

        try {
          const resp = await getItemLookupSingleStore(url, token, upc, storeId, 14);
          const j = resp.data;
          if (j.error === 0) {
            const margin = computeMargin(j.history, j.total_sales, j.total_qty);
            dispatch(
              updateLookupQueueItem({
                upc,
                patch: {
                  status: "loaded",
                  productCode: j.product_code,
                  description: j.description,
                  categoryDescription: j.category_description,
                  history: j.history,
                  totalSales: j.total_sales,
                  totalQty: j.total_qty,
                  daysSold: j.days_sold,
                  marginPct: margin.marginPct,
                },
              }),
            );
            dispatch(
              addRecentLookup({
                productCode: j.product_code,
                description: j.description,
                marginPct: margin.marginPct,
              }),
            );
            if (!selectionMadeRef.current) {
              selectionMadeRef.current = true;
              dispatch(setLookupSelectedUpc(upc));
            }
          } else {
            dispatch(updateLookupQueueItem({ upc, patch: { status: "error", errorMessage: "Not found at this store" } }));
          }
        } catch {
          dispatch(updateLookupQueueItem({ upc, patch: { status: "error", errorMessage: "Not found at this store" } }));
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
