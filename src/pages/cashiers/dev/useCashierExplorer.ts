import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { getStoreName, formatGoliathDate } from "../../../utils";
import {
  getSaleTypes,
  getCashierTable,
  getTransactionList,
} from "../../../api/lossPrevention";
import {
  setExplorerLoading,
  setExplorerMessage,
  setExplorerSaleTypes,
  setExplorerException,
  setExplorerRows,
  setExplorerScopeLabel,
  setSelectedSaleType,
  beginExplorerRequest,
} from "../../../features/dev/devCashiersSlice";
import type { JsonError, TransactionListItem } from "../../../interfaces";
import { pickDefaultSaleTypeName } from "../../../utils/saleTypes";
import { isGroupSearch } from "../../../features/searchSlice";

/**
 * The explorer's two-stage fetch, used by the mobile explorer.
 *
 * Stage one preflights `sale_types` — which exceptions even occurred depends on
 * the scope and dates just chosen, so the list can't be static. Stage two walks
 * every page of `cashier_table` for the chosen exception, then pulls the full
 * receipts for those transactions: `transaction_list` returns every line of a
 * receipt, not just the exception lines, which is what makes transaction
 * position ("line 12 of 12") and the inline receipt possible.
 *
 * Lifted out of `Cashiers.tsx` rather than copied into mobile — it is ~90 lines
 * of paging, dedup and truncation, and two copies would drift the moment either
 * endpoint changes shape.
 */

/** Receipts are fetched by id; past this the request gets unwieldy and the page
 *  reports how many were dropped rather than hanging. */
const MAX_TRANSACTIONS = 400;

/** How a run ended. `stale` means a newer run superseded it and nothing it
 *  fetched was applied — the caller should do nothing further either. */
export type ExplorerOutcome = "loaded" | "empty" | "error" | "stale";

const fetchAllPages = async <T>(
  firstPage: { total_pages?: number },
  rows: T[],
  fetchPage: (page: number) => Promise<T[]>,
) => {
  const total = firstPage.total_pages ?? 1;
  if (total <= 1) return rows;
  const rest = await Promise.all(
    Array.from({ length: total - 1 }, (_, i) => fetchPage(i + 2)),
  );
  return [...rows, ...rest.flat()];
};

