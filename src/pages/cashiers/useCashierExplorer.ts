import { useAppDispatch, useAppSelector } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getStoreName, formatGoliathDate } from "../../utils";
import {
  getSaleTypes,
  getCashierTable,
  getTransactionList,
} from "../../api/lossPrevention";
import {
  setExplorerLoading,
  setExplorerMessage,
  setExplorerSaleTypes,
  setExplorerException,
  setExplorerRows,
  setExplorerScopeLabel,
  setSelectedSaleType,
} from "../../features/cashiersSlice";
import type { JsonError, TransactionListItem } from "../../interfaces";
import { pickDefaultSaleTypeName } from "../../utils/saleTypes";

/**
 * The explorer's two-stage fetch, shared by the desktop container and the
 * mobile explorer.
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
      useGroups: type === "Group" ? 1 : 0,
      singleStore: type === "Store" ? 1 : 0,
      searchValue: type === "Group" ? lastGroup : lastStore,
    };
  };

  const scopeLabel = () =>
    type === "Group"
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
  }> => {
    const { start, end, useGroups, searchValue, singleStore } = scopeArgs();
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
      const j = resp.data;
      if (j.error !== 0) {
        toast.warn(j.msg);
        return { types: [], fallback: "" };
      }
      // Tender isn't an exception — LP filters it out of its own list too.
      const types = (j.sale_types as { sale_type: string }[])
        .map((t) => t.sale_type)
        .filter((t) => t !== "Tender");
      dispatch(setExplorerSaleTypes(types));
      return { types, fallback: pickDefaultSaleTypeName(types) ?? "" };
    } catch (err) {
      toast.error("Error fetching exceptions: " + (err as JsonError).message);
      return { types: [], fallback: "" };
    } finally {
      dispatch(setExplorerLoading(false));
      dispatch(setExplorerMessage(""));
    }
  };

  /** Stage two. Resolves to how many transactions were dropped by the cap. */
  const runExplore = async (exception: string): Promise<number> => {
    const { start, end, useGroups, searchValue, singleStore } = scopeArgs();
    let truncated = 0;
    dispatch(setExplorerLoading(true));
    dispatch(setExplorerMessage("Loading transactions…"));
    // The shared Transaction receipt reads selectedSaleType off the slice to
    // decide how it totals voids vs refunds, so it has to be set here for the
    // drill-down receipts to add up correctly.
    dispatch(setSelectedSaleType(exception));

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
      const first = firstResp.data;
      if (first.error !== 0) {
        toast.warn(first.msg || "Could not load transactions");
        dispatch(setExplorerRows({ rows: [], exception }));
        return 0;
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

      let saleIds = Array.from(new Set(transactions.map((t) => t.sale_id)));
      if (saleIds.length > MAX_TRANSACTIONS) {
        truncated = saleIds.length - MAX_TRANSACTIONS;
        saleIds = saleIds.slice(0, MAX_TRANSACTIONS);
      }
      if (saleIds.length === 0) {
        dispatch(setExplorerRows({ rows: [], exception }));
        return 0;
      }

      dispatch(setExplorerMessage("Loading receipts…"));
      const listResp = await getTransactionList(
        url,
        token,
        saleIds,
        1,
        exception,
      );
      const list = listResp.data;
      if (list.error !== 0) {
        toast.warn(list.msg || "Could not load transactions");
        dispatch(setExplorerRows({ rows: [], exception }));
        return 0;
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

      dispatch(setExplorerScopeLabel(scopeLabel()));
      dispatch(setExplorerRows({ rows, exception }));
      return truncated;
    } catch (err) {
      toast.error("Error loading transactions: " + (err as JsonError).message);
      dispatch(setExplorerRows({ rows: [], exception }));
      return 0;
    } finally {
      dispatch(setExplorerLoading(false));
      dispatch(setExplorerMessage(""));
    }
  };

  return { runPreflight, runExplore, scopeArgs };
};
