// Hooks
import { useCallback, useRef, useState } from "react";
import { useAppDispatch } from "../../../../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import { useSalesCtx } from "../../hooks";

// Redux
import {
  setWeeklySales,
  setWeeklySalesLastWeek,
  setWeeklySalesLastYear,
  reQuery,
} from "../../../../../features/dev/devSalesSlice";
import {
  setHasSearched,
  setSearchedDate,
  setSearchedGroup,
  setLedgerLoading,
  setFinancials,
  setFinancialsLoading,
  setLedgerSelection,
  setLedgerTab,
  type LedgerTab,
  setLedgerSelectedDate,
  reQueryLedger,
} from "../../../../../features/dev/devSalesLedgerSlice";
import { isGroupSearch } from "../../../../../features/searchSlice";

// API
import { getDailySales } from "../../../../../api/sales";
import { FINANCIALS_READY, getFinancials } from "../../../../../api/financials";

// Utils
import { weekRanges } from "../utils";

/**
 * The ledger's search: the three weeks of daily sales for the picked store or
 * group, and the financials for the export. `onStart` runs once the search is
 * under way (the ledger closes its search pop-up there).
 */
export const useLedgerSearch = (onStart: () => void) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { url, token, search } = useSalesCtx();
  const [fetchFailed, setFetchFailed] = useState(false);

  const fetchLedger = async () => {
    const isGroup = isGroupSearch(search.type);
    const useGroups = isGroup ? 1 : 0;
    const searchValue = isGroup ? search.lastGroup : search.lastStore;
    if (!searchValue) return;

    const { twStart, twEnd, lwStart, lwEnd, lyStart, lyEnd } = weekRanges(
      search.singleDate,
    );

    dispatch(setLedgerLoading(true));
    dispatch(setHasSearched(true));
    dispatch(reQuery());
    dispatch(reQueryLedger());
    dispatch(setSearchedDate(search.singleDate));
    dispatch(
      setSearchedGroup(
        isGroup && search.selectedGroup?.id
          ? {
              id: search.selectedGroup.id,
              name: search.selectedGroup.group_name,
            }
          : null,
      ),
    );
    onStart();
    setFetchFailed(false);

    /**
     * Financials, for the export.
     *
     * Fired with the search, alongside everything else this page fetches, so
     * the export reads data already in hand like its four neighbours do.
     *
     * Deliberately not awaited. It is wanted by one optional export and the
     * ledger is what the searcher is waiting to see — a slow or missing
     * financials call must not hold up the page, and a failed one must not
     * fail the search. The export says so itself if the rows never arrived.
     */
    // Skipped while the router is undeployed — see FINANCIALS_READY. Without
    // this every search fires a request that 404s into the catch below.
    if (FINANCIALS_READY) {
      dispatch(setFinancialsLoading(true));
      getFinancials(url, token, twStart, twEnd, searchValue, useGroups as 0 | 1)
        .then((resp) => {
          const j = resp.data;
          if (j.error !== 0) return;
          dispatch(
            setFinancials({
              rows: j.data ?? [],
              window: { start: twStart, end: twEnd },
              truncated: !!j.truncated,
            }),
          );
        })
        .catch(() => {
          /* the export reports it; the ledger does not care */
        })
        .finally(() => dispatch(setFinancialsLoading(false)));
    }

    // One request per period, store or group: `sales/daily` takes a whole
    // group in one query.
    try {
      const [twResp, lwResp, lyResp] = await Promise.all([
        getDailySales(url, token, twStart, twEnd, useGroups, searchValue),
        getDailySales(url, token, lwStart, lwEnd, useGroups, searchValue),
        getDailySales(url, token, lyStart, lyEnd, useGroups, searchValue),
      ]);
      if (twResp.data.error === 0) dispatch(setWeeklySales(twResp.data.sales));
      if (lwResp.data.error === 0)
        dispatch(setWeeklySalesLastWeek(lwResp.data.sales));
      if (lyResp.data.error === 0)
        dispatch(setWeeklySalesLastYear(lyResp.data.sales));
    } catch (err: any) {
      toast.error(err.message);
      setFetchFailed(true);
    } finally {
      dispatch(setLedgerLoading(false));
    }
  };

  return { fetchLedger, fetchFailed };
};

/**
 * Opening and closing a store from the ledger.
 *
 * Stable identities — an inline arrow would be a new prop on every render and
 * would defeat the memo on LedgerRow entirely. Clicking the store that is
 * already open closes it, which is how you get back to the group view without
 * reaching for the X.
 */
export const useLedgerSelection = () => {
  const dispatch = useAppDispatch();
  const { selection } = useSalesCtx();

  // Read inside the stable handlers without making them depend on the
  // selection — a new identity every time the selection changed would defeat
  // the memo on every row.
  const selectionRef = useRef(selection);
  selectionRef.current = selection;

  // A store opens on the tab its caller asks for. Except on a single-store
  // search, where there are no siblings and the Stores tab is not offered at
  // all; carrying the LAST tab over instead would answer whichever question
  // the reader happened to ask previously.
  const openStore = useCallback(
    (
      s: Parameters<typeof setLedgerSelection>[0],
      tab: LedgerTab,
      // Back to All week: a day picked for the last store says nothing about
      // this one. The group comparison's way in keeps its day, because there
      // the day is part of the comparison being carried into the store.
      resetDay = false,
    ) => {
      const closing =
        s &&
        selectionRef.current?.storeId === s.storeId &&
        selectionRef.current?.storeNumber === s.storeNumber;
      if (!closing && s) {
        dispatch(setLedgerTab(tab));
        if (resetDay) dispatch(setLedgerSelectedDate(null));
      }
      dispatch(setLedgerSelection(closing ? null : s));
    },
    [dispatch],
  );

  const handleRowClick = useCallback(
    // Summary, the first tab, on All week: the store's week at a glance
    // before any drill-down. Sub depts and the rest are steps taken from there.
    (s: Parameters<typeof setLedgerSelection>[0]) =>
      openStore(s, "dailyrecap", true),
    [openStore],
  );

  const handlePopupClose = useCallback(
    () => dispatch(setLedgerSelection(null)),
    [dispatch],
  );

  return { openStore, handleRowClick, handlePopupClose };
};
