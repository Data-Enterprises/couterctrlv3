import { useState, useMemo, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { setStartDate } from "../../features/searchSlice";
import { formatGoliathDate, formatCurrency2, getStoreName } from "../../utils";
import { useToast } from "../../components/toasts/hooks/useToast";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import EmptyPrompt from "../../components/EmptyPrompt";
import TextFilter from "../../components/filters/TextFilter";
import SortHeader, { PERF_SORT_HEADER } from "../../components/SortHeader";
import { useTriStateSort } from "../../utils/useTriStateSort";
import {
  setHasSearched,
  setLoading,
  setScopeLabel,
  setRows,
  appendRows,
  setAddingWeek,
  MAX_WEEKS,
  MIN_WEEKS,
  setSelectedSubDept,
  setSubFilter,
  reQueryTracker,
} from "../../features/salesTrackerSlice";
import TrackerEntryCard from "./TrackerEntryCard";
import TrackerHeader from "./TrackerHeader";
import SubDeptRow from "./SubDeptRow";
import TrackerDetail from "./TrackerDetail";
import { fetchSubSales } from "./trackerData";
import { buildWindowPlan, isoToDisplay, shiftDays } from "./trackerWeeks";
import {
  buildSubDeptTotals,
  allDeptsTotal,
  type SubDeptTotal,
} from "./trackerTotals";
import { orDash } from "./trackerTone";
import VsLy from "./VsLy";
import { SUB_GRID, NUM } from "./trackerColumns";
import { isGroupSearch } from "../../features/searchSlice";

type SortColumn = "dept" | "ty" | "ly" | "ats" | "dollar";

const shortLabel = (d: string) => {
  const dt = new Date(d + "T12:00:00");
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
};

/**
 * Sales Tracker — sub-department sales against the same weeks last year.
 *
 * A tracker, not a Performance page: it reports movement and does not grade it.
 * There is no threshold, no severity and no ranking, which is why the list sits
 * in plain alphabetical order and the columns are sortable instead.
 */
const SalesTracker = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const context = useAppSelector((s) => s.app);
  const search = useAppSelector((s) => s.search);
  const assignedStores = useAppSelector((s) => s.user.assignedStores);
  const { groups } = useAppSelector((s) => s.group);
  const {
    hasSearched,
    loading,
    scopeLabel,
    ty,
    ly,
    selectedSubDept,
    subFilter,
    loadedFrom,
    addingWeek,
  } = useAppSelector((s) => s.salesTracker);

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);
  const { sort, handleSort, applySort } = useTriStateSort<SortColumn>();

  /** The search scope, read by both the full search and the add-a-week fetch.
   *  Derived here rather than inside the search so the two cannot disagree
   *  about which store the extra week belongs to. */
  const isGroup = isGroupSearch(search.type);
  const useGroups = isGroup ? 1 : 0;
  const singleStore = isGroup ? 0 : 1;
  const searchValue = isGroup ? search.lastGroup : search.lastStore;

  const plan = useMemo(
    () =>
      buildWindowPlan(
        formatGoliathDate(search.startDate),
        formatGoliathDate(search.endDate),
      ),
    [search.startDate, search.endDate],
  );

  /**
   * One more week, on the front of the window.
   *
   * The window is the search range, so this moves the start date back seven
   * days and lets the plan rebuild — the same path a preset takes. What is new
   * is that only the gap is fetched: `loadedFrom` says how far back the rows in
   * hand already reach, so re-adding a week that was dropped costs nothing and
   * a genuinely new one costs one week rather than the whole window.
   *
   * The date moves only once the rows are in. Moving it first would widen the
   * plan while the fetch was still running, and every total would read low for
   * the duration — a week of missing sales presented as a real figure.
   */
  const addWeek = async () => {
    if (plan.weeks.length >= MAX_WEEKS || addingWeek) return;

    const newStart = shiftDays(plan.tyStart, -7);

    // Already in hand — dropped earlier and now coming back.
    if (loadedFrom && newStart >= loadedFrom) {
      dispatch(setStartDate(isoToDisplay(newStart)));
      return;
    }

    // The gap alone, and its own LY range: the plan shifts every day and takes
    // the extremes, so a week containing a holiday still asks for the days its
    // pairing actually needs.
    const gap = buildWindowPlan(
      newStart,
      shiftDays(loadedFrom ?? plan.tyStart, -1),
    );

    dispatch(setAddingWeek(true));
    try {
      const [tyRows, lyRows] = await Promise.all([
        fetchSubSales(
          context.url,
          context.token,
          useGroups,
          searchValue,
          singleStore,
          gap.tyStart,
          gap.tyEnd,
        ),
        fetchSubSales(
          context.url,
          context.token,
          useGroups,
          searchValue,
          singleStore,
          gap.lyStart,
          gap.lyEnd,
        ),
      ]);
      dispatch(appendRows({ ty: tyRows, ly: lyRows, from: newStart }));
      dispatch(setStartDate(isoToDisplay(newStart)));
    } catch {
      toast.error("Could not load that week.");
    } finally {
      dispatch(setAddingWeek(false));
    }
  };

  /** One week off the front. No fetch, and the rows stay — narrowing the
   *  window is all that happened, so adding it back is instant. */
  const dropWeek = () => {
    if (plan.weeks.length <= MIN_WEEKS) return;
    dispatch(setStartDate(isoToDisplay(shiftDays(plan.tyStart, 7))));
  };

  const rows = useMemo(() => buildSubDeptTotals(ty, ly, plan), [ty, ly, plan]);

  // One roll-up, read by both panels. It fills the right panel until a
  // department is picked — which is where the live page's rail cards went —
  // and it is also what the header and the chip row report, so the two sides
  // of the page cannot disagree about the same store.
  const groupTotal = useMemo(
    () => allDeptsTotal(rows, plan, scopeLabel || "All sub departments"),
    [rows, plan, scopeLabel],
  );

  const handleRowClick = useCallback(
    (id: number) => dispatch(setSelectedSubDept(id)),
    [dispatch],
  );

  /**
   * Default order: furthest from last year in dollars, either direction.
   *
   * `buildSubDeptTotals` returns department-number order, which is how the back
   * office numbers them and how every other report prints them — but it does
   * not answer the question people open this page with. Ranking by impact puts
   * the answer in the first row; department order is one click away on the Sub
   * Dept column, and stays there once chosen.
   *
   * Ranked on money, never percentage: a small department posts a four-figure
   * percentage on pocket change and would otherwise lead the list.
   */
  const ranked = useMemo(
    () =>
      [...rows].sort(
        (a, b) => Math.abs(b.dollarChange ?? 0) - Math.abs(a.dollarChange ?? 0),
      ),
    [rows],
  );

  const fetchTracker = async () => {
    if (!searchValue) {
      toast.warn("Pick a store or group first");
      return;
    }

    dispatch(
      setScopeLabel(
        isGroup
          ? (groups.find((g) => g.id === search.lastGroup)?.group_name ??
              "Group")
          : getStoreName(
              assignedStores,
              search.lastStore,
              `Store ${search.lastStore}`,
            ),
      ),
    );
    dispatch(setLoading(true));
    dispatch(setHasSearched(true));
    dispatch(reQueryTracker());
    setSearchModalOpen(false);
    setFetchFailed(false);

    try {
      // Two reads, both paged: the window, and the day-matched window last
      // year. The LY range comes from the plan, which shifts every day and
      // takes the extremes — shifting only the endpoints breaks whenever one
      // of them lands on a holiday.
      const [tyRows, lyRows] = await Promise.all([
        fetchSubSales(
          context.url,
          context.token,
          useGroups,
          searchValue,
          singleStore,
          plan.tyStart,
          plan.tyEnd,
        ),
        fetchSubSales(
          context.url,
          context.token,
          useGroups,
          searchValue,
          singleStore,
          plan.lyStart,
          plan.lyEnd,
        ),
      ]);

      if (tyRows.length === 0) setFetchFailed(true);
      dispatch(setRows({ ty: tyRows, ly: lyRows, from: plan.tyStart }));
    } catch {
      setFetchFailed(true);
      dispatch(setRows({ ty: [], ly: [], from: plan.tyStart }));
    } finally {
      dispatch(setLoading(false));
    }
  };

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
    selectedSubDept === null
      ? null
      : (rows.find((r) => r.id === selectedSubDept) ?? null);

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
          <LoadingIndicator message="Building tracker" />
        </div>
      ) : (
        <div className="flex gap-4 h-[calc(100vh-5rem)]">
          <div
            className="flex flex-col min-w-0 shadow-lg"
            style={{ flexBasis: "52%", flexShrink: 0 }}
          >
            <TrackerHeader
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

            {/* The chips that used to sit here carried the same five figures as
                the totals row at the foot of this list and the KPI strip on the
                right — three copies of one answer. The totals row is the one
                that foots its own columns, so it is the one that survives. */}
            <div className="flex items-center justify-between gap-3 px-4 py-2 bg-custom-white border-x border-gray-100">
              <span className="text-[11px] font-medium text-content">
                {sort === null
                  ? "Ranked by size of change vs last year"
                  : "Sorted by column"}
              </span>
              <TextFilter
                value={subFilter}
                onChange={(v) => dispatch(setSubFilter(v))}
                placeholder="Filter sub depts…"
                className="max-w-[220px]"
              />
            </div>

            {/* Header, rows and totals all live inside the scroll container,
                pinned top and bottom. Outside it they span the full panel while
                the rows are narrower by the scrollbar, which pushes every
                right-aligned figure out of line with the header above it. */}
            <div className="flex-1 overflow-y-auto thin-scrollbar bg-custom-white rounded-b-xl shadow-sm border border-t-0 border-gray-100">
              <div
                className="grid items-center gap-3.5 px-4 py-2 border-b border-gray-100 sticky top-0 z-10 bg-custom-white"
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
                  label="LY Sales"
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
                {/* One column now, carrying dollars and percent together.
                    Sorting it sorts on dollars: a four-figure percentage on a
                    ten-dollar department is not the biggest mover. */}
                <SortHeader
                  col="dollar"
                  label="vs LY"
                  sort={sort}
                  onSort={handleSort}
                  className={`${PERF_SORT_HEADER} justify-end`}
                />
              </div>

              {visibleRows.map((row) => (
                <SubDeptRow
                  key={row.id}
                  row={row}
                  isSelected={selectedSubDept === row.id}
                  onClick={handleRowClick}
                />
              ))}

              {/* Totals foot the columns they sit under, the way a spreadsheet
                  does. Reads from the same roll-up as the header and the right
                  panel, so all three agree by construction. */}
              {groupTotal && (
                <div
                  className="grid items-center gap-3.5 px-4 py-2.5 border-t-2 border-gray-200 bg-gray-50 sticky bottom-0 z-10"
                  style={{ gridTemplateColumns: SUB_GRID }}
                >
                  {/* "All sub depts", matching the column header. It said "All
                      departments" while the header said "Sub Dept", which read
                      as two different things being totalled. */}
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
                    dollarChange={groupTotal.dollarChange}
                    pctChange={groupTotal.pctChange}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0 shadow-lg">
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSearchModalOpen(false)}
        >
          <div
            className="w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <TrackerEntryCard onSearch={fetchTracker} loading={loading} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesTracker;
