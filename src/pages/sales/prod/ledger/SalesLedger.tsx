// Hooks
import { useState, useMemo } from "react";
import { useAppDispatch } from "../../../../hooks";
import { useTriStateSort } from "../../../../utils/useTriStateSort";
import { useLastValidThreshold, useSalesCtx, useSalesState } from "../hooks";
import { useLedgerSearch, useLedgerSelection } from "./hooks";

// Redux
import { reQuery } from "../../../../features/salesSlice";
import {
  setHasSearched,
  setLedgerSelection,
} from "../../../../features/salesLedgerSlice";

// Utils
import { buildLedgerRows, regradeLedgerRows } from "../utils/ledgerUtils";
import { selectionFor } from "../utils/storeComparison";
import { PCT_COL_W, type SevFilter } from "../utils/index";
import { PERF_SORT_HEADER } from "../../../../components/utils";
import {
  filterLedgerRows,
  ledgerHeadline,
  severityBuckets,
  weekRangeLabel,
  weekRanges,
} from "./utils";

// Interfaces
import type { SortColumn } from "./interfaces";

// Components
import LoadingIndicator from "../../../../components/loading/LoadingIndicator";
import EmptyPrompt from "../../../../components/EmptyPrompt";
import SortHeader from "../../../../components/SortHeader";
import SearchPopup from "../../../../components/SearchPopup";
import DeptInvestigation from "../investigate/DeptInvestigation";
import GroupComparisonPanel from "../groupCompare/GroupComparisonPanel";
import StoreDetailPopup from "../storePanel/StoreDetailPopup";
import LedgerRow from "../components/LedgerRow";
import SeverityChips from "../components/SeverityChips";
import StoreColFilter from "../components/StoreColFilter";
import LedgerEntryCard from "./components/LedgerEntryCard";
import LedgerHeader from "./components/LedgerHeader";

/** The Sales page's weekly ledger: search for a store or group and week, then a graded store list
 *  (severity chips, sorting, filters) with the department investigation and store detail popups. */
