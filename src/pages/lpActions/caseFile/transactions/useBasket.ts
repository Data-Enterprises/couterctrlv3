import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { getCashierTransaction } from "../../../../api/lossPrevention";
import { cacheLpBasket } from "../../../../features/lpActionsSlice";
import type { LpReceiptRef } from "../../../../features/lpActionsSlice";
import type { JsonError, TransactionListItem } from "../../../../interfaces";

/**
 * One whole receipt, for the sheet.
 *
 * Uses `cashiers/transaction`, not `transaction_list`. The difference matters:
 * `transaction_list` is the bulk read, it takes a sale type and answers only
 * that type's lines — so asking it for one receipt means choosing a type and
 * getting a fragment. `cashiers/transaction` takes the date, the sale id and
 * the store, carries no type at all, and answers with the whole basket. A no
 * sale rings nothing, so filtering by any type would have returned an empty
 * receipt for exactly the exception most worth opening.
 *
 * Baskets already read are held in the slice, so reopening one is free. Only
 * successful reads are cached — an error answers with the same empty
 * `transaction` an empty basket does, and storing that would pin the wrong
 * answer in place and never ask again.
 */
export interface BasketState {
  lines: TransactionListItem[];
  loading: boolean;
  error: string | null;
}

const basketKey = (ref: LpReceiptRef) =>
  `${ref.storeid}:${ref.date}:${ref.saleId}`;

export const useBasket = (ref: LpReceiptRef | null): BasketState => {
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((s) => s.app);
  const baskets = useAppSelector((s) => s.lpActions.baskets);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** A receipt opened while another is in flight must not be overwritten by
   *  the slower response. */
  const requestId = useRef(0);

  const key = ref ? basketKey(ref) : "";
  const cached = key ? baskets[key] : undefined;

  useEffect(() => {
    if (!ref || cached) return;

    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    getCashierTransaction(url, token, ref.date, ref.saleId, ref.storeid)
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0) {
          if (requestId.current === id) {
            setError(j.msg ?? "Could not open that receipt");
            setLoading(false);
          }
          return;
        }
        // Register order — a receipt read out of sequence loses the one thing
        // its ordering says: where in the basket the exception fell.
        const lines: TransactionListItem[] = [...(j.transaction ?? [])]
          .map((item: TransactionListItem) => ({ ...item, qty: item.qty ?? 0 }))
          .sort((a, b) => a.line_number - b.line_number);

        // Cached even if the reader has moved on: it is a valid answer for
        // that key, so coming back to this receipt costs nothing.
        dispatch(cacheLpBasket({ key: basketKey(ref), lines }));
        if (requestId.current === id) setLoading(false);
      })
      .catch((err) => {
        if (requestId.current !== id) return;
        setError((err as JsonError).message ?? "Could not open that receipt");
        setLoading(false);
      });
  }, [ref, cached, url, token, dispatch]);

  return { lines: cached ?? [], loading: loading && !cached, error };
};
