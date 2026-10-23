import { useCallback, useRef, useState } from "react";
import { useAppSelector } from ".";
import { useActualPricePoints } from "./useActualPricePoints";
import { getPricePoints, type ServerPricePoint } from "../api/pricePoints";

/**
 * The price table from the server, the receipts only on request.
 *
 * Shared, because Price Opt and Item Actions ask the same question. Item
 * Actions used to build its own table by walking receipts, which is how it
 * came to list a random-weight item at package prices -- $6.14 and $6.94 on
 * a line whose shelf price is $3.99 a pound (finding AS).
 *
 * The table comes from `cashiers/price_points`, one small response. It used
 * to be built from up to 400 receipts downloaded through `product_lookup` and
 * `transaction_list` the moment an item was clicked, most of which nobody
 * looked at. Now the receipts are read when somebody opens one price's
 * transactions, once per item, in full, and each price shows the lines that
 * belong to it (`linesAtPrice`).
 */

export interface PricePointsState {
  rows: ServerPricePoint[];
  /** Which UPC `rows` belongs to. Read before anything else, for the same
   *  reason as `ActualFetchState.upc`: a slow answer for the last item must
   *  not render under this one. */
  upc: string | null;
  loading: boolean;
  error: string | null;
}

const initial: PricePointsState = {
  rows: [],
  upc: null,
  loading: false,
  error: null,
};

/** Every receipt, once somebody asks for them. */
const NO_CAP = Number.POSITIVE_INFINITY;

export const usePricePoints = () => {
  const { url, token } = useAppSelector((s) => s.app);
  const [prices, setPrices] = useState<PricePointsState>(initial);
  const requestId = useRef(0);
  /** What the receipts would be read for, held until somebody opens a price. */
  const scope = useRef<{
    upc: string;
    storeid: number;
    start: string;
    end: string;
  } | null>(null);
  const { actual: receipts, loadActual, resetActual } = useActualPricePoints();

  const loadPrices = useCallback(
    async (upc: string, storeid: number, start: string, end: string) => {
      const id = ++requestId.current;
      scope.current = { upc, storeid, start, end };
      resetActual();
      setPrices({ ...initial, upc, loading: true });
      const stale = () => requestId.current !== id;
      try {
        const resp = await getPricePoints(url, token, {
          storeid,
          productCode: upc,
          startDate: start,
          endDate: end,
        });
        if (stale()) return;
        const j = resp.data;
        if (j.error !== 0) {
          setPrices({
            ...initial,
            upc,
            error: j.msg ?? "Could not read the prices",
          });
          return;
        }
        setPrices({ rows: j.price_points ?? [], upc, loading: false, error: null });
      } catch (e) {
        if (stale()) return;
        setPrices({
          ...initial,
          upc,
          error: e instanceof Error ? e.message : "Could not read the prices",
        });
      }
    },
    [url, token, resetActual],
  );

  /** Read the item's receipts, the first time a price is opened. Asking again
   *  while they load, or once they are in, does nothing; after a failure it
   *  tries again. */
  const loadReceipts = useCallback(() => {
    const s = scope.current;
    if (!s) return;
    if (receipts.upc === s.upc && !receipts.error) return;
    loadActual(s.upc, s.storeid, s.start, s.end, NO_CAP);
  }, [receipts.upc, receipts.error, loadActual]);

  const resetPrices = useCallback(() => {
    requestId.current++;
    scope.current = null;
    resetActual();
    setPrices(initial);
  }, [resetActual]);

  return { prices, loadPrices, resetPrices, receipts, loadReceipts };
};