const SalesLedger = () => {
  const dispatch = useAppDispatch();
  const {
    weeklySales = [],
    weeklySalesLastWeek = [],
    weeklySalesLastYear = [],
  } = useSalesState();
  const {
    hasSearched,
    selection,
    ledgerLoading: loading,
    threshold,
    gradingMetric,
    investigation,
    search,
    searchedDate,
    assignedStores,
  } = useSalesCtx();

  const activeThreshold = useLastValidThreshold(threshold?.amount);

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");
  const [storeFilter, setStoreFilter] = useState("");
  const { sort, handleSort, applySort } = useTriStateSort<SortColumn>();
  const { openStore, handleRowClick, handlePopupClose } = useLedgerSelection();
  const { fetchLedger, fetchFailed } = useLedgerSearch(() =>
    setSearchModalOpen(false),
  );

  const resetToEntry = () => {
    dispatch(reQuery());
    dispatch(setHasSearched(false));
    dispatch(setLedgerSelection(null));
  };

  // The searched week by default.
  const ranges = weekRanges(searchedDate ?? search.singleDate);

  // Regrouping every store across TW/LW/LY is the expensive half and doesn't
  // depend on the threshold, so it's memoized on the data alone. The threshold
  // then only drives the cheap re-grade below — which is what lets the
  // threshold move continuously without rebuilding all of this per frame.
  // (Mobile's LedgerStoreList already memoized this; desktop was rebuilding it
  // on every render.)
  const baseLedgerRows = useMemo(
    () =>
      buildLedgerRows(
        weeklySales,
        weeklySalesLastWeek,
        weeklySalesLastYear,
        assignedStores,
        activeThreshold,
        gradingMetric,
      ),
    [
      weeklySales,
      weeklySalesLastWeek,
      weeklySalesLastYear,
      assignedStores,
      gradingMetric,
    ],
  );

  const ledgerRows = useMemo(
    () => regradeLedgerRows(baseLedgerRows, activeThreshold),
    [baseLedgerRows, activeThreshold],
  );

  const buckets = severityBuckets(ledgerRows);
  const textFilteredRows = filterLedgerRows(
    ledgerRows,
    buckets,
    sevFilter,
    storeFilter,
  );

  const visibleRows = applySort(textFilteredRows, (row, col) =>
    col === "ty" ? row.twTotal : col === "vsLW" ? row.vsLWPct : row.vsLYPct,
  );

  const hero = ledgerHeadline(ledgerRows, gradingMetric);
  const weekLabel = weekRangeLabel(ranges.twStart, ranges.twEnd);

  if (!hasSearched || (!loading && ledgerRows.length === 0)) {
    return (
      <div className="w-full min-h-[calc(100vh-3rem)] overflow-hidden p-4">
        <LedgerEntryCard
          onSearch={fetchLedger}
          loading={loading}
          notice={
            hasSearched && !fetchFailed
              ? "No records found, try a different store, group, or week ending"
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="w-full p-4 select-none min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden">
      {loading ? (
        <div className="relative h-[calc(100vh-3rem)]">
          <LoadingIndicator message="Loading store ledger" />
        </div>
      ) : investigation ? (
        /* The page's full-width state. Four steps in, the question has
           outgrown a panel, so the ledger and the report both give way
           rather than the investigation opening inside one of them. The
           ledger selection survives underneath, which is what makes the
           back button able to put the reader where they were. */
        <div className="h-[calc(100vh-5rem)]">
          <DeptInvestigation {...ranges} />
        </div>
      ) : (
        <div className="flex gap-4 h-[calc(100vh-5rem)]">
          {/* Left: store list */}
          <div
            className="flex flex-col min-w-0 shadow-lg"
            style={{ flexBasis: "33%", flexShrink: 0 }}
          >
            <LedgerHeader
              weekLabel={weekLabel}
              twTotal={hero.twTotal}
              twQty={hero.twQty}
              vsLYPct={hero.vsLYPct}
              vsLWPct={hero.vsLWPct}
              hasLY={hero.hasLY}
              hasLW={hero.hasLW}
              dayCount={hero.dayCount}
              lyDayCount={hero.lyDayCount}
              lwDayCount={hero.lwDayCount}
              // Off the rows, not the search type: what matters is whether the
              // header sums more than one store, and a storeid carrying two
              // locations does that too.
              isGroup={ledgerRows.length > 1}
              onNewSearch={resetToEntry}
              onOpenSearch={() => setSearchModalOpen(true)}
            />

            {/* Tier summary pills — click to filter the list below */}
            <div className="flex items-center justify-between px-4 py-2 bg-custom-white border-x border-line_hair">
              <div
                data-help="severity-chips"
                className="flex items-center gap-1.5"
              >
                <SeverityChips
                  value={sevFilter}
                  onChange={setSevFilter}
                  counts={{
                    critical: buckets.critical.length,
                    watch: buckets.watch.length,
                    healthy: buckets.healthy.length,
                  }}
                  large
                />
              </div>
            </div>

            {/* Unified store list — sorted critical → watch → healthy */}
            <div className="flex-1 overflow-hidden bg-custom-white rounded-b-xl shadow-sm border border-t-0 border-line_hair flex flex-col">
              <div className="flex items-center gap-2.5 px-3 py-1.5 border-b border-line_hair flex-shrink-0">
                <span className="w-2 flex-shrink-0" />
                <span className="flex-1 min-w-0 flex items-center">
                  <StoreColFilter
                    value={storeFilter}
                    onApply={setStoreFilter}
                  />
                </span>
                <div className="flex items-center gap-[14px]">
                  <SortHeader
                    col="ty"
                    label="TY"
                    sort={sort}
                    onSort={handleSort}
                    width={64}
                    className={`${PERF_SORT_HEADER} justify-end pl-2.5`}
                  />
                  <SortHeader
                    col="vsLW"
                    label="vs LW"
                    sort={sort}
                    onSort={handleSort}
                    width={PCT_COL_W}
                    className={`${PERF_SORT_HEADER} justify-center`}
                  />
                  <SortHeader
                    col="vsLY"
                    label="vs LY"
                    sort={sort}
                    onSort={handleSort}
                    width={PCT_COL_W}
                    className={`${PERF_SORT_HEADER} justify-center`}
                  />
                </div>
              </div>
              <div
                data-help="list"
                className="flex-1 overflow-y-auto thin-scrollbar"
              >
                {visibleRows.map((row) => (
                  <LedgerRow
                    key={`${row.storeid}__${row.store_number}`}
                    row={row}
                    isSelected={
                      // storeNumber too — co-located stores share a storeid,
                      // and id alone would highlight both rows at once.
                      selection?.storeId === row.storeid &&
                      selection?.storeNumber === row.store_number
                    }
                    gradingMetric={gradingMetric}
                    threshold={activeThreshold}
                    onClick={handleRowClick}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right: report panel */}
          <div
            className="flex-1 min-w-0 shadow-lg"
            style={{ flexBasis: "52%" }}
          >
            {selection !== null ? (
              <StoreDetailPopup
                selection={selection}
                onClose={handlePopupClose}
                groupRows={ledgerRows}
              />
            ) : ledgerRows.length > 1 ? (
              /* The panel's resting state on a group search. The reference is
                 the group, which the search already chose, so standing inside
                 it is a fact about the search rather than a benchmark anyone
                 sets — and this half of the page was an empty prompt until
                 somebody clicked a store.

                 Rows, not the search type: a storeid carrying two locations is
                 a group too, the same test the header hero uses. */
              <GroupComparisonPanel
                rows={ledgerRows}
                threshold={activeThreshold}
                /* From the group comparison, so the store opens on the tab
                   that continues that question rather than on its own
                   departments. */
                onSelectStore={(row) =>
                  openStore(selectionFor(row), "comparison")
                }
              />
            ) : (
              <EmptyPrompt
                title="No store selected"
                description="Select a store from the list to view its weekly report"
              />
            )}
          </div>
        </div>
      )}

      {/* Search modal */}
      {searchModalOpen && (
        <SearchPopup onClose={() => setSearchModalOpen(false)}>
          <LedgerEntryCard onSearch={fetchLedger} loading={loading} />
        </SearchPopup>
      )}
    </div>
  );
};

export default SalesLedger;
