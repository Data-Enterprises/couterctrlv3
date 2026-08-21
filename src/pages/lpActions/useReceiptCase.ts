import { useCallback, useRef, useState } from "react";
import { useAppSelector } from "../../hooks";
import { getCashierTransaction } from "../../api/lossPrevention";
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

export const useReceiptCase = () => {
  const { url, token } = useAppSelector((s) => s.app);
  const [state, setState] = useState<ReceiptCase>(empty);
  /** A receipt opened while another is still in flight must not be overwritten
   *  by the slower response. */
  const requestId = useRef(0);

  const open = useCallback(
    async (row: CashierTransaction) => {
      const id = ++requestId.current;
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
          row.sale_date.split("T")[0],
          row.sale_id,
          row.storeid,
        );
        if (requestId.current !== id) return;

        const j = resp.data;
        if (j.error !== 0) {
          setState({
            saleId: row.sale_id,
            exceptionType: row.sale_type,
            lines: [],
            loading: false,
            error: j.msg ?? "Could not open that receipt",
          });
          return;
        }

        const lines: TransactionListItem[] = [...(j.transaction ?? [])].map(
          (item: TransactionListItem) => ({ ...item, qty: item.qty ?? 0 }),
        );

        setState({
          saleId: row.sale_id,
          exceptionType: row.sale_type,
          // Register order — a receipt read out of sequence loses the one
          // thing its ordering says: where in the basket the exception fell.
          lines: lines.sort((a, b) => a.line_number - b.line_number),
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
    [url, token],
  );

  const close = useCallback(() => {
    requestId.current++;
    setState(empty);
  }, []);

  return { receipt: state, openReceipt: open, closeReceipt: close };
};
