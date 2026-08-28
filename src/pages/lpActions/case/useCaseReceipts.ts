import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { getTransactionList } from "../../../api/lossPrevention";
import { fetchAllPages } from "../../../utils/paging";
import {
  lpFetchStarted,
  lpFetchSettled,
  cacheLpReceiptLines,
} from "../../../features/lpActionsSlice";
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
 *
 * Answers are cached in `lpActionsSlice` by scope, so this hook only ever
 * requests what is genuinely missing. That matters in two places: clicking
 * back to a node you already opened costs nothing, and the case report and the
 * journey drill build identical scopes for the same cashier and type, so
 * whichever runs second reads the first one's result.
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

/**
 * Cache identity for a scope.
 *
 * Built from the CAPPED ids, not the requested ones — the cap is applied
 * before the request goes out, so keying on the full list would label 500
 * ids' worth of key onto 400 ids' worth of lines.
 */
const scopeKey = (scope: TypeScope) =>
  `${scope.saleType}:${scope.saleIds.slice(0, MAX_IDS).join(",")}`;

/**
 * Keys this module has requests open for, deduped across every mounted copy
 * of the hook.
 *
 * The slice's `pending` is the same information and is what the spinner reads,
 * but a selector value is fixed for the render it was read in: two components
 * whose effects fire in the same commit would both see an empty `pending` and
 * both dispatch. This is a request latch rather than state, so it is checked
 * synchronously here and mirrored into Redux for display.
 */
const inFlight = new Set<string>();

export const useCaseReceipts = (scopes: TypeScope[]): CaseReceipts => {
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((s) => s.app);
  const cache = useAppSelector((s) => s.lpActions.receiptLines);
  const pending = useAppSelector((s) => s.lpActions.pending);
  const [error, setError] = useState<string | null>(null);
  /** Guards the error message against a request the reader has moved past. */
  const requestId = useRef(0);

  const keys = useMemo(() => scopes.map(scopeKey), [scopes]);

  const truncated = useMemo(
    () =>
      scopes.reduce((acc, s) => acc + Math.max(0, s.saleIds.length - MAX_IDS), 0),
    [scopes],
  );

  const run = useCallback(
    async (missing: TypeScope[]) => {
      const id = ++requestId.current;
      const missingKeys = missing.map(scopeKey);
      missingKeys.forEach((k) => inFlight.add(k));
      dispatch(lpFetchStarted(missingKeys));
      setError(null);

      /**
       * One scope, fully paged.
       *
       * Reports whether the read was `complete` so the caller can decline to
       * cache a partial one. `transaction_list` answers an error with the same
       * empty `transactions` an empty result has, and a dropped page looks
       * like a short list rather than a failure — caching either would pin the
       * wrong answer in place and never ask again.
       */
      const one = async (
        scope: TypeScope,
      ): Promise<{
        key: string;
        lines: TransactionListItem[];
        complete: boolean;
      }> => {
        const key = scopeKey(scope);
        const ids = scope.saleIds.slice(0, MAX_IDS);
        if (ids.length === 0) return { key, lines: [], complete: true };

        const first = await getTransactionList(
          url,
          token,
          ids,
          1,
          scope.saleType,
        );
        // An endpoint error is not an empty result. It is also not a reason to
        // ask forever: a scope that genuinely has no lines — `Tender` on a set
        // of receipts that were all voided, say — answers 0 with `error: 0`,
        // and that empty answer caches like any other. Only a real failure
        // stays uncached.
        if (first.data.error !== 0) return { key, lines: [], complete: false };

        let dropped = 0;
        const lines = await fetchAllPages<TransactionListItem>(
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
              if (r.data.error !== 0) {
                dropped += 1;
                return [];
              }
              return r.data.transactions;
            } catch {
              dropped += 1;
              return [];
            }
          },
        );
        return { key, lines, complete: dropped === 0 };
      };

      try {
        // `allSettled`, not `all`. A rejection from one scope — axios throws on
        // any non-2xx — would otherwise discard the scopes that succeeded
        // alongside it, so nothing at all would cache and every revisit would
        // ask again for lines already in hand.
        const settled = await Promise.allSettled(missing.map(one));
        const good = settled
          .filter(
            (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof one>>> =>
              r.status === "fulfilled" && r.value.complete,
          )
          .map((r) => ({ key: r.value.key, lines: r.value.lines }));

        if (good.length > 0) dispatch(cacheLpReceiptLines(good));

        if (good.length < settled.length && requestId.current === id) {
          const rejected = settled.find((r) => r.status === "rejected");
          setError(
            rejected
              ? ((rejected as PromiseRejectedResult).reason as JsonError)
                  ?.message || "Could not read the receipts"
              : "Some receipts could not be read — reopen to try again",
          );
        }
      } finally {
        // Always released, even for a response nobody is waiting for any more:
        // a key left in flight would spin forever and never be re-requested.
        missingKeys.forEach((k) => inFlight.delete(k));
        dispatch(lpFetchSettled(missingKeys));
      }
    },
    [url, token, dispatch],
  );

  useEffect(() => {
    const missing = scopes.filter((s) => {
      const key = scopeKey(s);
      return !(key in cache) && !inFlight.has(key);
    });
    if (missing.length === 0) return;
    void run(missing);
    // `cache` is read to decide what is missing, but must not be a dependency:
    // caching a result would re-run this effect against the same scopes, and
    // the point of the cache is that the second pass finds nothing to do.
  }, [keys, run]);

  const lines = useMemo(
    () => keys.flatMap((k) => cache[k] ?? []),
    [keys, cache],
  );

  return {
    lines,
    // Per key, so a request for one scope cannot show a spinner over another
    // scope that is already cached and on screen.
    loading: keys.some((k) => pending.includes(k)),
    error,
    truncated,
  };
};
