// Hooks
import { useState, useMemo, useCallback } from "react";
import { useAppDispatch } from "../../../hooks";
import { useTriStateSort } from "../../../utils/useTriStateSort";
import { useSalesTrackerCtx, useTrackerFetch } from "./hooks";

// Redux
import {
  MAX_WEEKS,
  MIN_WEEKS,
  setSelectedSubDeptKey,
  setSubFilter,
} from "../../../features/dev/devSalesTrackerSlice";

// Utils
import { formatGoliathDate, formatCurrency2 } from "../../../utils";
import { basisWord, buildWindowPlan, shortLabel } from "./utils";
import { buildSubDeptTotals, allDeptsTotal } from "./utils/trackerTotals";
import { orDash } from "./utils/trackerTone";
import { SUB_GRID, NUM } from "./utils/trackerColumns";
import { PERF_SORT_HEADER } from "../../../components-dev/utils";

// Interfaces
import type { SortColumn, SubDeptTotal } from "./interfaces";

// Components
import LoadingIndicator from "../../../components-dev/loading/LoadingIndicator";
import EmptyPrompt from "../../../components-dev/EmptyPrompt";
import TextFilter from "../../../components-dev/filters/TextFilter";
import SortHeader from "../../../components-dev/SortHeader";
import SearchPopup from "../../../components-dev/SearchPopup";
import TrackerEntryCard from "./components/TrackerEntryCard";
import TrackerHeader from "./components/TrackerHeader";
import SubDeptRow from "./components/SubDeptRow";
import TrackerDetail from "./detail/TrackerDetail";
import VsLy from "./components/VsLy";

/**
 * Sales Tracker: sub-department sales against the same weeks last year. A
 * tracker, not a Performance page: it reports movement and grades nothing (no
 * threshold, severity or ranking).
 */
