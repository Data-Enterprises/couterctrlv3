// Hooks
import { useState, useMemo, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { useTriStateSort } from "../../../utils/useTriStateSort";

// Redux
import { setStartDate, isGroupSearch } from "../../../features/searchSlice";
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
} from "../../../features/dev/devSalesTrackerSlice";

// Utils
import { formatGoliathDate, formatCurrency2, getStoreName } from "../../../utils";
import {
  fetchLySubSales,
  fetchSubSales,
  fetchTrackerWindow,
} from "./utils/trackerData";
import {
  basisWord,
  buildWindowPlan,
  isoToDisplay,
  shiftDays,
  shortLabel,
} from "./utils";
import { buildSubDeptTotals, allDeptsTotal } from "./utils/trackerTotals";
import { orDash } from "./utils/trackerTone";
import { SUB_GRID, NUM } from "./utils/trackerColumns";
import { PERF_SORT_HEADER } from "../../../components-dev/utils";

// Interfaces
import type { SortColumn, SubDeptTotal, TrackerBasis } from "./interfaces";

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
    basis,
    selectedSubDept,
    subFilter,
    loadedFrom,
    addingWeek,
  } = useAppSelector((s) => s.dev.salesTracker);

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);
  /** Weeks landed, while the pooled fetch runs. Local: it is loading copy, and
   *  nothing outside this page reads it. */
  const [progress, setProgress] = useState("");
  const { sort, handleSort, applySort } = useTriStateSort<SortColumn>();

  /** The search scope, shared by the full search and the add-a-week fetch so
   *  they agree on the store. */
  const isGroup = isGroupSearch(search.type);
  const useGroups = isGroup ? 1 : 0;
  const singleStore = isGroup ? 0 : 1;
  const searchValue = isGroup ? search.lastGroup : search.lastStore;

  /**
   * `subs/sales_tracker` instead of two paged `subs/sub_sales` reads, gated on
   * the selected backend (the endpoint is on dev only, and level 7 can switch
   * APIs), so a prod session takes `fetchSubSales` and never hits a 404. The two
   * paths return the same six fields this page reads; this one is ~7s against
   * ~52s for 5 stores over 12 weeks. Drop the flag once the endpoint is on prod.
   */
  const useTrackerEndpoint = context.apiEnv === "dev";
  const scope = {
    url: context.url,
    token: context.token,
    useGroups,
    searchValue,
    singleStore,
  };

  const plan = useMemo(
    () =>
      buildWindowPlan(
        formatGoliathDate(search.startDate),
        formatGoliathDate(search.endDate),
        basis,
      ),
    [search.startDate, search.endDate, basis],
  );

  /**
   * One more week, on the front of the window: the start date moves back seven
   * days and only the gap is fetched (`loadedFrom` says how far back rows
   * reach). The date moves only once the rows are in, so totals never read low
   * mid-fetch.
   */
  const addWeek = async () => {
    if (plan.weeks.length >= MAX_WEEKS || addingWeek) return;

    const newStart = shiftDays(plan.tyStart, -7);

    // Already in hand — dropped earlier and now coming back.
    if (loadedFrom && newStart >= loadedFrom) {
      dispatch(setStartDate(isoToDisplay(newStart)));
      return;
    }

    // The gap alone, with its own LY range from the plan (every day shifted,
    // extremes taken), so a holiday week asks for the days it pairs with.
    const gap = buildWindowPlan(
      newStart,
      shiftDays(loadedFrom ?? plan.tyStart, -1),
      basis,
    );

    dispatch(setAddingWeek(true));
    try {
      let tyRows;
      let lyRows;

      if (useTrackerEndpoint) {
        const res = await fetchTrackerWindow(scope, gap);
        if (!res) return;
        tyRows = res.ty;
        lyRows = res.ly;
      } else {
        [tyRows, lyRows] = await Promise.all([
          fetchSubSales(
            context.url,
            context.token,
            useGroups,
            searchValue,
            singleStore,
            gap.tyStart,
            gap.tyEnd,
          ),
          fetchLySubSales(
            context.url,
            context.token,
            useGroups,
            searchValue,
            singleStore,
            gap.lyStart,
            gap.lyEnd,
          ),
        ]);
      }
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

  // One roll-up, read by both panels: the right panel shows it until a
  // department is picked, and the header reports from it, so they agree.
  const groupTotal = useMemo(
    () => allDeptsTotal(rows, plan, scopeLabel || "All sub departments"),
    [rows, plan, scopeLabel],
  );

  const handleRowClick = useCallback(
    (id: number) => dispatch(setSelectedSubDept(id)),
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
      let tyRows;
      let lyRows;

      if (useTrackerEndpoint) {
        // One request per period per week, four at a time. A superseded search
        // resolves to null rather than to a partial window.
        const res = await fetchTrackerWindow(scope, plan, (done, total) =>
          setProgress(done < total ? `${done} of ${total} loaded` : ""),
        );
        setProgress("");
        if (!res) return;
        tyRows = res.ty;
        lyRows = res.ly;
      } else {
        // Two paged reads: the window, and the day-matched window last year.
        // The LY range comes from the plan (every day shifted, extremes taken),
        // so a holiday at either end doesn't break it.
        [tyRows, lyRows] = await Promise.all([
          fetchSubSales(
            context.url,
            context.token,
            useGroups,
            searchValue,
            singleStore,
            plan.tyStart,
            plan.tyEnd,
          ),
          fetchLySubSales(
            context.url,
            context.token,
            useGroups,
            searchValue,
            singleStore,
            plan.lyStart,
            plan.lyEnd,
          ),
        ]);
      }

      /*
       * No last year, so read the window against last week, asked for only
       * when the first answer is empty. One basis for the whole window, never a
       * mix. If last week is empty too, the basis stays LY.
       */
      let used: TrackerBasis = "LY";
      if (tyRows.length > 0 && lyRows.length === 0) {
        const lwPlan = buildWindowPlan(
          formatGoliathDate(search.startDate),
          formatGoliathDate(search.endDate),
          "LW",
        );
        const lwRows = await fetchLySubSales(
          context.url,
          context.token,
          useGroups,
          searchValue,
          singleStore,
          lwPlan.lyStart,
          lwPlan.lyEnd,
        );
        if (lwRows.length > 0) {
          lyRows = lwRows;
          used = "LW";
        }
      }

      if (tyRows.length === 0) setFetchFailed(true);
      dispatch(
        setRows({ ty: tyRows, ly: lyRows, from: plan.tyStart, basis: used }),
      );
    } catch (err) {
      setFetchFailed(true);
      setProgress("");
      toast.error(
        err instanceof Error ? err.message : "Could not load the tracker",
      );
      dispatch(
        setRows({ ty: [], ly: [], from: plan.tyStart, basis: "LY" }),
      );
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
                  key={row.id}
                  row={row}
                  isSelected={selectedSubDept === row.id}
                  onClick={handleRowClick}
                />
              ))}

              {/* Totals foot their columns, from the same roll-up as the
                  header and right panel. */}
              {groupTotal && (
                <div
                  className="grid items-center gap-3.5 px-4 py-2.5 border-t-2 border-gray-200 bg-gray-50 sticky bottom-0 z-10"
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
