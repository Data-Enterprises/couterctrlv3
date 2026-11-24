// Hooks
import { useVendorListFigures } from "../hooks/listPanel";
import { useCallback } from "react";
import { useAppDispatch } from "../../../../hooks";

// Redux
import {
  setTextFilter,
  setTierFilter,
  setSelectedVendor,
  setMetric,
  setThreshold,
} from "../../../../features/dev/devVendorsSlice";

// Utils
import { headerDeltaPill, PCT_COL_W } from "../../../../utils/severity";
import { type Tier } from "../../../../utils/grading";
import { TOGGLE_OPTS, fmtDelta, CHIP_BASE, CHIP_ON } from "../utils";
import { PERF_SORT_HEADER } from "../../../../components-dev/utils";

// Interfaces

// Components
import BackButton from "../../../../components-dev/BackButton";
import LocationTabs from "../../../../components-dev/filters/LocationTabs";
import PageInfoButton from "../../../../components-dev/PageInfoButton";
import TextFilter from "../../../../components-dev/filters/TextFilter";
import ThresholdFilter from "../../../../components-dev/filters/ThresholdFilter";
import SortHeader from "../../../../components-dev/SortHeader";
import VendorRow from "./VendorRow";

interface VendorListPanelProps {
  onSearchOpen: () => void;
  /** Re-presents the cached search as one co-located location, or all of
   *  them combined. No refetch — see useVendorSearch. */
  onStoreNumberChange: (storeNumber: string | null) => void;
}

/** The Vendors list panel: header with the store's week total and its change, location tabs, threshold and text filters,
 *  a no-supplier line, and vendor rows sortable by TY, vs LW and vs LY. */
