import { useCallback, useEffect, useRef, useState } from "react";
import { useAppSelector } from "../../../hooks";
import { getTransactionList } from "../../../api/lossPrevention";
import { fetchAllPages } from "../../../utils/paging";
import type { JsonError, TransactionListItem } from "../../../interfaces";

/**
 * The exception lines behind one cashier, across the whole window.
 *
 * One `transaction_list` call per exception type, each passing that type and
 * only that type's sale ids — the same way every other LP screen calls it.
 * Asking for `Sale` instead returns every line of every basket, which is both
 * an order of magnitude more rows and the wrong evidence: a refund case wants
 * the items that were refunded, not everything else the customer bought.
 *
 * Deliberately spans **all** weeks rather than the latest. An item is only
 * "new" if it is absent from the weeks before, and a cluster is only unusual
 * if the prior weeks were spread — both claims need the history, so fetching
 * the spike week alone would produce evidence that cannot be checked.
 */
const MAX_IDS = 400;

/** One exception type and the receipts it happened on. */
export interface TypeScope {
  saleType: string;
  saleIds: string[];
}

export interface CaseReceipts {
  lines: TransactionListItem[];
  loading: boolean;
  error: string | null;
  /** Receipts past the per-type cap. Reported rather than silently dropped. */
  truncated: number;
}

const empty: CaseReceipts = {
  lines: [],
  loading: false,
  error: null,
  truncated: 0,
};

const keyOf = (scopes: TypeScope[]) =>
  scopes.map((s) => `${s.saleType}:${s.saleIds.join(",")}`).join("|");

export const useCaseReceipts = (scopes: TypeScope[]) => {
  const { url, token } = useAppSelector((s) => s.app);
  const [state, setState] = useState<CaseReceipts>(empty);
  const requestId = useRef(0);
  /** The scope set this hook last ran for, so a re-render with an
   *  equal-but-new array does not refetch. */
  const lastKey = useRef("");

  const run = useCallback(
    async (all: TypeScope[]) => {
      const id = ++requestId.current;
      if (all.length === 0) {
        setState(empty);
        return;
      }

      const truncated = all.reduce(
        (acc, s) => acc + Math.max(0, s.saleIds.length - MAX_IDS),
        0,
      );
      setState({ ...empty, loading: true, truncated });

      const one = async (scope: TypeScope): Promise<TransactionListItem[]> => {
        const ids = scope.saleIds.slice(0, MAX_IDS);
        if (ids.length === 0) return [];
        const first = await getTransactionList(
          url,
          token,
          ids,
          1,
          scope.saleType,
        );
        if (first.data.error !== 0) return [];
        return fetchAllPages<TransactionListItem>(
          first.data,
          first.data.transactions ?? [],
          async (page) => {
            try {
              const r = await getTransactionList(
                url,
                token,
                ids,
                page,
                scope.saleType,
              );
              return r.data.error === 0 ? r.data.transactions : [];
            } catch {
              return [];
            }
          },
        );
      };

      try {
        const byType = await Promise.all(all.map(one));
        if (requestId.current !== id) return;
        setState({
          lines: byType.flat(),
          loading: false,
          error: null,
          truncated,
        });
      } catch (err) {
        if (requestId.current !== id) return;
        setState({
          ...empty,
          error: (err as JsonError).message || "Could not read the receipts",
        });
      }
    },
    [url, token],
  );

  useEffect(() => {
    const key = keyOf(scopes);
    if (key === lastKey.current) return;
    lastKey.current = key;
    run(scopes);
  }, [scopes, run]);

  return state;
};
