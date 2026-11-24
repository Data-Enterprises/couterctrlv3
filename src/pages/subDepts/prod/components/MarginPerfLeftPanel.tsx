// Hooks
import { useState } from "react";
import { useAppDispatch } from "../../../../hooks";
import { useTriStateSort } from "../../../../utils/useTriStateSort";
import { useSubMarginCtx } from "../hooks";
import { useLeftPanelFigures } from "../hooks/leftPanel";

// Redux
import {
  setGradingThreshold,
  setGradingMetric,
  setSelectedSubDeptKey,
} from "../../../../features/subMarginSlice";

// Utils
import { formatCurrency2, formatCurrencyCompact } from "../../../../utils";
import {
  severityDotClass,
  comparisonPillClass,
  headerDeltaPill,
  PCT_COL_W,
  type SevFilter,
} from "../../../../utils/severity";
import { isCompleteCoverage } from "../../../../utils/grading";
import { TOGGLE_OPTS, TIER_STROKE } from "../utils";
import { PERF_SORT_HEADER } from "../../../../components/utils";

// Interfaces
import type { SdSortCol } from "../interfaces";

// Components
import BackButton from "../../../../components/BackButton";
import PageInfoButton from "../../../../components/PageInfoButton";
import ThresholdFilter from "../../../../components/filters/ThresholdFilter";
import LocationTabs from "../../../../components/filters/LocationTabs";
import TextFilter from "../../../../components/filters/TextFilter";
import SortHeader from "../../../../components/SortHeader";
import Sparkline from "./Sparkline";

interface MarginPerfLeftPanelProps {
  onSearchOpen: () => void;
  /** Re-presents the cached search as one co-located location, or all of them
   *  combined when null. No refetch — see SubDeptMarginsDev. */
  onStoreNumberChange: (storeNumber: string | null) => void;
}

/** The left panel of Sub Dept Margins: the store's TY, vs LW and vs LY figures, a location tab for co-located
 *  stores, Critical, Watch and Healthy filter cards, a sub dept search box, and the sortable sub dept list
 *  with sparklines. Also holds the grading threshold and the Search button. */
