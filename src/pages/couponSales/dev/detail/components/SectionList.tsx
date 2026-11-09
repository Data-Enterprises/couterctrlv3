// Hooks
import { useAppDispatch } from "../../../../../hooks";
import { useCouponSalesCtx } from "../../hooks";

// Redux
import { setCouponSectionFilter } from "../../../../../features/dev/devCouponSalesSlice";

// Utils
import { SECTION_COL_LABEL } from "../utils";

// Interfaces
import type { Dispatch, SetStateAction } from "react";
import type { CouponTierFilter } from "../../../../../features/dev/devCouponSalesSlice";
import type { buildBreakdownRows, GradingOptions } from "../../utils";
import type { SectionSortCol } from "../interfaces";
import type { useTriStateSort } from "../../../../../utils/useTriStateSort";

// Components
import TextFilter from "../../../../../components-dev/filters/TextFilter";
import SortHeader from "../../../../../components-dev/SortHeader";
import SectionRow from "./SectionRow";

interface SectionListProps {
  grading: GradingOptions;
  critCount: number;
  watchCount: number;
  okCount: number;
  sectionTierFilter: CouponTierFilter;
  setSectionTierFilter: Dispatch<SetStateAction<CouponTierFilter>>;
  sectionSort: ReturnType<typeof useTriStateSort<SectionSortCol>>;
  visibleSections: ReturnType<typeof buildBreakdownRows>;
}

/** The left column: the active tab's graded rows, with grade chips, a filter
 *  and sortable columns. */
const SectionList = ({
  grading,
  critCount,
  watchCount,
  okCount,
  sectionTierFilter,
  setSectionTierFilter,
  sectionSort,
  visibleSections,
}: SectionListProps) => {
  const dispatch = useAppDispatch();
  const { breakdown, sectionFilter, selectedSectionKey } = useCouponSalesCtx();
  const isItemView = breakdown === "item";
  return (
    <div
      className="flex flex-col border-r border-gray-100"
      style={{ width: 330, flexShrink: 0 }}
    >
      <div className="flex-shrink-0 flex items-center gap-1.5 p-2 border-b border-gray-100 bg-gray-100">
        <button
          onClick={() =>
            setSectionTierFilter((f) => (f === "critical" ? "all" : "critical"))
          }
          className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-severity_critical_bg text-severity_critical_text transition-shadow ${
            sectionTierFilter === "critical"
              ? "ring-2 ring-severity_critical_text/40 shadow-sm"
              : ""
          }`}
        >
          Crit ({critCount})
        </button>
        {/* Avg $ is a two-tier question, so Watch has nothing to count. */}
        {grading.metric === "trend" && (
        <button
          onClick={() => setSectionTierFilter((f) => (f === "watch" ? "all" : "watch"))}
          className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-severity_watch_bg text-severity_watch_text transition-shadow ${
            sectionTierFilter === "watch"
              ? "ring-2 ring-severity_watch_text/40 shadow-sm"
              : ""
          }`}
        >
          Watch ({watchCount})
        </button>
        )}
        <button
          onClick={() => setSectionTierFilter((f) => (f === "ok" ? "all" : "ok"))}
          className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-severity_healthy_bg text-severity_healthy_text transition-shadow ${
            sectionTierFilter === "ok"
              ? "ring-2 ring-severity_healthy_text/40 shadow-sm"
              : ""
          }`}
        >
          OK ({okCount})
        </button>
        <div className="flex-1" />
        <TextFilter
          value={sectionFilter}
          onChange={(v) => dispatch(setCouponSectionFilter(v))}
          placeholder="Filter"
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
        <div
          className="sticky top-0 z-10 grid border-b border-gray-100 bg-gray-100"
          style={{ gridTemplateColumns: "1fr 0.62fr 0.4fr 0.4fr 0.55fr" }}
        >
          <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-content text-left">
            {SECTION_COL_LABEL[breakdown]}
          </div>
          <SortHeader
            col="amount"
            label="Amount"
            sort={sectionSort.sort}
            onSort={sectionSort.handleSort}
            className="px-2 py-1 text-[9px] font-bold justify-end uppercase tracking-wide text-content hover:underline"
          />
          <SortHeader
            col="trans"
            label="Trans"
            sort={sectionSort.sort}
            onSort={sectionSort.handleSort}
            className="px-1.5 py-1 text-[9px] font-bold justify-end uppercase tracking-wide text-content hover:underline"
          />
          <SortHeader
            col="count"
            label="Count"
            sort={sectionSort.sort}
            onSort={sectionSort.handleSort}
            className="px-1.5 py-1 text-[9px] font-bold justify-end uppercase tracking-wide text-content hover:underline"
          />
          <SortHeader
            col="avg"
            label="Avg"
            sort={sectionSort.sort}
            onSort={sectionSort.handleSort}
            className="px-2 py-1 text-[9px] font-bold justify-end uppercase tracking-wide text-content hover:underline"
          />
        </div>

        {visibleSections.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-[11px] text-content/95">
            Nothing matches
          </div>
        ) : (
        visibleSections.map((row) => (
          <SectionRow
            key={row.key}
            row={row}
            isSel={selectedSectionKey === row.key}
            isItemView={isItemView}
          />
        ))
        )}
      </div>
    </div>
  );
};

export default SectionList;
