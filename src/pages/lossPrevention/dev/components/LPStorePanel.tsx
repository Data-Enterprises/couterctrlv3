// Hooks
import { useMemo, useState } from "react";
import { useLossPreventionCtx } from "../hooks";
import { useTriStateSort } from "../../../../utils/useTriStateSort";

// Utils
import { formatCurrency2, formatBigNumber, getStoreName, formatCurrencyCompact } from "../../../../utils";
import { applyStoreNumberToName } from "../../../../utils/storeIdentity";
import { severityDotClass, type SevFilter } from "../../../../utils/severity";
import { isNoDollarType, storeSeverity, directionalPillClass, weekRangeLabel } from "../utils/grading";
import { SEV_RANK } from "../utils";
import { PERF_SORT_HEADER } from "../../../../components-dev/utils";

// Interfaces
import type { CashierDetails } from "../../../../interfaces";
import type { LpSortCol } from "../interfaces";

// Components
import BackButton from "../../../../components-dev/BackButton";
import PageInfoButton from "../../../../components-dev/PageInfoButton";
import TextFilter from "../../../../components-dev/filters/TextFilter";
import SelectFilter from "../../../../components-dev/filters/SelectFilter";
import LoadingIndicator from "../../../../components-dev/loading/LoadingIndicator";
import SortHeader from "../../../../components-dev/SortHeader";

interface LPStorePanelProps {
  loading: boolean;
  onSaleTypeSelect: (saleType: string) => void;
  onStoreSelect: (detail: CashierDetails) => void;
  onOpenSearch: () => void;
  /** null = whole week. Fetches that day's per-store totals plus the same
   *  weekday from both baseline weeks — see handleDaySelect in LPDesktop. */
  onDaySelect: (day: string | null) => void;
}

/** Loss Prevention's left panel: the week's totals, exception type tabs, severity chips, a
 *  day picker and store filter, and the sortable store list graded against the two-week
 *  baseline. Clicking a store loads its transactions. */