const SalesTracker = () => {
  const dispatch = useAppDispatch();
  const {
    hasSearched,
    loading,
    scopeLabel,
    ty,
    ly,
    basis,
    selectedSubDeptKey,
    subFilter,
    addingWeek,
    search,
  } = useSalesTrackerCtx();

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);
  /** Weeks landed, while the pooled fetch runs. Local: it is loading copy, and
   *  nothing outside this page reads it. */
  const [progress, setProgress] = useState("");
  const { sort, handleSort, applySort } = useTriStateSort<SortColumn>();

  const plan = useMemo(
    () =>
      buildWindowPlan(
        formatGoliathDate(search.startDate),
        formatGoliathDate(search.endDate),
        basis,
      ),
    [search.startDate, search.endDate, basis],
  );
  const { addWeek, dropWeek, fetchTracker } = useTrackerFetch(
    plan,
    setSearchModalOpen,
    setFetchFailed,
    setProgress,
  );

  const rows = useMemo(() => buildSubDeptTotals(ty, ly, plan), [ty, ly, plan]);

  // One roll-up, read by both panels: the right panel shows it until a
  // department is picked, and the header reports from it, so they agree.
  const groupTotal = useMemo(
    () => allDeptsTotal(rows, plan, scopeLabel || "All sub departments"),
    [rows, plan, scopeLabel],
  );

  const handleRowClick = useCallback(
    (key: string) => dispatch(setSelectedSubDeptKey(key)),
    [dispatch],
  );

  /**
   * Default order: furthest from last year in dollars, either direction (never
   * percent: small departments post huge percents on pocket change).
   * Department order is one click away on the Sub Dept column.
   */
  const ranked = useMemo(
    () =>
      [...rows].sort(
        (a, b) => Math.abs(b.dollarChange ?? 0) - Math.abs(a.dollarChange ?? 0),
      ),
    [rows],
  );

  const filtered = subFilter.trim()
    ? ranked.filter((r) =>
        r.desc.toLowerCase().includes(subFilter.trim().toLowerCase()),
      )
    : ranked;

  const visibleRows = applySort(filtered, (row, col) =>
    col === "dept"
      ? row.id
      : col === "ty"
        ? row.salesTy
        : col === "ly"
          ? row.salesLy
          : col === "ats"
            ? row.ats
            : row.dollarChange,
  );

  const windowLabel = `${shortLabel(plan.tyStart)} – ${shortLabel(plan.tyEnd)}/${new Date(
    plan.tyEnd + "T12:00:00",
  ).getFullYear()}`;

  const selectedRow =
    selectedSubDeptKey === null
      ? null
      : (rows.find((r) => r.key === selectedSubDeptKey) ?? null);

  if (!hasSearched || (!loading && rows.length === 0)) {
    return (
      <div className="w-full min-h-[calc(100vh-3rem)] overflow-hidden p-4">
        <TrackerEntryCard
          onSearch={fetchTracker}
          loading={loading}
          notice={
            hasSearched && !fetchFailed
              ? "No sub-department sales found for that store, group, or period"
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
          {/* The pooled fetch reports weeks as they land; empty on the prod
              path (two requests). */}
          <LoadingIndicator
            message={
              progress ? `Building tracker · ${progress}` : "Building tracker"
            }
          />
        </div>
      ) : (
        <div className="flex gap-4 h-[calc(100vh-5rem)]">
          <div
            className="flex flex-col min-w-0 shadow-lg"
            style={{ flexBasis: "52%", flexShrink: 0 }}
          >
            <TrackerHeader
              basis={basis}
              windowLabel={windowLabel}
              scopeLabel={scopeLabel}
              weeks={plan.weeks.length}
              addingWeek={addingWeek}
              canAddWeek={plan.weeks.length < MAX_WEEKS}
              canDropWeek={plan.weeks.length > MIN_WEEKS}
              onAddWeek={addWeek}
              onDropWeek={dropWeek}
              salesTy={groupTotal?.salesTy ?? 0}
              pctChange={groupTotal?.pctChange ?? null}
              onOpenSearch={() => setSearchModalOpen(true)}
            />

            {/* The totals row at the foot of the list carries these figures. */}
            <div
              data-help="sub-filter"
              className="flex items-center justify-between gap-3 px-4 py-2 bg-custom-white border-x border-line_hair"
            >
              <span className="text-[11px] font-medium text-content">
                {sort === null
                  ? `Ranked by size of change vs ${basisWord(basis)}`
                  : "Sorted by column"}
              </span>
              <TextFilter
                value={subFilter}
                onChange={(v) => dispatch(setSubFilter(v))}
                placeholder="Filter sub depts…"
                className="max-w-[220px]"
              />
            </div>

            {/* Header, rows and totals live inside the scroll container,
                pinned top and bottom, so the figures line up with the header
                despite the scrollbar. */}
            <div className="flex-1 overflow-y-auto thin-scrollbar bg-custom-white rounded-b-xl shadow-sm border border-t-0 border-line_hair">
              <div
                data-help="columns"
                className="grid items-center gap-3.5 px-4 py-2 border-b border-line_hair sticky top-0 z-10 bg-custom-white"
                style={{ gridTemplateColumns: SUB_GRID }}
              >
                {/* Sortable so department-number order stays reachable, since
                    the list now opens ranked by impact instead. */}
                <SortHeader
                  col="dept"
                  label="Sub Dept"
                  sort={sort}
                  onSort={handleSort}
                  className={PERF_SORT_HEADER}
                />
                <SortHeader
                  col="ty"
                  label="TY Sales"
                  sort={sort}
                  onSort={handleSort}
                  className={`${PERF_SORT_HEADER} justify-end`}
                />
                <SortHeader
                  col="ly"
                  label={`${basis} Sales`}
                  sort={sort}
                  onSort={handleSort}
                  className={`${PERF_SORT_HEADER} justify-end`}
                />
                <SortHeader
                  col="ats"
                  label="ATS"
                  sort={sort}
                  onSort={handleSort}
                  className={`${PERF_SORT_HEADER} justify-end`}
                />
                {/* One column with dollars and percent; it sorts on dollars. */}
                <SortHeader
                  col="dollar"
                  label={`vs ${basis}`}
                  sort={sort}
                  onSort={handleSort}
                  className={`${PERF_SORT_HEADER} justify-end`}
                />
              </div>

              {visibleRows.map((row) => (
                <SubDeptRow
                  key={row.key}
                  row={row}
                  isSelected={selectedSubDeptKey === row.key}
                  onClick={handleRowClick}
                />
              ))}

              {/* Totals foot their columns, from the same roll-up as the
                  header and right panel. */}
              {groupTotal && (
                <div
                  className="grid items-center gap-3.5 px-4 py-2.5 border-t-2 border-line_field bg-fill_soft sticky bottom-0 z-10"
                  style={{ gridTemplateColumns: SUB_GRID }}
                >
                  {/* "All sub depts", matching the column header. */}
                  <span className="text-[12px] font-semibold uppercase tracking-wide text-content">
                    {visibleRows.length === rows.length
                      ? "All sub depts"
                      : `All sub depts · ${visibleRows.length} of ${rows.length} shown`}
                  </span>
                  <span
                    className={`text-[13.5px] font-semibold text-content text-right ${NUM}`}
                  >
                    {formatCurrency2(groupTotal.salesTy)}
                  </span>
                  <span
                    className={`text-[13.5px] font-semibold text-content text-right ${NUM}`}
                  >
                    {orDash(groupTotal.salesLy, formatCurrency2)}
                  </span>
                  <span
                    className={`text-[13.5px] font-semibold text-content text-right ${NUM}`}
                  >
                    {orDash(groupTotal.ats, formatCurrency2)}
                  </span>
                  <VsLy
                    basis={basis}
                    dollarChange={groupTotal.dollarChange}
                    pctChange={groupTotal.pctChange}
                  />
                </div>
              )}
            </div>
          </div>

          <div data-help="weeks" className="flex-1 min-w-0 shadow-lg">
            {(selectedRow ?? groupTotal) !== null ? (
              <TrackerDetail
                row={(selectedRow ?? groupTotal) as SubDeptTotal}
                plan={plan}
                scopeLabel={scopeLabel}
              />
            ) : (
              <EmptyPrompt
                title="Nothing to show"
                description="No sub-department sales came back for this period"
              />
            )}
          </div>
        </div>
      )}

      {searchModalOpen && (
        <SearchPopup onClose={() => setSearchModalOpen(false)}>
          <TrackerEntryCard onSearch={fetchTracker} loading={loading} />
        </SearchPopup>
      )}
    </div>
  );
};

export default SalesTracker;
