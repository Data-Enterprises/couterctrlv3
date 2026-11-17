// Hooks
import { useMemo, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";

// Redux
import {
  setExplorerSaleTypes,
  setExplorerException,
  setExplorerLoading,
  setExplorerMessage,
  setExplorerScopeLabel,
  setExplorerRows,
  setSelectedSaleType,
} from "../../../../features/dev/devCashiersSlice";
import { isGroupSearch } from "../../../../features/searchSlice";

// API
import {
  getSaleTypes,
  getCashierTable,
  getTransactionList,
} from "../../../../api/lossPrevention";

// Utils
import { formatGoliathDate, getStoreName } from "../../../../utils";
import {
  buildTransactionLengths,
  buildSignals,
  buildTotals,
  fetchAllPages,
  MAX_TRANSACTIONS,
} from "../utils";
import { reasonOf } from "../../../../utils/serverError";

// Interfaces
import type { JsonError, TransactionListItem } from "../../../../interfaces";

/** Cashiers' context: the app's connection, the search, the user's stores
 *  and the slice, whose selected sale type the receipt totals by. */
export const useCashierCtx = () => {
  const dispatch = useAppDispatch();
  const { url, token, isMobile } = useAppSelector((state) => state.app);
  const cashier = useCashiersState();
  const { startDate, endDate, type, lastStore, lastGroup, selectedGroup } =
    useAppSelector((state) => state.search);
  const assignedStores = useAppSelector((state) => state.user.assignedStores);

  return {
    ...cashier,
    dispatch,
    endDate,
    lastGroup,
    lastStore,
    selectedGroup,
    startDate,
    token,
    type,
    url,
    assignedStores,
    isMobile,
  };
};

export const useCashiersState = () =>
  useAppSelector((state) => state.dev.cashier);

/**
 * The explorer's derived state (exception rows, transaction lengths, totals,
 * signals) from the slice, shared by desktop and mobile so they agree.
 */
export const useCashierSignals = () => {
  const { explorerAllRows, explorerFetchedException, explorerLens } =
    useAppSelector((s) => s.dev.cashier);
  const assignedStores = useAppSelector((s) => s.user.assignedStores);

  const transactionLengths = useMemo(
    () => buildTransactionLengths(explorerAllRows),
    [explorerAllRows],
  );

  // transaction_list hands back whole receipts, so the signal maths has to run
  // on just the lines matching the exception the user picked.
  const exceptionRows = useMemo(
    () =>
      explorerAllRows.filter((r) => r.sale_type === explorerFetchedException),
    [explorerAllRows, explorerFetchedException],
  );

  const totals = useMemo(() => buildTotals(exceptionRows), [exceptionRows]);

  const signals = useMemo(
    () =>
      buildSignals(exceptionRows, transactionLengths, explorerLens, (id, fb) =>
        getStoreName(assignedStores, id, fb),
      ),
    [exceptionRows, transactionLengths, explorerLens, assignedStores],
  );

  return { exceptionRows, transactionLengths, totals, signals };
};

/**
 * The desktop explorer's two-stage fetch. Stage one preflights which
 * exceptions occurred in the scope and dates; stage two walks every page of
 * `cashier_table` for the chosen one, then pulls those receipts in full.
 */
export const useDesktopExplorer = (ctx: ReturnType<typeof useCashierCtx>) => {
  const toast = useToast();
  // Distinguishes "preflight ran and found nothing" from "preflight hasn't run
  // yet" — both leave explorerSaleTypes empty.
  const [preflightRan, setPreflightRan] = useState<boolean>(false);

  const scopeArgs = () => ({
    start: formatGoliathDate(ctx.startDate),
    end: formatGoliathDate(ctx.endDate),
    useGroups: isGroupSearch(ctx.type) ? 1 : 0,
    singleStore: ctx.type === "Store" ? 1 : 0,
    searchValue: isGroupSearch(ctx.type) ? ctx.lastGroup : ctx.lastStore,
  });

  const scopeLabel = () =>
    isGroupSearch(ctx.type)
      ? ctx.selectedGroup?.group_name || "Group"
      : getStoreName(
          ctx.assignedStores,
          ctx.lastStore,
          `Store ${ctx.lastStore}`,
        );

  // Stage one — the exception list has to come from preflight because which
  // exceptions even occurred depends on the scope and dates just chosen.
  const runPreflight = () => {
    const { start, end, useGroups, searchValue, singleStore } = scopeArgs();
    ctx.dispatch(setExplorerLoading(true));
    ctx.dispatch(setExplorerMessage("Finding exceptions…"));
    ctx.dispatch(setExplorerSaleTypes([]));
    ctx.dispatch(setExplorerException(""));

    getSaleTypes(
      ctx.url,
      ctx.token,
      start,
      end,
      useGroups,
      searchValue,
      singleStore,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          // Tender isn't an exception — LP filters it out of its own list too.
          const types = (j.sale_types as { sale_type: string }[])
            .map((t) => t.sale_type)
            .filter((t) => t !== "Tender");
          ctx.dispatch(setExplorerSaleTypes(types));
          setPreflightRan(true);
        } else {
          toast.warn(j.msg);
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching exceptions: " + reasonOf(err)),
      )
      .finally(() => {
        ctx.dispatch(setExplorerLoading(false));
        ctx.dispatch(setExplorerMessage(""));
      });
  };

  // Stage two: walk every page of cashier_table for the chosen exception, then
  // pull those transactions' full receipts (transaction_list returns every
  // line, which gives "line 12 of 12" and the inline receipt). The cap count
  // goes to the slice with the rows.
  const runExplore = async () => {
    const { start, end, useGroups, searchValue, singleStore } = scopeArgs();
    const exception = ctx.explorerException;
    let truncated = 0;
    ctx.dispatch(setExplorerLoading(true));
    ctx.dispatch(setExplorerMessage("Loading transactions…"));
    // The shared Transaction receipt reads selectedSaleType to total voids vs
    // refunds, so it is set here for the drill-down receipts.
    ctx.dispatch(setSelectedSaleType(exception));

    try {
      const firstResp = await getCashierTable(
        ctx.url,
        ctx.token,
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
        ctx.dispatch(setExplorerRows({ rows: [], exception, truncated }));
        return;
      }

      const transactions = await fetchAllPages(
        first,
        first.transactions as { sale_id: string }[],
        (page) =>
          getCashierTable(
            ctx.url,
            ctx.token,
            start,
            end,
            useGroups,
            searchValue,
            singleStore,
            [exception],
            page,
          ).then((r) => (r.data.error === 0 ? r.data.transactions : [])),
      );

      let saleIds = Array.from(new Set(transactions.map((t) => t.sale_id)));
      if (saleIds.length > MAX_TRANSACTIONS) {
        truncated = saleIds.length - MAX_TRANSACTIONS;
        saleIds = saleIds.slice(0, MAX_TRANSACTIONS);
      }
      if (saleIds.length === 0) {
        ctx.dispatch(setExplorerRows({ rows: [], exception, truncated }));
        return;
      }

      ctx.dispatch(setExplorerMessage("Loading receipts…"));
      const listResp = await getTransactionList(
        ctx.url,
        ctx.token,
        saleIds,
        1,
        exception,
      );
      const list = listResp.data;
      if (list.error !== 0) {
        toast.warn(list.msg || "Could not load transactions");
        ctx.dispatch(setExplorerRows({ rows: [], exception, truncated }));
        return;
      }

      const rows = await fetchAllPages(
        list,
        list.transactions as TransactionListItem[],
        (page) =>
          getTransactionList(ctx.url, ctx.token, saleIds, page, exception).then(
            (r) => (r.data.error === 0 ? r.data.transactions : []),
          ),
      );

      ctx.dispatch(setExplorerScopeLabel(scopeLabel()));
      ctx.dispatch(setExplorerRows({ rows, exception, truncated }));
    } catch (err) {
      toast.error("Error loading transactions: " + reasonOf(err));
      ctx.dispatch(setExplorerRows({ rows: [], exception, truncated }));
    } finally {
      ctx.dispatch(setExplorerLoading(false));
      ctx.dispatch(setExplorerMessage(""));
    }
  };

  return { runPreflight, runExplore, preflightRan };
};