const LPStorePanel = ({ loading, onSaleTypeSelect, onStoreSelect, onOpenSearch, onDaySelect }: LPStorePanelProps) => {
  const cashier = useLossPreventionCtx();
  const { weekDate, assignedStores } = cashier;
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");
  const [storeFilter, setStoreFilter] = useState("");
  const { sort, handleSort, applySort } = useTriStateSort<LpSortCol>();

  const {
    saleTypes, selectedSaleType, cashierDetails, baselineDetails,
    selectedStoreId, selectedStoreNumber,
    selectedDay, dayDetails, dayBaselineDetails, loadingDay,
  } = cashier;

  // With a day selected the rows and their baseline both come from that day's
  // fetch; the baseline is the same weekday from both baseline weeks summed,
  // so the /2 below still reads as "average of the matched days".
  const activeDetails = selectedDay ? dayDetails : cashierDetails;
  const activeBaseline = selectedDay ? dayBaselineDetails : baselineDetails;

  // The seven days of the searched week, newest first.
  const dayOptions = useMemo(() => {
    const [m, d, y] = weekDate.split("/").map(Number);
    const end = new Date(y, m - 1, d);
    return Array.from({ length: 7 }, (_, i) => {
      const dt = new Date(y, m - 1, d - i);
      return {
        value: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`,
        label: dt.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" }),
      };
    }).filter(() => !Number.isNaN(end.getTime()));
  }, [weekDate]);

  const dateLabel = weekRangeLabel(weekDate);

  // Header totals follow the filter — week totals beside day-scoped rows would
  // read as though the rows didn't add up.
  const totalSales  = activeDetails.reduce((acc, d) => acc + Math.abs(d.amount), 0);
  const totalTrans  = activeDetails.reduce((acc, d) => acc + d.transaction_count, 0);
  const totalItems  = activeDetails.reduce((acc, d) => acc + d.total_items, 0);

  const hasAmount = !isNoDollarType(selectedSaleType);

  // storeid -> every store_number returned under it. More than one means
  // co-located locations that the name alone can't tell apart.
  const numbersByStoreId = useMemo(
    () =>
      activeDetails.reduce((acc: Record<number, string[]>, d) => {
        const nums = (acc[d.storeid] ??= []);
        if (!nums.includes(d.store_number)) nums.push(d.store_number);
        return acc;
      }, {}),
    [activeDetails],
  );

  const graded = useMemo(
    () =>
      activeDetails.map((detail) => {
        // storeid + store_number, not storeid alone: co-located stores share
        // an id, and matching on the id would hand both rows whichever
        // sibling's baseline happened to come back first.
        const b = activeBaseline.find(
          (x) =>
            x.storeid === detail.storeid &&
            x.store_number === detail.store_number,
        );
        const bTrans = b ? b.transaction_count / 2 : null;
        const bItems = b ? b.total_items / 2 : null;
        const bAmount = b ? Math.abs(b.amount) / 2 : null;
        const bAvg = b ? Math.abs(b.average_dollars) : null;
        const transPct =
          bTrans !== null && bTrans !== 0
            ? ((detail.transaction_count - bTrans) / Math.abs(bTrans)) * 100
            : null;
        const itemsPct =
          bItems !== null && bItems !== 0
            ? ((detail.total_items - bItems) / Math.abs(bItems)) * 100
            : null;
        const amountPct =
          bAmount !== null && bAmount !== 0
            ? ((Math.abs(detail.amount) - bAmount) / bAmount) * 100
            : null;
        const avgPct =
          bAvg !== null && bAvg !== 0
            ? ((Math.abs(detail.average_dollars) - bAvg) / bAvg) * 100
            : null;
        return {
          detail,
          // getStoreName resolves by storeid, so co-located rows come back with
          // the identical name — rewrite the embedded number to this row's.
          name: applyStoreNumberToName(
            getStoreName(assignedStores, detail.storeid, detail.store_name),
            detail.store_number,
            numbersByStoreId[detail.storeid] ?? [],
          ),
          sev: storeSeverity(detail, activeBaseline, selectedSaleType),
          transPct,
          itemsPct,
          amountPct,
          avgPct,
        };
      }),
    [
      activeDetails,
      activeBaseline,
      selectedSaleType,
      assignedStores,
      numbersByStoreId,
    ],
  );

  const criticalCount = graded.filter((g) => g.sev === "critical").length;
  const watchCount = graded.filter((g) => g.sev === "watch").length;
  const healthyCount = graded.filter((g) => g.sev === "healthy").length;

  const sevFilteredStores =
    sevFilter === "all" ? graded : graded.filter((g) => g.sev === sevFilter);

  const textFilteredStores = storeFilter
    ? sevFilteredStores.filter((g) =>
        g.name.toLowerCase().includes(storeFilter.toLowerCase()),
      )
    : sevFilteredStores;

  const gradeOrdered = [...textFilteredStores].sort(
    (a, b) => SEV_RANK[a.sev] - SEV_RANK[b.sev],
  );

  // Amounts are compared on magnitude, matching what the cells display —
  // refunds and voids arrive negative, and sorting on the raw sign would put
  // the biggest refunds at the bottom of a descending sort.
  const visibleStores = applySort(gradeOrdered, ({ detail }, col) =>
    col === "trans"
      ? detail.transaction_count
      : col === "qty"
        ? detail.total_items
        : col === "amount"
          ? Math.abs(detail.amount)
          : Math.abs(detail.average_dollars),
  );

  return (
    <div className="cc-panel shadow-lg" style={{ width: "39%", flexShrink: 0 }}>
      {/* Navy header */}
      <div className="flex-shrink-0 px-3 pt-1 pb-2.5 flex flex-col gap-0" style={{ background: "rgb(var(--color-brand-navy))" }}>
        {/* Row 1: date | totals */}
        <div className="flex items-center gap-2 min-h-[24px]">
          <span className="text-[13px] cc-navy-title flex-shrink-0">{dateLabel}</span>
          <div className="flex-1" />
          {activeDetails.length > 0 && (
            <>
              <div className="flex items-baseline gap-1 flex-shrink-0">
                <span className="text-[10px] uppercase tracking-wide text-custom-white/95">Sales</span>
                <span className="text-[13px] font-medium text-custom-white">{formatCurrencyCompact(totalSales)}</span>
              </div>
              <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />
              <div className="flex items-baseline gap-1 flex-shrink-0">
                <span className="text-[10px] uppercase tracking-wide text-custom-white/95">Trans</span>
                <span className="text-[13px] font-medium text-custom-white">{formatBigNumber(totalTrans, 0)}</span>
              </div>
              <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />
              <div className="flex items-baseline gap-1 flex-shrink-0">
                <span className="text-[10px] uppercase tracking-wide text-custom-white/95">Qty</span>
                <span className="text-[13px] font-medium text-custom-white">{formatBigNumber(totalItems, 0)}</span>
              </div>
            </>
          )}
        </div>

        {/* Row 2: search left | legend right */}
        <div className="flex items-center gap-2 cc-navy-header-row">
          <BackButton onClick={onOpenSearch} helpAnchor="search" />
          <div className="flex-1" />
          <span className="text-[9px] font-medium uppercase tracking-wide text-custom-white/95 flex-shrink-0">Exception activity vs baseline</span>
          <div className="relative flex-shrink-0">
            <PageInfoButton page="loss-prevention" />
          </div>
        </div>
      </div>

      {/* Exception type tabs — Description and Tender excluded until further notice */}
      <div data-help="type-tabs" className="flex flex-shrink-0 border-b border-line_hair overflow-x-auto no-scrollbar">
        {saleTypes.filter((st) => st.sale_type !== "Description" && st.sale_type !== "Tender").map((st) => (
          <button
            key={st.sale_type}
            onClick={() => onSaleTypeSelect(st.sale_type)}
            className={`flex-1 text-center px-2 py-2 text-[11px] font-medium whitespace-nowrap border-b-2 transition-colors ${
              selectedSaleType === st.sale_type
                ? "border-brand_navy text-content"
                : "border-transparent text-content"
            }`}
          >
            {st.sale_type}
          </button>
        ))}
      </div>

      {/* Severity filter chips + text filter */}
      <div className="flex items-center justify-between gap-1.5 px-3 py-2 bg-custom-white border-b border-line_hair">
        <div data-help="severity-chips" className="flex items-center gap-1.5">
          <button
            onClick={() => setSevFilter((f) => (f === "critical" ? "all" : "critical"))}
            className={`text-[12px] font-semibold px-2 py-1 rounded-full bg-severity_critical_bg text-severity_critical_text transition-shadow ${
              sevFilter === "critical" ? "ring-2 ring-severity_critical_text/40 shadow-sm" : ""
            }`}
          >
            Crit ({criticalCount})
          </button>
          <button
            onClick={() => setSevFilter((f) => (f === "watch" ? "all" : "watch"))}
            className={`text-[12px] font-semibold px-2 py-1 rounded-full bg-severity_watch_bg text-severity_watch_text transition-shadow ${
              sevFilter === "watch" ? "ring-2 ring-severity_watch_text/40 shadow-sm" : ""
            }`}
          >
            Watch ({watchCount})
          </button>
          <button
            onClick={() => setSevFilter((f) => (f === "healthy" ? "all" : "healthy"))}
            className={`text-[12px] font-semibold px-2 py-1 rounded-full bg-severity_healthy_bg text-severity_healthy_text transition-shadow ${
              sevFilter === "healthy" ? "ring-2 ring-severity_healthy_text/40 shadow-sm" : ""
            }`}
          >
            OK ({healthyCount})
          </button>
        </div>
        <div data-help="day-select" className="flex items-center gap-1.5 flex-shrink-0">
          {/* Day filter — narrows the rows to one day and re-bases their
              grading to the same weekday in the baseline weeks. */}
          <SelectFilter
            options={dayOptions}
            value={selectedDay ?? ""}
            onChange={(v) => onDaySelect(v || null)}
            placeholder="Whole week"
            className="max-w-[150px]"
          />
          <TextFilter
            value={storeFilter}
            onChange={setStoreFilter}
            placeholder="Filter by store…"
            className="max-w-[180px]"
          />
        </div>
      </div>

      {/* Unified store list — sorted critical → watch → healthy */}
      <div className="flex-1 min-h-0 flex flex-col">
        {(loading || loadingDay) && activeDetails.length === 0 ? (
          // Bare text read as a stalled panel when switching sale types — the
          // animated pill is the same signal the rest of the app uses.
          <div className="flex-1 relative">
            <LoadingIndicator message="Loading stores..." />
          </div>
        ) : activeDetails.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[11px] text-content/95">
            {selectedSaleType ? "No stores found" : "Select an exception type"}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 px-3 py-1.5 border-b border-line_hair flex-shrink-0">
              <span className="w-2.5 flex-shrink-0" />
              <span className="text-[11.5px] cc-caps flex-1">
                Store
              </span>
              <div data-help="sort" className="flex items-center gap-[14px]">
                <SortHeader
                  col="trans"
                  label="Trans"
                  sort={sort}
                  onSort={handleSort}
                  width={58}
                  className={`${PERF_SORT_HEADER} justify-center`}
                />
                <SortHeader
                  col="qty"
                  label="Qty"
                  sort={sort}
                  onSort={handleSort}
                  width={58}
                  className={`${PERF_SORT_HEADER} justify-center`}
                />
                {hasAmount && (
                  <SortHeader
                    col="amount"
                    label="Total $"
                    sort={sort}
                    onSort={handleSort}
                    width={64}
                    className={`${PERF_SORT_HEADER} justify-center pl-2.5`}
                  />
                )}
                {hasAmount && (
                  <SortHeader
                    col="avg"
                    label="Avg $"
                    sort={sort}
                    onSort={handleSort}
                    width={58}
                    className={`${PERF_SORT_HEADER} justify-center`}
                  />
                )}
              </div>
            </div>

            <div data-help="store-list" className="flex-1 overflow-y-auto thin-scrollbar">
              {visibleStores.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-[11px] text-content/95">
                  No stores match
                </div>
              ) : (
                visibleStores.map(({ detail, name, sev, transPct, itemsPct, amountPct, avgPct }) => {
                  const isSel =
                    detail.storeid === selectedStoreId &&
                    detail.store_number === selectedStoreNumber;
                  return (
                    <button
                      key={`${detail.storeid}__${detail.store_number}`}
                      onClick={() => onStoreSelect(detail)}
                      className={`w-full flex items-center gap-2.5 p-3 text-left transition-colors border-l-2 border-b border-b-brand_navy/15 ${
                        isSel
                          ? "bg-row_selected border-row_selected_border"
                          : "border-transparent hover:bg-fill_soft"
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${severityDotClass[sev]}`} />
                      <span className="text-[13px] font-medium text-content truncate flex-1">
                        {name}
                      </span>
                      <div className="flex items-center gap-[14px]">
                        <span
                          className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 whitespace-nowrap ${
                            transPct === null ? "bg-row_stripe text-brand_slate" : directionalPillClass(transPct)
                          }`}
                          style={{ minWidth: 58 }}
                        >
                          {formatBigNumber(detail.transaction_count, 0)}
                        </span>
                        <span
                          className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 whitespace-nowrap ${
                            itemsPct === null ? "bg-row_stripe text-brand_slate" : directionalPillClass(itemsPct)
                          }`}
                          style={{ minWidth: 58 }}
                        >
                          {formatBigNumber(detail.total_items, 0)}
                        </span>
                        {hasAmount && (
                          <span
                            className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 whitespace-nowrap ${
                              amountPct === null ? "bg-row_stripe text-brand_slate" : directionalPillClass(amountPct)
                            }`}
                            style={{ minWidth: 64 }}
                          >
                            {formatCurrency2(Math.abs(detail.amount))}
                          </span>
                        )}
                        {hasAmount && (
                          <span
                            className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 whitespace-nowrap ${
                              avgPct === null ? "bg-row_stripe text-brand_slate" : directionalPillClass(avgPct)
                            }`}
                            style={{ minWidth: 58 }}
                          >
                            {formatCurrency2(Math.abs(detail.average_dollars))}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LPStorePanel;
