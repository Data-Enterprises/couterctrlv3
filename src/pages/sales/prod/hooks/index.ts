// Hooks
import { useRef } from "react";
import { useAppSelector } from "../../../../hooks";

// Redux
import { shallowEqual } from "react-redux";

/**
 * The prod tree's Sales state.
 *
 * Used to switch to `salesLegacy` whenever `devMode` was off, back when that
 * meant the legacy Sales page was on screen. Sales has no legacy page any more
 * — `SalesPage` always renders this tree — so the branch would hand the new
 * ledger an empty legacy slice to any programmer who flipped the legacy toggle.
 */
export const useSalesState = () =>
  useAppSelector((s) => s.prod.sales, shallowEqual);

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
      selectedDate: s.prod.salesLedger.selectedDate,
      gradingMetric: s.prod.salesLedger.gradingMetric,
      // The open store's rows: this week, last week, last year.
      rawSubs: s.prod.salesLedger.rawSubs,
      rawLWSubs: s.prod.salesLedger.rawLWSubs,
      rawLYSubs: s.prod.salesLedger.rawLYSubs,
      rawHourly: s.prod.salesLedger.rawHourly,
      rawLWHourly: s.prod.salesLedger.rawLWHourly,
      rawLYHourly: s.prod.salesLedger.rawLYHourly,
      exportSubDeptItems: s.prod.salesLedger.exportSubDeptItems,
      exportSubDeptName: s.prod.salesLedger.exportSubDeptName,
      // Fetched with the search; see SalesLedger's fetchLedger.
      financials: s.prod.salesLedger.financials,
      financialsWindow: s.prod.salesLedger.financialsWindow,
      financialsTruncated: s.prod.salesLedger.financialsTruncated,
      financialsLoading: s.prod.salesLedger.financialsLoading,
      // The Sub depts tab: its two thresholds, the open sub department and
      // its items (sold this week, and sold before but not this week).
      subDeptThreshold: s.prod.salesLedger.subDeptThreshold,
      itemThreshold: s.prod.salesLedger.itemThreshold,
      selectedSubDeptKey: s.prod.salesLedger.selectedSubDeptKey,
      selectedSubDeptItems: s.prod.salesLedger.selectedSubDeptItems,
      inactiveSubDeptItems: s.prod.salesLedger.inactiveSubDeptItems,
      lastFetchedItemsKey: s.prod.salesLedger.lastFetchedItemsKey,
      // The Hourly tab: its threshold and the open hour.
      hourlyThreshold: s.prod.salesLedger.hourlyThreshold,
      selectedHour: s.prod.salesLedger.selectedHour,
      // The store panel: its open tab, the counterpart store, and the cache
      // that saves refetching a store already opened.
      tab: s.prod.salesLedger.tab,
      counterpart: s.prod.salesLedger.counterpart,
      lastFetchedStoreKey: s.prod.salesLedger.lastFetchedStoreKey,
      storeCache: s.prod.salesLedger.storeCache,
      // The ledger: the search, the open store, the store-row threshold and
      // an open investigation.
      hasSearched: s.prod.salesLedger.hasSearched,
      selection: s.prod.salesLedger.selection,
      ledgerLoading: s.prod.salesLedger.ledgerLoading,
      threshold: s.prod.salesLedger.threshold,
      investigation: s.prod.salesLedger.investigation,
      investigationGrid: s.prod.salesLedger.investigationGrid,
      // Top 200: the open store's items and the caches behind them.
      topItems: s.prod.salesLedger.topItems,
      topItemPoints: s.prod.salesLedger.topItemPoints,
      topItemsLW: s.prod.salesLedger.topItemsLW,
      topItemsLY: s.prod.salesLedger.topItemsLY,
      topItemsKey: s.prod.salesLedger.topItemsKey,
      topItemsLoading: s.prod.salesLedger.topItemsLoading,
      topItemsCache: s.prod.salesLedger.topItemsCache,
      topItemsTyCache: s.prod.salesLedger.topItemsTyCache,
      top200View: s.prod.salesLedger.top200View,
      // The API connection, the search and the user's stores.
      url: s.app.url,
      token: s.app.token,
      apiEnv: s.app.apiEnv,
      userid: s.user.userid,
      assignedStores: s.user.assignedStores,
      selectedGroupStores: s.user.selectedGroupStores,
      search: s.search,
      searchedDate: s.prod.salesLedger.searchedDate,
      searchedGroup: s.prod.salesLedger.searchedGroup,
      groupName: s.prod.salesLedger.searchedGroup?.name,
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
