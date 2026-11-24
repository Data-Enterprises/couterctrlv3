// Hooks
import { useState } from "react";
import { useLossPreventionCtx } from "../hooks";
import { useStoreGrading } from "../hooks/stores";
import { useTriStateSort } from "../../../../utils/useTriStateSort";

// Utils
import { weekRangeLabel } from "../utils/grading";

// Interfaces
import type { SevFilter } from "../../../../utils/severity";
import type { CashierDetails } from "../../../../interfaces";
import type { LpSortCol } from "../interfaces";

// Components
import TextFilter from "../../../../components/filters/TextFilter";
import SelectFilter from "../../../../components/filters/SelectFilter";
import LoadingIndicator from "../../../../components/loading/LoadingIndicator";
import StorePanelHeader from "./StorePanelHeader";
import SevChip from "./SevChip";
import StoreListHead from "./StoreListHead";
import StoreRow from "./StoreRow";

interface LPStorePanelProps {
  loading: boolean;
  onSaleTypeSelect: (saleType: string) => void;
  onStoreSelect: (detail: CashierDetails) => void;
  onOpenSearch: () => void;
  /** null = whole week. Fetches that day's per-store totals plus the same
   *  weekday from both baseline weeks — see handleDaySelect in useLPDesktop. */
  onDaySelect: (day: string | null) => void;
}

/** Loss Prevention's left panel: the week's totals, exception type tabs, severity chips, a
 *  day picker and store filter, and the sortable store list graded against the two-week
 *  baseline. Clicking a store loads its transactions. */
const LPStorePanel = ({
  loading,
  onSaleTypeSelect,
  onStoreSelect,
  onOpenSearch,
  onDaySelect,
}: LPStorePanelProps) => {
  const {
    weekDate,
    saleTypes,
    selectedSaleType,
    selectedStoreId,
    selectedStoreNumber,
    selectedDay,
    loadingDay,
  } = useLossPreventionCtx();
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");
  const [storeFilter, setStoreFilter] = useState("");
  const { sort, handleSort, applySort } = useTriStateSort<LpSortCol>();
  const { activeDetails, dayOptions, totals, hasAmount, counts, gradeOrdered } =
    useStoreGrading(sevFilter, storeFilter);

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

  const toggleSev = (kind: "critical" | "watch" | "healthy") =>
    setSevFilter((f) => (f === kind ? "all" : kind));

  return (
    <div className="cc-panel shadow-lg" style={{ width: "39%", flexShrink: 0 }}>
      <StorePanelHeader
        dateLabel={weekRangeLabel(weekDate)}
        showTotals={activeDetails.length > 0}
        totals={totals}
        onOpenSearch={onOpenSearch}
      />

      {/* Exception type tabs — Description and Tender excluded until further notice */}
      <div
        data-help="type-tabs"
        className="flex flex-shrink-0 border-b border-line_hair overflow-x-auto no-scrollbar"
      >
        {saleTypes
          .filter(
            (st) => st.sale_type !== "Description" && st.sale_type !== "Tender",
          )
          .map((st) => (
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

      <div className="flex items-center justify-between gap-1.5 px-3 py-2 bg-custom-white border-b border-line_hair">
        <div data-help="severity-chips" className="flex items-center gap-1.5">
          <SevChip
            kind="critical"
            count={counts.critical}
            active={sevFilter === "critical"}
            onToggle={() => toggleSev("critical")}
          />
          <SevChip
            kind="watch"
            count={counts.watch}
            active={sevFilter === "watch"}
            onToggle={() => toggleSev("watch")}
          />
          <SevChip
            kind="healthy"
            count={counts.healthy}
            active={sevFilter === "healthy"}
            onToggle={() => toggleSev("healthy")}
          />
        </div>
        <div
          data-help="day-select"
          className="flex items-center gap-1.5 flex-shrink-0"
        >
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
            <StoreListHead
              sort={sort}
              onSort={handleSort}
              hasAmount={hasAmount}
            />

            <div
              data-help="store-list"
              className="flex-1 overflow-y-auto thin-scrollbar"
            >
              {visibleStores.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-[11px] text-content/95">
                  No stores match
                </div>
              ) : (
                visibleStores.map((store) => (
                  <StoreRow
                    key={`${store.detail.storeid}__${store.detail.store_number}`}
                    store={store}
                    isSelected={
                      store.detail.storeid === selectedStoreId &&
                      store.detail.store_number === selectedStoreNumber
                    }
                    hasAmount={hasAmount}
                    onSelect={() => onStoreSelect(store.detail)}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LPStorePanel;
