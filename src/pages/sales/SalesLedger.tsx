import { useSalesState } from "./hooks/useSalesState";
import { useState, useRef } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { getWeekly, getHourly } from "../../api/sales";
import { getStoresAssignedToUserGroup } from "../../api/groups";
import { addDays, formatGoliathDate, sameWeekDayLastYear } from "../../utils";
import { buildLedgerRows } from "./shared/ledgerUtils";
import type { Store } from "../../interfaces";
import {
  setWeeklySales,
  setWeeklySalesLastWeek,
  setWeeklySalesLastYear,
  setHourlySales,
  setHourlySalesLastWeek,
  setHourlySalesLastYear,
  concatWeeklySales,
  concatWeeklySalesLastWeek,
  concatWeeklySalesLastYear,
  concatHourlySales,
  concatHourlySalesLastWeek,
  concatHourlySalesLastYear,
  reQuery,
} from "../../features/salesSlice";
import {
  setHasSearched,
  setLedgerLoading,
  setLedgerSelection,
  reQueryLedger,
} from "../../features/salesLedgerSlice";
import { useToast } from "../../components/toasts/hooks/useToast";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import EmptyPrompt from "../../components/EmptyPrompt";
import LedgerEntryCard from "./components/LedgerEntryCard";
import StoreDetailPopup from "./components/StoreDetailPopup";
import LedgerHeader from "./components/LedgerHeader";
import LedgerRow, { type LedgerRowData } from "./components/LedgerRow";
import type { SevFilter } from "./components/utils";
import TextFilter from "../../components/filters/TextFilter";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/20/solid";

type SortColumn = "ty" | "vsLW" | "vsLY";
type SortState = { column: SortColumn; direction: "desc" | "asc" } | null;