const MarginPerfLeftPanel = ({
  onSearchOpen,
  onStoreNumberChange,
}: MarginPerfLeftPanelProps) => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  const { sort, handleSort, applySort } = useTriStateSort<SdSortCol>();
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");
  const [subDeptFilter, setSubDeptFilter] = useState("");

  const {
    gradingThreshold,
    storeName,
    dateRange,
    weekDates,
    dailySeries,
    grades,
    headerCov,
    criticalCount,
    watchCount,
    healthyCount,
    storeMarginPct,
    storeLyDelta,
    totalTySales,
    totalLySales,
    vsLYSalesPct,
    vsLWSalesPct,
    storeLwDelta,
    threshValue,
    gradeOrdered,
    gradingMetric,
    loadingGrades,
    availableStoreNumbers,
    selectedStoreNumber,
  } = useLeftPanelFigures(sevFilter, subDeptFilter);

  const handleSubDeptClick = (key: string) => {
    if (key === ctx.selectedSubDeptKey) return;
    dispatch(setSelectedSubDeptKey(key));
  };

  // Sorting follows the metric toggle: in margin mode the columns hold points,
  // in sales mode dollars, and the sort has to read whichever is on screen.
  const isMarginMode = gradingMetric === "margin";
  const visibleRows = applySort(gradeOrdered, ({ grade }, col) =>
    col === "ty"
      ? isMarginMode
        ? grade.tyMarginPct
        : grade.tySales
      : col === "lw"
        ? isMarginMode
          ? grade.lwPtsDelta
          : grade.vsLWSalesPct
        : isMarginMode
          ? grade.ptsDelta
          : grade.vsLYSalesPct,
  );

  return (
    <div
      className="flex flex-col min-w-0 shadow-lg"
      style={{ flexBasis: "35%", flexShrink: 0 }}
    >
      {/* Navy header — 2-row canonical pattern */}
      <div className="cc-navy-panel-header flex flex-col gap-0">
        {/* Row 1: date range | primary value + vs LW/LY pills */}
        <div className="flex items-center gap-2 min-h-[26px]">
          <span className="cc-navy-title text-[13px] flex-shrink-0">
            {dateRange}
          </span>
          <div className="flex-1" />
          {grades.length > 0 && (
            <>
              <span className="text-[14px] cc-navy-title">
                {gradingMetric === "margin"
                  ? storeMarginPct !== null
                    ? `${storeMarginPct.toFixed(2)}%`
                    : "—"
                  : formatCurrencyCompact(totalTySales)}
              </span>
              {(gradingMetric === "margin" ? storeLwDelta : vsLWSalesPct) !==
                null && (
                <span
                  title={
                    headerDeltaPill(
                      gradingMetric === "margin"
                        ? storeLwDelta!
                        : vsLWSalesPct!,
                      headerCov.lwDayCount,
                      headerCov.dayCount,
                      "last week",
                    ).title
                  }
                  className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${
                    headerDeltaPill(
                      gradingMetric === "margin"
                        ? storeLwDelta!
                        : vsLWSalesPct!,
                      headerCov.lwDayCount,
                      headerCov.dayCount,
                      "last week",
                    ).cls
                  }`}
                >
                  LW{" "}
                  {gradingMetric === "margin"
                    ? `${storeLwDelta! >= 0 ? "+" : ""}${storeLwDelta!.toFixed(2)} pts`
                    : `${vsLWSalesPct! >= 0 ? "+" : ""}${vsLWSalesPct!.toFixed(2)}%`}
                  {
                    headerDeltaPill(
                      gradingMetric === "margin"
                        ? storeLwDelta!
                        : vsLWSalesPct!,
                      headerCov.lwDayCount,
                      headerCov.dayCount,
                      "last week",
                    ).note
                  }
                </span>
              )}
              {totalLySales > 0 &&
                (gradingMetric === "margin" ? storeLyDelta : vsLYSalesPct) !==
                  null && (
                  <span
                    title={
                      headerDeltaPill(
                        gradingMetric === "margin"
                          ? storeLyDelta!
                          : vsLYSalesPct!,
                        headerCov.lyDayCount,
                        headerCov.dayCount,
                        "last year",
                      ).title
                    }
                    className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${
                      headerDeltaPill(
                        gradingMetric === "margin"
                          ? storeLyDelta!
                          : vsLYSalesPct!,
                        headerCov.lyDayCount,
                        headerCov.dayCount,
                        "last year",
                      ).cls
                    }`}
                  >
                    LY{" "}
                    {gradingMetric === "margin"
                      ? `${storeLyDelta! >= 0 ? "+" : ""}${storeLyDelta!.toFixed(2)} pts`
                      : `${vsLYSalesPct! >= 0 ? "+" : ""}${vsLYSalesPct!.toFixed(2)}%`}
                    {
                      headerDeltaPill(
                        gradingMetric === "margin"
                          ? storeLyDelta!
                          : vsLYSalesPct!,
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
            {storeName}
          </span>

          <div className="flex-1" />

          {/* Margin / Sales grading toggle */}
          <div
            data-help="metric"
            className="flex items-center flex-shrink-0 rounded overflow-hidden"
            style={{ height: 22 }}
          >
            {TOGGLE_OPTS.map(({ key, label }) => {
              const active = gradingMetric === key;
              return (
                <button
                  key={key}
                  onClick={() => dispatch(setGradingMetric(key))}
                  className="px-2.5 text-[10px] text-custom-white font-medium transition-colors h-full"
                  style={{
                    background: active
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(255,255,255,0.07)",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />

          {/* Threshold input */}
          <div
            data-help="threshold"
            className="flex items-center gap-1.5 flex-shrink-0"
          >
            <span className="text-[11px] text-custom-white font-medium">
              Threshold
            </span>
            <ThresholdFilter
              value={threshValue}
              onChange={(v) => dispatch(setGradingThreshold(v?.amount ?? null))}
              suffix="%"
              showOp={false}
              inputWidth={40}
              variant="dark"
            />
          </div>

          <div className="relative flex-shrink-0">
            <PageInfoButton page="sub-dept-margins" />
          </div>
        </div>
      </div>

      <LocationTabs
        numbers={availableStoreNumbers}
        selected={selectedStoreNumber}
        onChange={onStoreNumberChange}
      />

      {/* Tier filter chips + text filter */}
      <div className="flex items-center justify-between gap-1.5 px-4 py-2 bg-custom-white border-x border-line_hair">
        <div data-help="severity-chips" className="flex items-center gap-1.5">
          <button
            onClick={() =>
              setSevFilter((f) => (f === "critical" ? "all" : "critical"))
            }
            className={`text-[12px] font-semibold px-2 py-1 rounded-full bg-severity_critical_bg text-severity_critical_text transition-shadow ${
              sevFilter === "critical"
                ? "ring-2 ring-severity_critical_text/40 shadow-sm"
                : ""
            }`}
          >
            Crit ({criticalCount})
          </button>
          <button
            onClick={() =>
              setSevFilter((f) => (f === "watch" ? "all" : "watch"))
            }
            className={`text-[12px] font-semibold px-2 py-1 rounded-full bg-severity_watch_bg text-severity_watch_text transition-shadow ${
              sevFilter === "watch"
                ? "ring-2 ring-severity_watch_text/40 shadow-sm"
                : ""
            }`}
          >
            Watch ({watchCount})
          </button>
          <button
            onClick={() =>
              setSevFilter((f) => (f === "healthy" ? "all" : "healthy"))
            }
            className={`text-[12px] font-semibold px-2 py-1 rounded-full bg-severity_healthy_bg text-severity_healthy_text transition-shadow ${
              sevFilter === "healthy"
                ? "ring-2 ring-severity_healthy_text/40 shadow-sm"
                : ""
            }`}
          >
            OK ({healthyCount})
          </button>
        </div>
        <TextFilter
          value={subDeptFilter}
          onChange={setSubDeptFilter}
          placeholder="Filter by sub dept…"
          className="max-w-[180px]"
        />
      </div>

      {/* Unified sub dept list — sorted critical → watch → healthy */}
      <div className="flex-1 overflow-hidden bg-custom-white rounded-b-xl shadow-sm border border-t-0 border-line_hair flex flex-col">
        {loadingGrades && grades.length === 0 ? (
          <div className="flex-1 flex items-center justify-center gap-2">
            <div className="cc-spinner border-t-brand_navy" />
            <span className="text-[11px] text-content">
              Grading sub departments…
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 px-3 py-1.5 border-b border-line_hair flex-shrink-0">
              <span className="w-2.5 flex-shrink-0" />
              <span className="text-[11.5px] cc-caps flex-1">Sub Dept</span>
              <div data-help="sort" className="flex items-center gap-[14px]">
                <span
                  className="text-[11.5px] cc-caps flex-shrink-0 text-center"
                  style={{ width: 48 }}
                >
                  Trend
                </span>
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

            <div
              data-help="list"
              className="flex-1 overflow-y-auto thin-scrollbar"
            >
              {visibleRows.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-[11px] text-content/95">
                  None this week
                </div>
              ) : (
                visibleRows.map(({ key, grade, tier, name }) => {
                  const isSel = ctx.selectedSubDeptKey === key;
                  const hasLY =
                    (grade.lyMarginPct ?? 0) > 0 || grade.lySales > 0;
                  const hasLW = grade.lwSales > 0;

                  const tyValue =
                    gradingMetric === "margin"
                      ? `${grade.tyMarginPct.toFixed(2)}%`
                      : formatCurrency2(grade.tySales);
                  const lwPct =
                    gradingMetric === "margin"
                      ? grade.lwPtsDelta
                      : grade.vsLWSalesPct;
                  const lyPct =
                    gradingMetric === "margin"
                      ? grade.ptsDelta
                      : grade.vsLYSalesPct;
                  // Null is a department the week cannot be compared for, so
                  // it reads as a dash rather than a number nobody can act on.
                  const fmtDelta = (v: number | null) =>
                    v === null
                      ? "—"
                      : gradingMetric === "margin"
                        ? `${v >= 0 ? "+" : ""}${v.toFixed(2)} pts`
                        : `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
                  const lwDisplay = fmtDelta(lwPct);
                  const lyDisplay = fmtDelta(lyPct);

                  return (
                    <button
                      key={key}
                      onClick={() => handleSubDeptClick(key)}
                      className={`w-full flex items-center gap-2.5 p-3 text-left transition-colors border-l-2 border-b border-b-brand_navy/15 ${
                        isSel
                          ? "cc-row-selected"
                          : "border-transparent hover:bg-fill_soft"
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          tier === "ungraded"
                            ? "bg-ungraded"
                            : severityDotClass[tier]
                        }`}
                        title={
                          tier === "ungraded"
                            ? "Not graded — neither last week nor last year has every day"
                            : undefined
                        }
                      />
                      <span className="text-[13px] font-medium text-content truncate flex-1">
                        {name}
                      </span>
                      <div className="flex items-center gap-[14px]">
                        <div
                          className="flex-shrink-0 flex items-center justify-center"
                          style={{ width: 48 }}
                        >
                          <Sparkline
                            values={
                              grade.tyDaily
                                ? weekDates.map((d) => grade.tyDaily?.[d] ?? 0)
                                : dailySeries(grade.tyWeekOneMargins)
                            }
                            stroke={TIER_STROKE[tier]}
                          />
                        </div>
                        <span
                          className="text-[13px] font-semibold text-content flex-shrink-0 pl-2.5 text-right"
                          style={{ width: 64 }}
                        >
                          {tyValue}
                        </span>
                        <span
                          className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 whitespace-nowrap ${
                            hasLW
                              ? comparisonPillClass(
                                  lwPct,
                                  isCompleteCoverage(
                                    grade.coverage.lwDayCount,
                                    grade.coverage.dayCount,
                                  ),
                                  gradingThreshold,
                                )
                              : "bg-row_stripe text-brand_slate"
                          }`}
                          style={{ minWidth: PCT_COL_W }}
                        >
                          {hasLW ? lwDisplay : "—"}
                        </span>
                        <span
                          className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 whitespace-nowrap ${
                            hasLY
                              ? comparisonPillClass(
                                  lyPct,
                                  isCompleteCoverage(
                                    grade.coverage.lyDayCount,
                                    grade.coverage.dayCount,
                                  ),
                                  gradingThreshold,
                                )
                              : "bg-row_stripe text-brand_slate"
                          }`}
                          style={{ minWidth: PCT_COL_W }}
                        >
                          {hasLY ? lyDisplay : "—"}
                        </span>
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

export default MarginPerfLeftPanel;
