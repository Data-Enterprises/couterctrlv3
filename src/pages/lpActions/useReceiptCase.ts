import { useCallback, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { getCashierTransaction } from "../../api/lossPrevention";
import { cacheLpBasket } from "../../features/lpActionsSlice";
import type {
  CashierTransaction,
  JsonError,
  TransactionListItem,
} from "../../interfaces";

/**
 * One receipt, opened in full.
 *
 * Uses `cashiers/transaction` — the same call LP's own drill-down makes — and
 * not `transaction_list`. The difference matters: `transaction_list` is the
 * bulk read, it takes a `sale_type` and answers on `transactions`, so asking it
 * for one receipt means choosing a type to filter by and getting back only
 * those lines. `cashiers/transaction` takes the date, the sale id and the
 * store, carries no type at all, and answers on `transaction` — the whole
 * basket, whatever rang in it.
 *
 * That is what a case needs. A No Sale rings nothing, so filtering by any sale
 * type would have returned an empty receipt for exactly the exception most
 * worth looking at.
 *
 * Baskets already read are held in `lpActionsSlice`, so reopening one costs
 * nothing. Closing the overlay used to reset this to empty, which made even an
 * immediate second look at the same receipt a fresh request.
 */
export interface ReceiptCase {
  saleId: string;
  /** The exception that led here, so its lines can be picked out. */
  exceptionType: string;
  lines: TransactionListItem[];
  loading: boolean;
  error: string | null;
}

const empty: ReceiptCase = {
  saleId: "",
  exceptionType: "",
  lines: [],
  loading: false,
  error: null,
};

/** A sale id only identifies a receipt within its store and its day, so all
 *  three are needed — the same three `cashiers/transaction` is asked for. */
const basketKey = (storeid: number, date: string, saleId: string) =>
  `${storeid}:${date}:${saleId}`;

export const useReceiptCase = () => {
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((s) => s.app);
  const baskets = useAppSelector((s) => s.lpActions.baskets);
  const [state, setState] = useState<ReceiptCase>(empty);
  /** A receipt opened while another is still in flight must not be overwritten
   *  by the slower response. */
  const requestId = useRef(0);

  const open = useCallback(
    async (row: CashierTransaction) => {
      const id = ++requestId.current;
      const date = row.sale_date.split("T")[0];
      const key = basketKey(row.storeid, date, row.sale_id);

      const cached = baskets[key];
      if (cached) {
        setState({
          saleId: row.sale_id,
          exceptionType: row.sale_type,
          lines: cached,
          loading: false,
          error: null,
        });
        return;
      }

      setState({
        saleId: row.sale_id,
        // Taken from the row rather than the focused node, so a receipt opened
        // from an unfiltered list still knows what to highlight.
        exceptionType: row.sale_type,
        lines: [],
        loading: true,
        error: null,
      });

      try {
        const resp = await getCashierTransaction(
          url,
          token,
          date,
          row.sale_id,
          row.storeid,
        );

        const j = resp.data;
        if (j.error !== 0) {
          if (requestId.current !== id) return;
          setState({
            saleId: row.sale_id,
            exceptionType: row.sale_type,
            lines: [],
            loading: false,
            error: j.msg ?? "Could not open that receipt",
          });
          return;
        }

        // Register order — a receipt read out of sequence loses the one thing
        // its ordering says: where in the basket the exception fell. Sorted
        // before caching so every later reader gets it in order too.
        const lines: TransactionListItem[] = [...(j.transaction ?? [])]
          .map((item: TransactionListItem) => ({ ...item, qty: item.qty ?? 0 }))
          .sort((a, b) => a.line_number - b.line_number);

        // Cached even when the reader has moved on — it is a valid answer for
        // that key, and holding it means coming back to this receipt is free.
        // An empty basket is a real result and caches; a failure above does
        // not, or the retry would never happen.
        dispatch(cacheLpBasket({ key, lines }));
        if (requestId.current !== id) return;

        setState({
          saleId: row.sale_id,
          exceptionType: row.sale_type,
          lines,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (requestId.current !== id) return;
        setState({
          saleId: row.sale_id,
          exceptionType: row.sale_type,
          lines: [],
          loading: false,
          error: (err as JsonError).message,
        });
      }
    },
    [url, token, baskets, dispatch],
  );

  const close = useCallback(() => {
    requestId.current++;
    setState(empty);
  }, []);

  return { receipt: state, openReceipt: open, closeReceipt: close };
};