export const useCashierExplorer = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { url, token } = useAppSelector((s) => s.app);
  const { type, lastStore, lastGroup, singleDate } = useAppSelector(
    (s) => s.search,
  );
  const assignedStores = useAppSelector((s) => s.user.assignedStores);
  const { groups } = useAppSelector((s) => s.group);

  /** The week runs backwards from the picked date, as on every other page. */
  const scopeArgs = () => {
    const end = formatGoliathDate(singleDate);
    const [y, m, d] = end.split("-").map(Number);
    const start = new Date(Date.UTC(y, m - 1, d - 6))
      .toISOString()
      .slice(0, 10);
    return {
      start,
      end,
      useGroups: isGroupSearch(type) ? 1 : 0,
      singleStore: type === "Store" ? 1 : 0,
      searchValue: isGroupSearch(type) ? lastGroup : lastStore,
    };
  };

  /**
   * Starts a run and returns a check for whether it has since been superseded.
   * The counter lives in the slice, so it is read back through getState rather
   * than a selector — a selector value is frozen at the render that created
   * this closure and would never see the bump from a later run.
   */
  const beginRequest = () => {
    const currentId = () =>
      dispatch((_, getState) => getState().cashier.explorerRequestId);
    dispatch(beginExplorerRequest());
    const id = currentId();
    return () => currentId() !== id;
  };

  const scopeLabel = () =>
    isGroupSearch(type)
      ? (groups.find((g) => g.id === lastGroup)?.group_name ?? "Group")
      : getStoreName(assignedStores, lastStore, `Store ${lastStore}`);

  /**
   * Stage one. Resolves to the exception types found, already defaulted — the
   * caller gets the list *and* the one to land on, so it never has to duplicate
   * `pickDefaultSaleTypeName`.
   */
  const runPreflight = async (): Promise<{
    types: string[];
    fallback: string;
    outcome: ExplorerOutcome;
  }> => {
    const { start, end, useGroups, searchValue, singleStore } = scopeArgs();
    const isStale = beginRequest();
    dispatch(setExplorerLoading(true));
    dispatch(setExplorerMessage("Finding exceptions…"));
    dispatch(setExplorerSaleTypes([]));
    dispatch(setExplorerException(""));

    try {
      const resp = await getSaleTypes(
        url,
        token,
        start,
        end,
        useGroups,
        searchValue,
        singleStore,
      );
      if (isStale()) return { types: [], fallback: "", outcome: "stale" };
      const j = resp.data;
      if (j.error !== 0) {
        toast.warn(j.msg);
        return { types: [], fallback: "", outcome: "error" };
      }
      // Tender isn't an exception — LP filters it out of its own list too.
      const types = (j.sale_types as { sale_type: string }[])
        .map((t) => t.sale_type)
        .filter((t) => t !== "Tender");
      dispatch(setExplorerSaleTypes(types));
      return {
        types,
        fallback: pickDefaultSaleTypeName(types) ?? "",
        outcome: types.length ? "loaded" : "empty",
      };
    } catch (err) {
      if (isStale()) return { types: [], fallback: "", outcome: "stale" };
      toast.error("Error fetching exceptions: " + (err as JsonError).message);
      return { types: [], fallback: "", outcome: "error" };
    } finally {
      // Only the newest run owns the spinner. A superseded one clearing it
      // would drop the loading state while the run that replaced it is still
      // in flight.
      if (!isStale()) {
        dispatch(setExplorerLoading(false));
        dispatch(setExplorerMessage(""));
      }
    }
  };

  /**
   * Stage two. The cap count goes to the slice with the rows; the outcome tells
   * the caller whether there is anything to show.
   */
  const runExplore = async (exception: string): Promise<ExplorerOutcome> => {
    const { start, end, useGroups, searchValue, singleStore } = scopeArgs();
    const isStale = beginRequest();
    let truncated = 0;
    dispatch(setExplorerLoading(true));
    dispatch(setExplorerMessage("Loading transactions…"));

    // Every apply goes through here so a superseded run can't write anything.
    // selectedSaleType is set alongside the rows, not up front: the shared
    // Transaction receipt reads it to decide how it totals voids vs refunds,
    // and setting it at the start of a run that later loses would pair the
    // winning run's rows with the losing run's rules.
    const apply = (rows: TransactionListItem[]) => {
      if (rows.length) dispatch(setExplorerScopeLabel(scopeLabel()));
      dispatch(setSelectedSaleType(exception));
      dispatch(setExplorerRows({ rows, exception, truncated }));
    };

    try {
      const firstResp = await getCashierTable(
        url,
        token,
        start,
        end,
        useGroups,
        searchValue,
        singleStore,
        [exception],
        1,
      );
      if (isStale()) return "stale";
      const first = firstResp.data;
      if (first.error !== 0) {
        toast.warn(first.msg || "Could not load transactions");
        apply([]);
        return "error";
      }

      const transactions = await fetchAllPages(
        first,
        first.transactions as { sale_id: string }[],
        (page) =>
          getCashierTable(
            url,
            token,
            start,
            end,
            useGroups,
            searchValue,
            singleStore,
            [exception],
            page,
          ).then(
            (r: {
              data: { error: number; transactions: { sale_id: string }[] };
            }) => (r.data.error === 0 ? r.data.transactions : []),
          ),
      );

      if (isStale()) return "stale";

      let saleIds = Array.from(new Set(transactions.map((t) => t.sale_id)));
      if (saleIds.length > MAX_TRANSACTIONS) {
        truncated = saleIds.length - MAX_TRANSACTIONS;
        saleIds = saleIds.slice(0, MAX_TRANSACTIONS);
      }
      if (saleIds.length === 0) {
        apply([]);
        return "empty";
      }

      dispatch(setExplorerMessage("Loading receipts…"));
      const listResp = await getTransactionList(
        url,
        token,
        saleIds,
        1,
        exception,
      );
      if (isStale()) return "stale";
      const list = listResp.data;
      if (list.error !== 0) {
        toast.warn(list.msg || "Could not load transactions");
        apply([]);
        return "error";
      }

      const rows = await fetchAllPages(
        list,
        list.transactions as TransactionListItem[],
        (page) =>
          getTransactionList(url, token, saleIds, page, exception).then(
            (r: {
              data: { error: number; transactions: TransactionListItem[] };
            }) => (r.data.error === 0 ? r.data.transactions : []),
          ),
      );

      if (isStale()) return "stale";
      apply(rows);
      return rows.length ? "loaded" : "empty";
    } catch (err) {
      if (isStale()) return "stale";
      toast.error("Error loading transactions: " + (err as JsonError).message);
      apply([]);
      return "error";
    } finally {
      if (!isStale()) {
        dispatch(setExplorerLoading(false));
        dispatch(setExplorerMessage(""));
      }
    }
  };

  return { runPreflight, runExplore, scopeArgs };
};