const SalesLedger = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const context = useAppSelector((state) => state.app);
  const { userid } = useAppSelector((state) => state.user);
  const search = useAppSelector((state) => state.search);
  const {
    weeklySales = [],
    weeklySalesLastWeek = [],
    weeklySalesLastYear = [],
    // hourlySales = [],
    // hourlySalesLastWeek = [],
    // hourlySalesLastYear = [],
  } = useSalesState();
  const {
    hasSearched,
    selection,
    ledgerLoading: loading,
    threshold,
    gradingMetric,
  } = useAppSelector((state) => state.salesLedger);
  const { assignedStores } = useAppSelector((state) => state.user);

  // Grading should never move stores around on its own when the threshold
  // input is cleared — with no new number typed, keep grading against the
  // last valid amount so severity/sort order stays exactly where it was.
  const lastValidThresholdRef = useRef<number>(threshold?.amount ?? 9);
  if (threshold?.amount != null) {
    lastValidThresholdRef.current = threshold.amount;
  }

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");
  const [storeFilter, setStoreFilter] = useState("");
  const [sort, setSort] = useState<SortState>(null);

  const handleSortClick = (column: SortColumn) => {
    setSort((prev) => {
      if (prev?.column !== column) return { column, direction: "desc" };
      if (prev.direction === "desc") return { column, direction: "asc" };
      return null;
    });
  };

  const resetToEntry = () => {
    dispatch(reQuery());
    dispatch(setHasSearched(false));
    dispatch(setLedgerSelection(null));
  };

  const getDateRanges = () => {
    const twEnd = formatGoliathDate(search.singleDate);
    const twStart = addDays(search.singleDate, -6).toISOString().split("T")[0];
    const lwEnd = addDays(search.singleDate, -7).toISOString().split("T")[0];
    const lwStart = addDays(search.singleDate, -13).toISOString().split("T")[0];
    // Shifting just the two week endpoints breaks when one of them lands on a
    // fixed-date holiday (e.g. July 4th) — that endpoint gets snapped to the
    // exact holiday date last year while the other gets a plain weekday-preserving
    // shift, desyncing the range from the per-day lookups in buildLedgerRows.
    // Shifting every day in the week and taking the min/max keeps it correct.
    const twWeekDates = Array.from({ length: 7 }, (_, i) => addDays(twStart, i).toISOString().split("T")[0]);
    const lyWeekDates = twWeekDates.map((d) => sameWeekDayLastYear(d).date).sort();
    const lyStart = lyWeekDates[0];
    const lyEnd = lyWeekDates[lyWeekDates.length - 1];
    return { twStart, twEnd, lwStart, lwEnd, lyStart, lyEnd };
  };

  const fetchLedger = async () => {
    const isGroup = search.type === "Group";
    const useGroups = isGroup ? 1 : 0;
    const singleStore = isGroup ? 0 : 1;
    const searchValue = isGroup ? search.lastGroup : search.lastStore;
    if (!searchValue) return;

    const { twStart, twEnd, lwStart, lwEnd, lyStart, lyEnd } = getDateRanges();

    dispatch(setLedgerLoading(true));
    dispatch(setHasSearched(true));
    dispatch(reQuery());
    dispatch(reQueryLedger());
    setSearchModalOpen(false);
    setFetchFailed(false);

    // Large group path: >30 stores → per-store calls, collect progressively
    if (isGroup) {
      try {
        const groupResp = await getStoresAssignedToUserGroup(
          context.url,
          context.token,
          userid,
          search.lastGroup,
        );
        if (groupResp.data.error !== 0) toast.warn(groupResp.data.msg);
        const stores: Store[] =
          groupResp.data.error === 0
            ? groupResp.data.stores.filter((s: any) => s.active)
            : [];

        if (stores.length > 30) {
          await Promise.allSettled(
            stores.map((store) =>
              Promise.all([
                getWeekly(
                  context.url,
                  context.token,
                  twStart,
                  twEnd,
                  0,
                  store.storeid,
                  1,
                ),
                getWeekly(
                  context.url,
                  context.token,
                  lwStart,
                  lwEnd,
                  0,
                  store.storeid,
                  1,
                ),
                getWeekly(
                  context.url,
                  context.token,
                  lyStart,
                  lyEnd,
                  0,
                  store.storeid,
                  1,
                ),
                getHourly(
                  context.url,
                  context.token,
                  twStart,
                  twEnd,
                  0,
                  store.storeid,
                  1,
                ),
                getHourly(
                  context.url,
                  context.token,
                  lwStart,
                  lwEnd,
                  0,
                  store.storeid,
                  1,
                ),
                getHourly(
                  context.url,
                  context.token,
                  lyStart,
                  lyEnd,
                  0,
                  store.storeid,
                  1,
                ),
              ])
                .then(([tw, lw, ly, h, lh, lhy]) => {
                  if (tw.data.error === 0)
                    dispatch(concatWeeklySales(tw.data.sales));
                  if (lw.data.error === 0)
                    dispatch(concatWeeklySalesLastWeek(lw.data.sales));
                  if (ly.data.error === 0)
                    dispatch(concatWeeklySalesLastYear(ly.data.sales));
                  if (h.data.error === 0)
                    dispatch(concatHourlySales(h.data.subs));
                  if (lh.data.error === 0)
                    dispatch(concatHourlySalesLastWeek(lh.data.subs));
                  if (lhy.data.error === 0)
                    dispatch(concatHourlySalesLastYear(lhy.data.subs));
                })
                .catch(() => {}),
            ),
          );
          dispatch(setLedgerLoading(false));
          return;
        }
      } catch {
        // fall through to standard call
      }
    }

    // Standard path: single store or small group
    try {
      const [twResp, lwResp, lyResp, hourlyResp, lwHourlyResp, lyHourlyResp] =
        await Promise.all([
          getWeekly(
            context.url,
            context.token,
            twStart,
            twEnd,
            useGroups,
            searchValue,
            singleStore,
          ),
          getWeekly(
            context.url,
            context.token,
            lwStart,
            lwEnd,
            useGroups,
            searchValue,
            singleStore,
          ),
          getWeekly(
            context.url,
            context.token,
            lyStart,
            lyEnd,
            useGroups,
            searchValue,
            singleStore,
          ),
          getHourly(
            context.url,
            context.token,
            twStart,
            twEnd,
            useGroups,
            searchValue,
            singleStore,
          ),
          getHourly(
            context.url,
            context.token,
            lwStart,
            lwEnd,
            useGroups,
            searchValue,
            singleStore,
          ),
          getHourly(
            context.url,
            context.token,
            lyStart,
            lyEnd,
            useGroups,
            searchValue,
            singleStore,
          ),
        ]);
      if (twResp.data.error === 0) dispatch(setWeeklySales(twResp.data.sales));
      if (lwResp.data.error === 0)
        dispatch(setWeeklySalesLastWeek(lwResp.data.sales));
      if (lyResp.data.error === 0)
        dispatch(setWeeklySalesLastYear(lyResp.data.sales));
      if (hourlyResp.data.error === 0)
        dispatch(setHourlySales(hourlyResp.data.subs));
      if (lwHourlyResp.data.error === 0)
        dispatch(setHourlySalesLastWeek(lwHourlyResp.data.subs));
      if (lyHourlyResp.data.error === 0)
        dispatch(setHourlySalesLastYear(lyHourlyResp.data.subs));
    } catch (err: any) {
      toast.error(err.message);
      setFetchFailed(true);
    } finally {
      dispatch(setLedgerLoading(false));
    }
  };

  const ledgerRows = buildLedgerRows(
    weeklySales,
    weeklySalesLastWeek,
    weeklySalesLastYear,
    assignedStores,
    lastValidThresholdRef.current,
    gradingMetric,
  );

  const criticalRows = ledgerRows.filter((r) => r.severity === "critical");
  const watchRows = ledgerRows.filter((r) => r.severity === "watch");
  const healthyRows = ledgerRows.filter((r) => r.severity === "healthy");

  const sevFilteredRows =
    sevFilter === "all"
      ? [...criticalRows, ...watchRows, ...healthyRows]
      : sevFilter === "critical"
        ? criticalRows
        : sevFilter === "watch"
          ? watchRows
          : healthyRows;

  const textFilteredRows = storeFilter.trim()
    ? sevFilteredRows.filter((row) => {
        const q = storeFilter.trim().toLowerCase();
        return (
          row.store_name.toLowerCase().includes(q) ||
          row.store_number.toLowerCase().includes(q)
        );
      })
    : sevFilteredRows;

  const sortValue = (row: LedgerRowData, column: SortColumn) =>
    column === "ty" ? row.twTotal : column === "vsLW" ? row.vsLWPct : row.vsLYPct;

  const visibleRows = sort
    ? [...textFilteredRows].sort((a, b) => {
        const diff = sortValue(a, sort.column) - sortValue(b, sort.column);
        return sort.direction === "desc" ? -diff : diff;
      })
    : textFilteredRows;

  const heroTWTotal = ledgerRows.reduce((acc, r) => acc + r.twTotal, 0);
  const heroLYTotal = ledgerRows.reduce((acc, r) => acc + r.lyTotal, 0);
  const heroLWTotal = ledgerRows.reduce((acc, r) => acc + r.lwTotal, 0);
  const heroTWQty = ledgerRows.reduce((acc, r) => acc + r.twQty, 0);
  const heroLYQty = ledgerRows.reduce((acc, r) => acc + r.lyQty, 0);
  const heroLWQty = ledgerRows.reduce((acc, r) => acc + r.lwQty, 0);
  const heroGradeTW = gradingMetric === "qty" ? heroTWQty : heroTWTotal;
  const heroGradeLY = gradingMetric === "qty" ? heroLYQty : heroLYTotal;
  const heroGradeLW = gradingMetric === "qty" ? heroLWQty : heroLWTotal;
  const heroVsLYPct = heroGradeLY
    ? ((heroGradeTW - heroGradeLY) / heroGradeLY) * 100
    : 0;
  const heroVsLWPct = heroGradeLW
    ? ((heroGradeTW - heroGradeLW) / heroGradeLW) * 100
    : 0;

  const weekLabel = (() => {
    const { twStart, twEnd } = getDateRanges();
    const start = new Date(twStart + "T12:00:00");
    const end = new Date(twEnd + "T12:00:00");
    const fmtD = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
    return `${fmtD(start)} – ${fmtD(end)}/${end.getFullYear()}`;
  })();

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
      ) : (
        <div className="flex gap-4 h-[calc(100vh-5rem)]">
          {/* Left: store list */}
          <div
            className="flex flex-col min-w-0 shadow-lg"
            style={{ flexBasis: "35%", flexShrink: 0 }}
          >
            <LedgerHeader
              weekLabel={weekLabel}
              twTotal={heroTWTotal}
              twQty={heroTWQty}
              vsLYPct={heroVsLYPct}
              vsLWPct={heroVsLWPct}
              hasLY={heroGradeLY > 0}
              hasLW={heroGradeLW > 0}
              onNewSearch={resetToEntry}
              onOpenSearch={() => setSearchModalOpen(true)}
              gradingMetric={gradingMetric}
            />

            {/* Tier summary pills — click to filter the list below */}
            <div className="flex items-center justify-between px-4 py-2 bg-custom-white border-x border-gray-100">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSevFilter((f) => (f === "critical" ? "all" : "critical"))}
                  className={`text-[12px] font-semibold px-2 py-1 rounded-full bg-severity_critical_bg text-severity_critical_text transition-shadow ${
                    sevFilter === "critical" ? "ring-2 ring-severity_critical_text/40 shadow-sm" : ""
                  }`}
                >
                  Crit ({criticalRows.length})
                </button>
                <button
                  onClick={() => setSevFilter((f) => (f === "watch" ? "all" : "watch"))}
                  className={`text-[12px] font-semibold px-2 py-1 rounded-full bg-severity_watch_bg text-severity_watch_text transition-shadow ${
                    sevFilter === "watch" ? "ring-2 ring-severity_watch_text/40 shadow-sm" : ""
                  }`}
                >
                  Watch ({watchRows.length})
                </button>
                <button
                  onClick={() => setSevFilter((f) => (f === "healthy" ? "all" : "healthy"))}
                  className={`text-[12px] font-semibold px-2 py-1 rounded-full bg-severity_healthy_bg text-severity_healthy_text transition-shadow ${
                    sevFilter === "healthy" ? "ring-2 ring-severity_healthy_text/40 shadow-sm" : ""
                  }`}
                >
                  OK ({healthyRows.length})
                </button>
              </div>
              <TextFilter
                value={storeFilter}
                onChange={setStoreFilter}
                placeholder="Filter by store…"
                className="max-w-[230px]"
              />
            </div>

            {/* Unified store list — sorted critical → watch → healthy */}
            <div className="flex-1 overflow-hidden bg-custom-white rounded-b-xl shadow-sm border border-t-0 border-gray-100 flex flex-col">
              <div className="flex items-center gap-2.5 px-3 py-1.5 border-b border-gray-100 flex-shrink-0">
                <span className="w-2 flex-shrink-0" />
                <span className="text-[11.5px] font-semibold uppercase tracking-wide text-content/80 flex-1">
                  Store
                </span>
                <div className="flex items-center gap-[14px]">
                  <button
                    onClick={() => handleSortClick("ty")}
                    className="flex items-center justify-end gap-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-content/80 hover:text-content flex-shrink-0 pl-2.5"
                    style={{ width: 64 }}
                  >
                    TY
                    {sort?.column === "ty" &&
                      (sort.direction === "desc" ? (
                        <ChevronDownIcon className="w-3 h-3" />
                      ) : (
                        <ChevronUpIcon className="w-3 h-3" />
                      ))}
                  </button>
                  <button
                    onClick={() => handleSortClick("vsLW")}
                    className="flex items-center justify-center gap-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-content/80 hover:text-content flex-shrink-0"
                    style={{ width: 58 }}
                  >
                    vs LW
                    {sort?.column === "vsLW" &&
                      (sort.direction === "desc" ? (
                        <ChevronDownIcon className="w-3 h-3" />
                      ) : (
                        <ChevronUpIcon className="w-3 h-3" />
                      ))}
                  </button>
                  <button
                    onClick={() => handleSortClick("vsLY")}
                    className="flex items-center justify-center gap-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-content/80 hover:text-content flex-shrink-0"
                    style={{ width: 58 }}
                  >
                    vs LY
                    {sort?.column === "vsLY" &&
                      (sort.direction === "desc" ? (
                        <ChevronDownIcon className="w-3 h-3" />
                      ) : (
                        <ChevronUpIcon className="w-3 h-3" />
                      ))}
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto thin-scrollbar">
                {visibleRows.map((row) => (
                  <LedgerRow
                    key={row.storeid}
                    row={row}
                    isSelected={selection?.storeId === row.storeid}
                    gradingMetric={gradingMetric}
                    onClick={(s) => dispatch(setLedgerSelection(s))}
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
                onClose={() => dispatch(setLedgerSelection(null))}
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSearchModalOpen(false)}
        >
          <div
            className="w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <LedgerEntryCard onSearch={fetchLedger} loading={loading} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesLedger;
