// Hooks
import { useState } from "react";
import { useAppDispatch, useCanSeeComingSoon } from "../../../../hooks";
import { useCriticalReport } from "../../../../hooks/useCriticalReport";
import { useSubMarginCtx, useSubMarginActions } from "../hooks";
import { useCostGrid, useRightPanelFigures } from "../hooks/rightPanel";

// Utils
import { formatCurrency2 } from "../../../../utils";
import { weekEnding } from "../../../../utils/dates";
import {
  severityHeaderBgClass,
  comparisonPillClass,
} from "../../../../utils/severity";

// Components
import {
  ArrowDownTrayIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/16/solid";
import LoadingIndicator from "../../../../components-dev/loading/LoadingIndicator";
import MarginPerfExportModal from "../export/MarginPerfExportModal";
import MarginPerfItemsTable from "./itemsTable/MarginPerfItemsTable";
import SubDeptCostGrid from "./SubDeptCostGrid";
import MarginPerfDaySidebar from "./MarginPerfDaySidebar";

/** The right panel of Sub Dept Margins for the selected sub dept: a title bar with the item actions and
 *  Export buttons, a TY / vs LW / vs LY figure strip (for the week or the chosen day), the day sidebar, and
 *  the items table or cost grid. Shows a prompt until a sub dept is picked. */
const MarginPerfRightPanel = () => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  // Item Actions is unreleased, so the way in goes with it. A button that
  // navigates somewhere the nav says does not exist is worse than no button.
  const canSeeComingSoon = useCanSeeComingSoon();
  const actions = useSubMarginActions();

  const {
    subDeptName,
    storeName,
    gradingThreshold,
    selectedGrade,
    tier,
    lwComplete,
    lyComplete,
    dateRange,
    kpiTyLabel,
    kpiLwLabel,
    kpiLyLabel,
    tyKpis,
    lwKpis,
    lyKpis,
    noCostCount,
    marginDelta,
    salesDelta,
    lwMarginDelta,
    lwSalesDelta,
    salesKpis,
    criticalItems,
    gradingMetric,
    subDeptGrades,
    loadingGrades,
  } = useRightPanelFigures();

  const [exportOpen, setExportOpen] = useState(false);
  const openCriticalReport = useCriticalReport();
  const { handleNoCostTab, handleCostTab } = useCostGrid();

  if (ctx.selectedSubDeptKey == null) {
    return (
      <div className="flex-1 min-w-0 shadow-lg">
        <div className="cc-panel shadow-sm h-full items-center justify-center gap-2">
          <p className="text-[13px] font-medium text-content">
            Select a sub department
          </p>
          <p className="text-[11px] text-content">
            Choose one from the left panel
          </p>
        </div>
      </div>
    );
  }

  if (!ctx.weekOneMargins.length) {
    return (
      <div className="flex-1 min-w-0 shadow-lg">
        <div className="cc-panel shadow-sm h-full relative">
          <LoadingIndicator message="Loading margins..." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 shadow-lg">
      <div className="cc-panel shadow-sm h-full">
        {/* ── Title bar — tinted to the selected sub dept's tier ── */}
        <div
          className={`relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 flex-shrink-0 ${tier === "ungraded" ? "bg-brand_navy" : severityHeaderBgClass[tier]}`}
        >
          <p className="text-custom-white text-[13px] font-bold leading-tight justify-self-start">
            {subDeptName}
          </p>
          <span className="text-custom-white text-[13px] font-bold justify-self-center">
            Margin Performance{dateRange ? ` · ${dateRange}` : ""}
          </span>
          <div className="flex items-center gap-2 justify-self-end">
            {/* Only offered when there is something to diagnose. A department
                with no critical items would open an empty report, which reads
                as a broken page rather than as good news. */}
            {canSeeComingSoon && criticalItems.length > 0 && (
              <button
                className="text-custom-white transition-colors"
                onClick={() =>
                  openCriticalReport({
                    storeId: ctx.searchValue,
                    items: criticalItems,
                    window: weekEnding(ctx.weekDate ?? ""),
                    // Grading already fetched all three periods for this
                    // department, so the report has nothing left to fetch.
                    rows: selectedGrade
                      ? {
                          ty: selectedGrade.tyWeekOneMargins,
                          lw: selectedGrade.lwWeekOneMargins,
                          ly: selectedGrade.lyWeekOneMargins,
                        }
                      : undefined,
                    sourceLabel: subDeptName,
                    basisLabel: `${criticalItems.length} critical by ${gradingMetric}, ${gradingThreshold}%`,
                  })
                }
                title={`See item actions (${criticalItems.length})`}
              >
                <ClipboardDocumentListIcon className="h-4 w-4" />
              </button>
            )}
            <button
              className="text-custom-white transition-colors"
              onClick={() => setExportOpen(true)}
              title="Export"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── 3-col KPI strip ── */}
        <div className="grid grid-cols-3 divide-x divide-line_hair border-b border-line_hair bg-fill_soft flex-shrink-0">
          {/* TY metric */}
          <div className="px-4 pt-2.5 text-center">
            <div className="text-[10px] cc-caps-strong">
              {gradingMetric === "margin" ? "TY Margin" : "TY Net Sales"}
            </div>
            <div className="text-[10px] font-bold text-content mb-0.5">
              {kpiTyLabel}
            </div>
            <div className="text-[14px] font-bold text-content">
              {salesKpis
                ? formatCurrency2(salesKpis.ty)
                : tyKpis
                  ? gradingMetric === "margin"
                    ? tyKpis.margin
                    : formatCurrency2(tyKpis.sales)
                  : "—"}
            </div>
          </div>

          {/* vs LW */}
          <div className="px-4 pt-2.5 text-center">
            <div className="text-[10px] cc-caps-strong">vs Last Week</div>
            <div className="text-[10px] font-bold text-content mb-0.5">
              {kpiLwLabel}
            </div>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-[14px] font-bold text-content">
                {salesKpis
                  ? formatCurrency2(salesKpis.lw)
                  : lwKpis
                    ? gradingMetric === "margin"
                      ? lwKpis.margin
                      : formatCurrency2(lwKpis.sales)
                    : "—"}
              </span>
              {gradingMetric === "margin" && lwMarginDelta !== null && (
                <span
                  className={`text-[11px] cc-tag ${comparisonPillClass(lwMarginDelta, lwComplete, gradingThreshold)}`}
                >
                  {lwMarginDelta >= 0 ? "+" : ""}
                  {lwMarginDelta.toFixed(2)} pts
                </span>
              )}
              {gradingMetric === "sales" &&
                (salesKpis?.vsLw ?? lwSalesDelta) !== null && (
                  <span
                    className={`text-[11px] cc-tag ${comparisonPillClass((salesKpis?.vsLw ?? lwSalesDelta)!, lwComplete, gradingThreshold)}`}
                  >
                    {(salesKpis?.vsLw ?? lwSalesDelta)! >= 0 ? "+" : ""}
                    {(salesKpis?.vsLw ?? lwSalesDelta)!.toFixed(2)}%
                  </span>
                )}
            </div>
            {!lwComplete && lwKpis && selectedGrade && (
              <div className="text-[10px] font-semibold text-content pt-0.5">
                {selectedGrade.coverage.lwDayCount} of{" "}
                {selectedGrade.coverage.dayCount} days matched
              </div>
            )}
          </div>

          {/* vs LY */}
          <div className="px-4 pt-2.5 text-center">
            <div className="text-[10px] cc-caps-strong">vs Last Year</div>
            <div className="text-[10px] font-bold text-content mb-0.5">
              {kpiLyLabel}
            </div>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-[14px] font-bold text-content">
                {salesKpis
                  ? formatCurrency2(salesKpis.ly)
                  : lyKpis
                    ? gradingMetric === "margin"
                      ? lyKpis.margin
                      : formatCurrency2(lyKpis.sales)
                    : "—"}
              </span>
              {gradingMetric === "margin" && marginDelta !== null && (
                <span
                  className={`text-[11px] cc-tag ${comparisonPillClass(marginDelta, lyComplete, gradingThreshold)}`}
                >
                  {marginDelta >= 0 ? "+" : ""}
                  {marginDelta.toFixed(2)} pts
                </span>
              )}
              {gradingMetric === "sales" &&
                (salesKpis?.vsLy ?? salesDelta) !== null && (
                  <span
                    className={`text-[11px] cc-tag ${comparisonPillClass((salesKpis?.vsLy ?? salesDelta)!, lyComplete, gradingThreshold)}`}
                  >
                    {(salesKpis?.vsLy ?? salesDelta)! >= 0 ? "+" : ""}
                    {(salesKpis?.vsLy ?? salesDelta)!.toFixed(2)}%
                  </span>
                )}
            </div>
            {!lyComplete && lyKpis && selectedGrade && (
              <div className="text-[10px] font-semibold text-content pt-0.5">
                {selectedGrade.coverage.lyDayCount} of{" "}
                {selectedGrade.coverage.dayCount} days matched
              </div>
            )}
          </div>
        </div>

        {/* ── Day sidebar ── */}
        <MarginPerfDaySidebar coverage={selectedGrade?.coverage} />

        {/* ── Tabs ── */}
        <div className="flex items-center border-b border-line_hair px-3 flex-shrink-0">
          <button
            className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
              ctx.subDeptGridView === "item"
                ? "border-brand_navy text-content"
                : "border-transparent text-content"
            }`}
            onClick={() => dispatch(actions.setSubDeptGridView("item"))}
          >
            Items
          </button>
          <button
            className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
              ctx.subDeptGridView === "cost"
                ? "border-brand_navy text-content"
                : "border-transparent text-content"
            }`}
            onClick={handleCostTab}
          >
            Cost
          </button>
          <button
            className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
              ctx.subDeptGridView === "nocost"
                ? "border-brand_danger text-brand_danger"
                : "border-transparent text-content"
            }`}
            onClick={handleNoCostTab}
          >
            No Cost
          </button>
        </div>

        {/* ── Items / Cost / No Cost grid ── */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* The list grades from the department totals; the item rows land
              after it. An empty table here would read as a department with no
              items. */}
          {loadingGrades ? (
            <div className="flex items-center justify-center h-24 text-[11px] text-content">
              Loading this week's items…
            </div>
          ) : ctx.subDeptGridView === "item" ? (
            <MarginPerfItemsTable
              coverage={selectedGrade?.coverage}
              tyMargins={ctx.weekOneMargins}
              lwMargins={ctx.weekTwoMargins}
              lyMargins={ctx.weekOneMarginsLY}
            />
          ) : ctx.subDeptGridView === "nocost" && noCostCount === 0 ? (
            <div className="flex items-center justify-center h-24 text-[11px] text-content">
              No items missing cost data
            </div>
          ) : (
            <SubDeptCostGrid />
          )}
        </div>
      </div>

      {exportOpen && (
        <MarginPerfExportModal
          onClose={() => setExportOpen(false)}
          storeName={storeName}
          subDeptName={subDeptName}
          dateRange={dateRange}
          tyMargins={ctx.weekOneMargins}
          lyMargins={ctx.weekOneMarginsLY}
          threshold={gradingThreshold}
          // The all-departments preset reads item rows straight off the
          // grades, so it costs nothing beyond what grading already fetched.
          subDepts={ctx.subDepts}
          grades={subDeptGrades}
          gradingMetric={gradingMetric}
          loadingGrades={loadingGrades}
        />
      )}
    </div>
  );
};

export default MarginPerfRightPanel;
