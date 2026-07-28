import { useCallback, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { getItemLookupSingleStore } from "../../../../api/itemLookup";
import {
  addRecentLookup,
  setLookupQueue,
  updateLookupQueueItem,
  setLookupSelectedUpc,
  setLookupStoreNumbers,
  setLookupSelectedStoreNumber,
} from "../../../../features/itemLookupSlice";
import { computeMargin } from "../lookupMetrics";
import { scopeToStoreNumber, storeNumbersIn } from "../../../../utils/storeIdentity";
import type { ItemLookupHistory } from "../../../../features/itemLookupSlice";

// The lookup is fetched by storeid, so a co-located storeid returns both
// locations' line items in one history. Every headline figure is derived from
// those rows, so scoping the rows re-derives all of them — no refetch needed.
const deriveTotals = (
  history: ItemLookupHistory[],
  storeNumber: string | null,
) => {
  const rows = storeNumber ? scopeToStoreNumber(history, storeNumber) : history;
  const totalSales = rows.reduce((acc, h) => acc + h.total_sales, 0);
  const totalQty = rows.reduce((acc, h) => acc + h.qty, 0);
  const daysSold = new Set(rows.map((h) => h.sale_date.split("T")[0])).size;
  return {
    history: rows,
    totalSales,
    totalQty,
    daysSold,
    marginPct: computeMargin(rows, totalSales, totalQty).marginPct,
  };
};

const MAX_CONCURRENT = 15;

export const useLookupQueue = () => {
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((s) => s.app);
  const {
    lookupQueue: queue,
    lookupSelectedUpc: selectedUpc,
    availableStoreNumbers,
    selectedStoreNumber,
  } = useAppSelector((s) => s.item);
  // Ref so the async batch callbacks below scope against the live value.
  const scopeRef = useRef<string | null>(selectedStoreNumber);
  scopeRef.current = selectedStoreNumber;
  const rawHistoryRef = useRef<Record<string, ItemLookupHistory[]>>({});
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
      dispatch(setLookupStoreNumbers([]));
      dispatch(setLookupSelectedStoreNumber(null));
      selectionMadeRef.current = false;
      scopeRef.current = null;
      rawHistoryRef.current = {};
      let discovered = false;

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
            rawHistoryRef.current[upc] = j.history;
            // First UPC back establishes the locations; the rest scope to it.
            if (!discovered && j.history.length > 0) {
              discovered = true;
              const numbers = storeNumbersIn(j.history);
              dispatch(setLookupStoreNumbers(numbers));
              if (numbers.length > 1) {
                scopeRef.current = numbers[0];
                dispatch(setLookupSelectedStoreNumber(numbers[0]));
              }
            }
            const totals = deriveTotals(j.history, scopeRef.current);
            dispatch(
              updateLookupQueueItem({
                upc,
                patch: {
                  status: "loaded",
                  productCode: j.product_code,
                  description: j.description,
                  categoryDescription: j.category_description,
                  ...totals,
                },
              }),
            );
            dispatch(
              addRecentLookup({
                productCode: j.product_code,
                description: j.description,
                marginPct: totals.marginPct,
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

  // Re-present the loaded batch as a different location. Pure re-derivation
  // from the cached unscoped history — no network.
  const applyStoreScope = useCallback(
    (storeNumber: string | null) => {
      scopeRef.current = storeNumber;
      dispatch(setLookupSelectedStoreNumber(storeNumber));
      for (const [upc, history] of Object.entries(rawHistoryRef.current)) {
        dispatch(
          updateLookupQueueItem({
            upc,
            patch: deriveTotals(history, storeNumber),
          }),
        );
      }
    },
    [dispatch],
  );

  return {
    queue,
    selectedUpc,
    setSelectedUpc,
    runBatch,
    availableStoreNumbers,
    selectedStoreNumber,
    applyStoreScope,
  };
};