const VendorListPanel = ({
  onSearchOpen,
  onStoreNumberChange,
}: VendorListPanelProps) => {
  const dispatch = useAppDispatch();
  const {
    vend,
    locationName,
    graded,
    headerCov,
    counts,
    visible,
    totals,
    noVendor,
    fmt,
    fmtHeader,
    dateRange,
    threshValue,
    metric,
    tierFilter,
    textFilter,
    selectedVendor,
    sort,
    handleSort,
  } = useVendorListFigures();

  // Stable identity — a fresh closure per render would break every row's memo.
  const handleSelect = useCallback(
    (vendorId: string, isSelected: boolean) =>
      dispatch(setSelectedVendor(isSelected ? null : vendorId)),
    [dispatch],
  );

  /** Re-clicking the active chip clears the filter, so "all" needs no chip. */
  const chip = (key: Tier, label: string, n: number) => (
    <button
      key={key}
      onClick={() => dispatch(setTierFilter(tierFilter === key ? "all" : key))}
      className={`text-[12px] font-semibold px-2 py-1 rounded-full transition-shadow ${CHIP_BASE[key]} ${
        tierFilter === key ? CHIP_ON[key] : ""
      }`}
    >
      {label} ({n})
    </button>
  );

  return (
    <div
      className="flex flex-col min-w-0 shadow-lg"
      style={{ flexBasis: "35%", flexShrink: 0 }}
    >
      {/* Navy header — 2-row canonical pattern */}
      <div className="cc-navy-panel-header flex flex-col gap-0">
        {/* Row 1: date range | store total + vs LW/LY pills. Store name moved
            down to row 2 beside the search button, matching Sub Dept Margins. */}
        <div className="flex items-center gap-2 min-h-[26px]">
          <span className="cc-navy-title text-[13px] flex-shrink-0">
            {dateRange}
          </span>
          <div className="flex-1" />
          {graded.length > 0 && (
            <>
              <span className="text-[14px] cc-navy-title">
                {fmtHeader(totals.tw)}
              </span>
              {totals.lwPct !== null && (
                <span
                  title={
                    headerDeltaPill(
                      totals.lwPct,
                      headerCov.lwDayCount,
                      headerCov.dayCount,
                      "last week",
                    ).title
                  }
                  className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${
                    headerDeltaPill(
                      totals.lwPct,
                      headerCov.lwDayCount,
                      headerCov.dayCount,
                      "last week",
                    ).cls
                  }`}
                >
                  LW {fmtDelta(totals.lwPct, metric === "margin")}
                  {
                    headerDeltaPill(
                      totals.lwPct,
                      headerCov.lwDayCount,
                      headerCov.dayCount,
                      "last week",
                    ).note
                  }
                </span>
              )}
              {totals.lyPct !== null && (
                <span
                  title={
                    headerDeltaPill(
                      totals.lyPct,
                      headerCov.lyDayCount,
                      headerCov.dayCount,
                      "last year",
                    ).title
                  }
                  className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${
                    headerDeltaPill(
                      totals.lyPct,
                      headerCov.lyDayCount,
                      headerCov.dayCount,
                      "last year",
                    ).cls
                  }`}
                >
                  LY {fmtDelta(totals.lyPct, metric === "margin")}
                  {
                    headerDeltaPill(
                      totals.lyPct,
                      headerCov.lyDayCount,
                      headerCov.dayCount,
                      "last year",
                    ).note
                  }
                </span>
              )}
            </>
          )}
        </div>

        {/* Row 2: search btn + store | metric toggle | threshold | help btn */}
        <div className="flex items-center gap-2 cc-navy-header-row">
          <BackButton onClick={onSearchOpen} helpAnchor="search" />

          <span className="text-[11px] font-medium text-custom-white truncate min-w-0">
            {locationName}
          </span>

          <div className="flex-1" />

          <div
            data-help="metric"
            className="flex items-center flex-shrink-0 rounded overflow-hidden"
            style={{ height: 22 }}
          >
            {TOGGLE_OPTS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => dispatch(setMetric(key))}
                className="px-2.5 text-[10px] text-custom-white font-medium transition-colors h-full"
                style={{
                  background:
                    metric === key
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(255,255,255,0.07)",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />

          {/* Threshold. The label stays generic so the Performance headers read
              identically — the page already says what is being graded. */}
          <div
            data-help="threshold"
            className="flex items-center gap-1.5 flex-shrink-0"
          >
            <span className="text-[11px] text-custom-white font-medium">
              Threshold
            </span>
            <ThresholdFilter
              value={threshValue}
              onChange={(v) => dispatch(setThreshold(v?.amount ?? null))}
              suffix="%"
              showOp={false}
              inputWidth={40}
              variant="dark"
            />
          </div>

          <div className="relative flex-shrink-0">
            <PageInfoButton page="vendors" />
          </div>
        </div>
      </div>

      {/* Renders nothing unless this storeid covers two locations, so an
          ordinary store sees no change to the layout. */}
      <LocationTabs
        numbers={vend.availableStoreNumbers}
        selected={vend.selectedStoreNumber}
        onChange={onStoreNumberChange}
      />

      {/* Filter row */}
      <div className="flex items-center justify-between gap-1.5 px-4 py-2 bg-custom-white border-x border-line_hair">
        <div
          data-help="severity-chips"
          className="flex items-center gap-1.5 flex-wrap"
        >
          {chip("critical", "Crit", counts.critical)}
          {chip("watch", "Watch", counts.watch)}
          {chip("healthy", "OK", counts.healthy)}
          {counts.ungraded > 0 && chip("ungraded", "Ungraded", counts.ungraded)}
        </div>
        <TextFilter
          value={textFilter}
          onChange={(v) => dispatch(setTextFilter(v))}
          placeholder="Filter vendors…"
          className="max-w-[230px]"
        />
      </div>

      {noVendor.count > 0 && (
        <div className="px-4 py-1.5 bg-custom-white border-x border-b border-line_hair text-[11px] text-content/95 flex-shrink-0">
          <span className="font-medium text-content">
            {fmt(noVendor.value)}
          </span>{" "}
          booked without a vendor — coupon lines and anything else the POS
          records with no supplier. Counted in the store total so the vendors
          below still add up.
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col bg-custom-white border-x border-b border-line_hair rounded-b-xl overflow-hidden">
        {/* Column headers */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 border-b border-line_hair flex-shrink-0">
          <span className="w-2.5 flex-shrink-0" />
          <span className="text-[11.5px] cc-caps flex-1">Vendor</span>
          <div data-help="sort" className="flex items-center gap-[14px]">
            <SortHeader
              col="ty"
              label="TY"
              sort={sort}
              onSort={handleSort}
              width={64}
              className={`${PERF_SORT_HEADER} justify-end pl-2.5`}
            />
            <SortHeader
              col="lw"
              label="vs LW"
              sort={sort}
              onSort={handleSort}
              width={PCT_COL_W}
              className={`${PERF_SORT_HEADER} justify-center`}
            />
            <SortHeader
              col="ly"
              label="vs LY"
              sort={sort}
              onSort={handleSort}
              width={PCT_COL_W}
              className={`${PERF_SORT_HEADER} justify-center`}
            />
          </div>
        </div>

        <div data-help="list" className="flex-1 overflow-y-auto thin-scrollbar">
          {visible.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-[11px] text-content/95">
              None this week
            </div>
          ) : (
            visible.map((g) => (
              <VendorRow
                key={g.vendorId}
                vendorId={g.vendorId}
                label={g.vendorName}
                twText={g.twText}
                lwText={g.lwText}
                lyText={g.lyText}
                lwPctText={g.lwPctText}
                lyPctText={g.lyPctText}
                dotClass={g.dotClass}
                lwPillClass={g.lwPillClass}
                lyPillClass={g.lyPillClass}
                isSelected={selectedVendor === g.vendorId}
                onSelect={handleSelect}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorListPanel;
