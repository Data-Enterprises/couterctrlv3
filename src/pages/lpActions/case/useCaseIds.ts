import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../../../hooks";
import { getTransactionIds } from "../../../api/lossPrevention";
import { isGroupSearch } from "../../../features/searchSlice";
import { storeIdOf } from "./caseSource";
import type { CashierRef } from "../lpActionsMetrics";
import type { JsonError, TransactionIdsResp } from "../../../interfaces";

/**
 * One cashier's basket ids across the searched span.
 *
 * Only used when the overview came from the rollup. The rollup answers "how
 * many" and deliberately not "which", so the case file — which is entirely
 * about which — fetches its own. On the prod path `rawRows` already holds them
 * and this never runs.
 *
 * It is one request for the whole case: `transaction_ids` takes every relevant
 * exception type at once, and `transaction_list` then filters by type itself,
 * so the same id list serves every tab.
 */
export interface CaseIds {
  ids: string[];
  loading: boolean;
  error: string | null;
}

const empty: CaseIds = { ids: [], loading: false, error: null };

export const useCaseIds = (
  ref: CashierRef | null,
  types: string[],
  enabled: boolean,
): CaseIds => {
  const { url, token } = useAppSelector((s) => s.app);
  const { type, lastStore, lastGroup } = useAppSelector((s) => s.search);
  const { windows, caseWeek } = useAppSelector((s) => s.lpActions);
  /**
   * One week, not four.
   *
   * `transaction_ids` takes a date range, so scoping to the week that flagged
   * costs nothing and makes the evidence set small enough to read. The other
   * weeks are the baseline it was measured against, not the finding.
   */
  const scope =
    caseWeek !== null && windows[caseWeek]
      ? windows[caseWeek]
      : windows.length > 0
        ? { start: windows[0].start, end: windows[windows.length - 1].end }
        : null;
  const [state, setState] = useState<CaseIds>(empty);
  /** The most recent request. A slower answer to an older question is dropped
   *  rather than rendered under the cashier now on screen. */
  const requestId = useRef(0);

  const key = ref
    ? `${ref.storeid}:${ref.cashierNumber}:${types.join(",")}`
    : "";
  /**
   * The dates actually being asked for.
   *
   * This used to be the whole span, which does not change when the reader
   * picks a different week — so the strip re-scoped the request in principle
   * and the effect never ran, leaving the ids from whichever week the case
   * opened on. The window's own dates are in here too, so widening the search
   * still refetches.
   */
  const scopeKey = scope ? `${scope.start}:${scope.end}` : "";

  useEffect(() => {
    if (!enabled || !ref || types.length === 0 || !scope) {
      setState(empty);
      return;
    }

    const id = ++requestId.current;
    setState({ ids: [], loading: true, error: null });

    const isGroup = isGroupSearch(type);
    getTransactionIds(
      url,
      token,
      scope.start,
      scope.end,
      isGroup ? 1 : 0,
      isGroup ? lastGroup : lastStore,
      isGroup ? 0 : 1,
      types,
      undefined,
      "",
      ref.cashierNumber,
    )
      .then((resp) => {
        if (requestId.current !== id) return;
        const j = resp.data as TransactionIdsResp;
        if (j.error !== 0) {
          setState({
            ids: [],
            loading: false,
            error: j.msg ?? "Could not load receipts",
          });
          return;
        }
        // A group search answers for that cashier NUMBER at every store in the
        // group, and 19 at one store is a different person from 19 at another.
        // The storeid is in the id itself, so this costs nothing.
        setState({
          // Coerced on both sides. `storeIdOf` parses a number out of the id
          // string, and a `storeid` that arrives as a string despite its type
          // — which this API has done before with `product_code` — makes
          // `17 === "17"` false and silently drops every basket, leaving the
          // case with ids fetched and no receipts to ask for.
          ids: j.transaction_ids.filter(
            (t) => storeIdOf(t) === Number(ref.storeid),
          ),
          loading: false,
          error: null,
        });
      })
      .catch((err: JsonError) => {
        if (requestId.current !== id) return;
        setState({
          ids: [],
          loading: false,
          error: err.message ?? "Could not load receipts",
        });
      });
    // `key` and `scopeKey` stand in for ref/types/scope, which are fresh
    // objects on every render and would otherwise refetch continuously.
  }, [enabled, key, scopeKey, url, token, type, lastStore, lastGroup]);

  return state;
};
