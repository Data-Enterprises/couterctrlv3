// Hooks
import { useRef } from "react";
import { useAppSelector } from "../../../../hooks";

// Redux
import { shallowEqual } from "react-redux";

/**
 * The dev tree's Sales state.
 *
 * Used to switch to `salesLegacy` whenever `devMode` was off, back when that
 * meant the legacy Sales page was on screen. Sales has no legacy page any more
 * — `SalesPage` always renders this tree — so the branch would hand the new
 * ledger an empty legacy slice to any programmer who flipped the legacy toggle.
 */
export const useSalesState = () =>
  useAppSelector((s) => s.dev.sales, shallowEqual);

/**
 * The Sales page's shared ledger state, read where it is used instead of
 * passed down. Picks only these fields, so other ledger changes do not
 * re-render its readers.
 *
 * The day is shared by the group view and the store popup on purpose: a day
 * picked in one is still the day you meant in the other.
 */
export const useSalesCtx = () =>
  useAppSelector(
    (s) => ({
      selectedDate: s.dev.salesLedger.selectedDate,
      gradingMetric: s.dev.salesLedger.gradingMetric,
      // The open store's rows: this week, last week, last year.
      rawSubs: s.dev.salesLedger.rawSubs,
      rawLWSubs: s.dev.salesLedger.rawLWSubs,
      rawLYSubs: s.dev.salesLedger.rawLYSubs,
      rawHourly: s.dev.salesLedger.rawHourly,
      rawLWHourly: s.dev.salesLedger.rawLWHourly,
      rawLYHourly: s.dev.salesLedger.rawLYHourly,
      exportSubDeptItems: s.dev.salesLedger.exportSubDeptItems,
      exportSubDeptName: s.dev.salesLedger.exportSubDeptName,
      // Fetched with the search; see SalesLedger's fetchLedger.
      financials: s.dev.salesLedger.financials,
      financialsWindow: s.dev.salesLedger.financialsWindow,
      financialsTruncated: s.dev.salesLedger.financialsTruncated,
      financialsLoading: s.dev.salesLedger.financialsLoading,
      // The Sub depts tab: its two thresholds, the open sub department and
      // its items (sold this week, and sold before but not this week).
      subDeptThreshold: s.dev.salesLedger.subDeptThreshold,
      itemThreshold: s.dev.salesLedger.itemThreshold,
      selectedSubDeptKey: s.dev.salesLedger.selectedSubDeptKey,
      selectedSubDeptItems: s.dev.salesLedger.selectedSubDeptItems,
      inactiveSubDeptItems: s.dev.salesLedger.inactiveSubDeptItems,
      lastFetchedItemsKey: s.dev.salesLedger.lastFetchedItemsKey,
      // The Hourly tab: its threshold and the open hour.
      hourlyThreshold: s.dev.salesLedger.hourlyThreshold,
      selectedHour: s.dev.salesLedger.selectedHour,
      // The store panel: its open tab, the counterpart store, and the cache
      // that saves refetching a store already opened.
      tab: s.dev.salesLedger.tab,
      counterpart: s.dev.salesLedger.counterpart,
      lastFetchedStoreKey: s.dev.salesLedger.lastFetchedStoreKey,
      storeCache: s.dev.salesLedger.storeCache,
      // The ledger: the search, the open store, the store-row threshold and
      // an open investigation.
      hasSearched: s.dev.salesLedger.hasSearched,
      selection: s.dev.salesLedger.selection,
      ledgerLoading: s.dev.salesLedger.ledgerLoading,
      threshold: s.dev.salesLedger.threshold,
      investigation: s.dev.salesLedger.investigation,
      investigationGrid: s.dev.salesLedger.investigationGrid,
      // Top 200: the open store's items and the caches behind them.
      topItems: s.dev.salesLedger.topItems,
      topItemPoints: s.dev.salesLedger.topItemPoints,
      topItemsLW: s.dev.salesLedger.topItemsLW,
      topItemsLY: s.dev.salesLedger.topItemsLY,
      topItemsKey: s.dev.salesLedger.topItemsKey,
      topItemsLoading: s.dev.salesLedger.topItemsLoading,
      topItemsCache: s.dev.salesLedger.topItemsCache,
      topItemsTyCache: s.dev.salesLedger.topItemsTyCache,
      top200View: s.dev.salesLedger.top200View,
      // The API connection, the search and the user's stores.
      url: s.app.url,
      token: s.app.token,
      apiEnv: s.app.apiEnv,
      userid: s.user.userid,
      assignedStores: s.user.assignedStores,
      selectedGroupStores: s.user.selectedGroupStores,
      search: s.search,
      searchedDate: s.dev.salesLedger.searchedDate,
      searchedGroup: s.dev.salesLedger.searchedGroup,
      groupName: s.dev.salesLedger.searchedGroup?.name,
    }),
    shallowEqual,
  );

/**
 * A grading threshold that holds its last real value.
 *
 * Grading should never move rows around on its own when the threshold input
 * is cleared: with no new number typed, keep grading against the last valid
 * amount so severity and sort order stay exactly where they were. Returned
 * as a plain value, since a ref's `.current` is not a sound memo dependency.
 */
export const useLastValidThreshold = (
  amount: number | null | undefined,
  fallback = 9,
) => {
  const last = useRef<number>(amount ?? fallback);
  if (amount != null) last.current = amount;
  return last.current;
};
