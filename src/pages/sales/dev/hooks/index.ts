// Hooks
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
      selectedSubDeptId: s.dev.salesLedger.selectedSubDeptId,
      selectedSubDeptItems: s.dev.salesLedger.selectedSubDeptItems,
      inactiveSubDeptItems: s.dev.salesLedger.inactiveSubDeptItems,
      lastFetchedItemsKey: s.dev.salesLedger.lastFetchedItemsKey,
    }),
    shallowEqual,
  );
