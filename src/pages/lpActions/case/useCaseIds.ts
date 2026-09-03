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
  const { windows } = useAppSelector((s) => s.lpActions);
  const [state, setState] = useState<CaseIds>(empty);
  /** The most recent request. A slower answer to an older question is dropped
   *  rather than rendered under the cashier now on screen. */
  const requestId = useRef(0);

  const key = ref
    ? `${ref.storeid}:${ref.cashierNumber}:${types.join(",")}`
    : "";
  const span = windows.length
    ? `${windows[0].start}:${windows[windows.length - 1].end}`
    : "";

  useEffect(() => {
    if (!enabled || !ref || types.length === 0 || windows.length === 0) {
      setState(empty);
      return;
    }

    const id = ++requestId.current;
    setState({ ids: [], loading: true, error: null });

    const isGroup = isGroupSearch(type);
    getTransactionIds(
      url,
      token,
      windows[0].start,
      windows[windows.length - 1].end,
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
          ids: j.transaction_ids.filter((t) => storeIdOf(t) === ref.storeid),
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
    // `key` and `span` stand in for ref/types/windows, which are fresh objects
    // on every render and would otherwise refetch continuously.
  }, [enabled, key, span, url, token, type, lastStore, lastGroup]);

  return state;
};
