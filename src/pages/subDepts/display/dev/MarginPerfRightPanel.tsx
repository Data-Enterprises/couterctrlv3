import { useEffect, useMemo, useRef, useState } from "react";
import {
  useAppDispatch,
  useAppSelector,
  useCanSeeComingSoon,
  useStoreName,
} from "../../../../hooks";
import { useSubMarginCtx } from "../../hooks";
import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import { formatDate } from "../widgets";
import { formatCurrency2, addDays } from "../../../../utils";
import { applyStoreNumberToName } from "../../../../utils/storeIdentity";
import { gpm } from "../../../../functions";
import {
  calculateCogs,
  hasNoUsableCost,
  matchedCounterpartRows,
  matchedTyRows,
  setDates,
  getLYDate,
  getTier,
} from "../..";
import {
  ArrowDownTrayIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/16/solid";
import { collectGradedItems } from "./gradedItems";
import { useCriticalReport } from "../../../itemReport/criticalHandoff";
import { weekEnding } from "../../../itemReport/itemReportData";
import type { SubDeptCost, SubDeptMargin } from "../../../../interfaces";

import LoadingIndicator from "../../../../components/loading/LoadingIndicator";
import MarginPerfItemsTable from "./MarginPerfItemsTable";
import SubDeptCostGrid from "../widgets/SubDeptCostGrid";
import MarginPerfExportModal from "./MarginPerfExportModal";
import MarginPerfDaySidebar from "./MarginPerfDaySidebar";
import {
  severityHeaderBgClass,
  comparisonPillClass,
} from "../../../../utils/severity";
import { isCompleteCoverage } from "../../../../utils/grading";

const MarginPerfRightPanel = () => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  // Item Actions is unreleased, so the way in goes with it. A button that
  // navigates somewhere the nav says does not exist is worse than no button.
  const canSeeComingSoon = useCanSeeComingSoon();
  const actions = useSubMarginActions();

  const gradingMetric = useAppSelector((s) => s.subMargin.gradingMetric);
  const subDeptGrades = useAppSelector((s) => s.subMargin.subDeptGrades);
  const loadingGrades = useAppSelector((s) => s.subMargin.loadingGrades);
  const subDeptName =
    ctx.subDepts.find((s) => s.id === ctx.selectedSubDeptId)?.desc ?? "";
  const availableStoreNumbers = useAppSelector(
    (s) => s.subMargin.availableStoreNumbers,
  );
  const selectedStoreNumber = useAppSelector(
    (s) => s.subMargin.selectedStoreNumber,
  );
  // Matches the left panel: for co-located stores the resolved name embeds the
  // sibling's number, so rewrite it to the location currently on screen.
  const resolvedStoreName = useStoreName(ctx.searchValue);
  const storeName = selectedStoreNumber
    ? applyStoreNumberToName(
        resolvedStoreName,
        selectedStoreNumber,
        availableStoreNumbers,
      )
    : resolvedStoreName;

  // Grading should never move rows around on its own when the threshold
  // input is cleared — keep grading against the last valid amount so
  // severity/sort stays exactly where it was until a new number is typed.
  const rawGradingThreshold = useAppSelector(
    (s) => s.subMargin.gradingThreshold,
  );
  const gradingThresholdRef = useRef<number>(rawGradingThreshold ?? 9);
  if (rawGradingThreshold != null)
    gradingThresholdRef.current = rawGradingThreshold;
  const gradingThreshold = gradingThresholdRef.current;

  const selectedGrade =
    ctx.selectedSubDeptId != null
      ? subDeptGrades[ctx.selectedSubDeptId]
      : undefined;
  const tier = selectedGrade
    ? getTier(selectedGrade, gradingThreshold, gradingMetric)
    : "healthy";
  // A selected single day is one of one — never partial. The whole week is
  // partial when the store is missing matched days.
  const lwComplete =
    !selectedGrade ||
    !!ctx.selectedWeekDay ||
    isCompleteCoverage(selectedGrade.coverage.lwDayCount, selectedGrade.coverage.dayCount);
  const lyComplete =
    !selectedGrade ||
    !!ctx.selectedWeekDay ||
    isCompleteCoverage(selectedGrade.coverage.lyDayCount, selectedGrade.coverage.dayCount);

  const periodEnd = ctx.singleDate
    ? formatDate(setDates(new Date(ctx.singleDate), 0))
    : "";
  const periodStart = ctx.singleDate
    ? formatDate(setDates(new Date(ctx.singleDate), 6))
    : "";
  const dateRange =
    periodStart && periodEnd ? `${periodStart} – ${periodEnd}` : "";

  const lyPeriodEnd = ctx.singleDate
    ? formatDate(getLYDate(ctx.singleDate))
    : "";
  const lyPeriodStart = ctx.singleDate
    ? formatDate(getLYDate(setDates(new Date(ctx.singleDate), 6)))
    : "";
  const lyDateRange =
    lyPeriodStart && lyPeriodEnd ? `${lyPeriodStart} – ${lyPeriodEnd}` : "";

  const lwPeriodEnd = ctx.singleDate
    ? formatDate(setDates(new Date(ctx.singleDate), 7))
    : "";
  const lwPeriodStart = ctx.singleDate
    ? formatDate(setDates(new Date(ctx.singleDate), 13))
    : "";
  const lwDateRange =
    lwPeriodStart && lwPeriodEnd ? `${lwPeriodStart} – ${lwPeriodEnd}` : "";

  // When a single day is selected in the day sidebar, the KPI strip scopes
  // down to that day (TY the day itself, LW/LY that day's mapped date,
  // holiday- and leap-year-aware for LY via getLYDate) instead of the week.
  const byDate = (src: SubDeptMargin[], dateStr: string) =>
    src.filter((m) => m.sale_date.split("T")[0] === dateStr);
  const fmtDayLabel = (iso: string) =>
    new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  const selectedLwDate = ctx.selectedWeekDay
    ? addDays(ctx.selectedWeekDay, -7).toISOString().split("T")[0]
    : null;
  const selectedLyDate = ctx.selectedWeekDay
    ? getLYDate(ctx.selectedWeekDay)
    : null;

  const kpiTyLabel = ctx.selectedWeekDay
    ? fmtDayLabel(ctx.selectedWeekDay)
    : dateRange;
  const kpiLwLabel = selectedLwDate ? fmtDayLabel(selectedLwDate) : lwDateRange;
  const kpiLyLabel = selectedLyDate ? fmtDayLabel(selectedLyDate) : lyDateRange;

  const computeKpis = (src: typeof ctx.weekOneMargins) => {
    if (!src.length) return null;
    const sales = src.reduce(
      (acc, m) => acc + (m.total_sales - m.total_tax),
      0,
    );
    const cogsTotal = src.reduce(
      (acc, m) =>
        acc + calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight),
      0,
    );
    const marginPct = sales > 0 ? ((sales - cogsTotal) / sales) * 100 : 0;
    return {
      sales,
      cogs: cogsTotal,
      margin: gpm(sales, cogsTotal),
      rawMargin: marginPct,
    };
  };

  const tyKpis = useMemo(() => {
    const src = ctx.selectedWeekDay
      ? byDate(ctx.weekOneMargins, ctx.selectedWeekDay)
      : ctx.weekOneMargins;
    return computeKpis(src);
  }, [ctx.selectedWeekDay, ctx.weekOneMargins]);

  // Whole-week LW/LY are scoped to the days that actually pair with a TY day.
  // Without this the panel summed a partial current week against a full prior
  // week — the left-hand grades are day-matched, so the two disagreed.
  // A single selected day is already matched by definition.
  const lwKpis = useMemo(() => {
    const src = selectedLwDate
      ? byDate(ctx.weekTwoMargins, selectedLwDate)
      : matchedCounterpartRows(ctx.weekOneMargins, ctx.weekTwoMargins, "lw");
    return computeKpis(src);
  }, [selectedLwDate, ctx.weekTwoMargins, ctx.weekOneMargins]);

  const lyKpis = useMemo(() => {
    const src = selectedLyDate
      ? byDate(ctx.weekOneMarginsLY, selectedLyDate)
      : matchedCounterpartRows(ctx.weekOneMargins, ctx.weekOneMarginsLY, "ly");
    return computeKpis(src);
  }, [selectedLyDate, ctx.weekOneMarginsLY, ctx.weekOneMargins]);

  const noCostCount = useMemo(() => {
    const seen = new Set<string>();
    let count = 0;
    for (const m of ctx.weekOneMargins) {
      if (!seen.has(m.product_code)) {
        seen.add(m.product_code);
        if (hasNoUsableCost(m)) count++;
      }
    }
    return count;
  }, [ctx.weekOneMargins]);

  // The TY side of each comparison, over only the days that matched it — the
  // same subtotal the list grades on. The TY tile itself stays the whole week.
  const tyForLwKpis = useMemo(
    () =>
      selectedLwDate
        ? tyKpis
        : computeKpis(matchedTyRows(ctx.weekOneMargins, ctx.weekTwoMargins, "lw")),
    [selectedLwDate, tyKpis, ctx.weekOneMargins, ctx.weekTwoMargins],
  );
  const tyForLyKpis = useMemo(
    () =>
      selectedLyDate
        ? tyKpis
        : computeKpis(matchedTyRows(ctx.weekOneMargins, ctx.weekOneMarginsLY, "ly")),
    [selectedLyDate, tyKpis, ctx.weekOneMargins, ctx.weekOneMarginsLY],
  );

  const marginDelta =
    tyForLyKpis && lyKpis ? tyForLyKpis.rawMargin - lyKpis.rawMargin : null;
  const salesDelta =
    tyForLyKpis && lyKpis && lyKpis.sales > 0
      ? ((tyForLyKpis.sales - lyKpis.sales) / Math.abs(lyKpis.sales)) * 100
      : null;
  const lwMarginDelta =
    tyForLwKpis && lwKpis ? tyForLwKpis.rawMargin - lwKpis.rawMargin : null;
  const lwSalesDelta =
    tyForLwKpis && lwKpis && lwKpis.sales > 0
      ? ((tyForLwKpis.sales - lwKpis.sales) / Math.abs(lwKpis.sales)) * 100
      : null;

  // Sales-metric KPIs read the grade, which is built from sub_sales — the
  // endpoint Sales itself uses and the one with the correct ring filter — so
  // these figures match the Sales page exactly. Margin-metric KPIs keep using
  // the subs/subs-derived values above, since that's the only source with cost.
  // Only whole-period: a selected single day has no sub_sales breakdown here,
  // so day view still falls back to the subs-derived numbers.
  const salesKpis =
    gradingMetric === "sales" && selectedGrade && !ctx.selectedWeekDay
      ? {
          ty: selectedGrade.tySales,
          lw: selectedGrade.lwSales,
          ly: selectedGrade.lySales,
          vsLw: selectedGrade.lwSales > 0 ? selectedGrade.vsLWSalesPct : null,
          vsLy: selectedGrade.lySales > 0 ? selectedGrade.vsLYSalesPct : null,
        }
      : null;

  const [exportOpen, setExportOpen] = useState(false);
  const openCriticalReport = useCriticalReport();

  /**
   * The open department's critical items, selected exactly the way the UPC List
   * export selects them — same collector, so the button and the file can never
   * disagree about what "critical" meant.
   *
   * Computed rather than fetched: grading already holds every department's item
   * rows, so this costs nothing until the button is pressed.
   */
  const criticalItems = useMemo(() => {
    const dept = ctx.subDepts.find((s) => s.id === ctx.selectedSubDeptId);
    if (!dept) return [];
    return collectGradedItems(
      [dept],
      subDeptGrades,
      gradingThreshold,
      gradingMetric,
      new Set(["critical"] as const),
    ).map((g) => ({ productCode: g.row.productCode, dept: g.dept }));
  }, [
    ctx.subDepts,
    ctx.selectedSubDeptId,
    subDeptGrades,
    gradingThreshold,
    gradingMetric,
  ]);

  /**
   * Roll the margin rows up into one line per product, scoped to the selected
   * day.
   *
   * The day scoping has to happen *here*, before the rollup, and this is the
   * whole point of the function. The rows arrive one per product per day, so a
   * product sold all week contributes seven of them. Aggregating first and
   * filtering afterwards — which is what this did — produced a row carrying a
   * week of `qty` and `total_cost` but only the first day's `sale_date`, and
   * `SubDeptCostGrid` then matched that single date against the day strip. Two
   * failures at once: the days a product did not happen to sell first showed
   * nothing at all (Fri, Sun and Mon went completely empty on a week where all
   * three had sales), and the day that did match printed week totals — BNLS
   * CHICKEN THIGHS read 160 / $688.19 under Wednesday against a real 12 /
   * $54.50.
   *
   * `day` is "" for All Week, which keeps every row and rolls the full week up
   * exactly as before.
   */
  const buildCostRows = (
    margins: SubDeptMargin[],
    day: string,
    withCogs: boolean,
  ): SubDeptCost[] => {
    const fmtDate = (dte: string) => dte.split("T")[0];
    const scoped = day
      ? margins.filter((m) => fmtDate(m.sale_date) === day)
      : margins;

    // Keyed rather than `.find` on every row: this runs over a store week of
    // item rows, and the linear scan made it quadratic.
    const byProduct = new Map<string, SubDeptCost>();
    for (const curr of scoped) {
      const cogs = withCogs
        ? calculateCogs(
            curr.net_cost,
            curr.cost,
            curr.case_size,
            curr.qty,
            curr.weight,
          )
        : 0;
      const found = byProduct.get(curr.product_code);
      if (!found) {
        byProduct.set(curr.product_code, {
          date: fmtDate(curr.sale_date),
          product_code: curr.product_code,
          description: curr.product_description,
          calculated_cost: curr.calculated_cost,
          cost: curr.cost,
          qty: curr.qty,
          weight: curr.weight,
          total_cost: cogs,
        });
      } else {
        found.qty += curr.qty;
        found.weight = (found.weight ?? 0) + curr.weight;
        found.total_cost += cogs;
      }
    }
    return [...byProduct.values()];
  };

  const handleNoCostTab = () => {
    dispatch(
      actions.setSubDeptCost(
        buildCostRows(
          ctx.weekOneMargins.filter((m) => hasNoUsableCost(m)),
          ctx.selectedWeekDay,
          false,
        ),
      ),
    );
    dispatch(actions.setSubDeptGridView("nocost"));
  };

  const handleCostTab = () => {
    dispatch(
      actions.setSubDeptCost(
        buildCostRows(ctx.weekOneMargins, ctx.selectedWeekDay, true),
      ),
    );
    dispatch(actions.setSubDeptGridView("cost"));
  };

  /**
   * Rebuild when the day changes under an already-open grid.
   *
   * The two handlers above only fire on a tab click, so before this the rows
   * were whatever the day was when the tab was opened — clicking through the
   * day strip re-ran the grid's date filter over stale rows and never
   * recomputed them.
   */
  useEffect(() => {
    if (ctx.subDeptGridView === "cost") {
      dispatch(
        actions.setSubDeptCost(
          buildCostRows(ctx.weekOneMargins, ctx.selectedWeekDay, true),
        ),
      );
    } else if (ctx.subDeptGridView === "nocost") {
      dispatch(
        actions.setSubDeptCost(
          buildCostRows(
            ctx.weekOneMargins.filter((m) => hasNoUsableCost(m)),
            ctx.selectedWeekDay,
            false,
          ),
        ),
      );
    }
  }, [ctx.selectedWeekDay, ctx.weekOneMargins, ctx.subDeptGridView]);

  if (ctx.selectedSubDeptId == null) {
    return (
      <div className="flex-1 min-w-0 shadow-lg">
        <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full items-center justify-center gap-2">
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
        <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full relative">
          <LoadingIndicator message="Loading margins..." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 shadow-lg">
      <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
        {/* ── Title bar — tinted to the selected sub dept's tier ── */}
        <div
          className={`relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 flex-shrink-0 ${tier === "ungraded" ? "bg-[#1e2a4a]" : severityHeaderBgClass[tier]}`}
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
                    window: weekEnding(ctx.singleDate ?? ""),
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
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          {/* TY metric */}
          <div className="px-4 pt-2.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-content">
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
            <div className="text-[10px] font-bold uppercase tracking-wide text-content">
              vs Last Week
            </div>
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
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${comparisonPillClass(lwMarginDelta, lwComplete, gradingThreshold)}`}
                >
                  {lwMarginDelta >= 0 ? "+" : ""}
                  {lwMarginDelta.toFixed(2)} pts
                </span>
              )}
              {gradingMetric === "sales" &&
                (salesKpis?.vsLw ?? lwSalesDelta) !== null && (
                  <span
                    className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${comparisonPillClass((salesKpis?.vsLw ?? lwSalesDelta)!, lwComplete, gradingThreshold)}`}
                  >
                    {(salesKpis?.vsLw ?? lwSalesDelta)! >= 0 ? "+" : ""}
                    {(salesKpis?.vsLw ?? lwSalesDelta)!.toFixed(2)}%
                  </span>
                )}
            </div>
          </div>

          {/* vs LY */}
          <div className="px-4 pt-2.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-content">
              vs Last Year
            </div>
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
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${comparisonPillClass(marginDelta, lyComplete, gradingThreshold)}`}
                >
                  {marginDelta >= 0 ? "+" : ""}
                  {marginDelta.toFixed(2)} pts
                </span>
              )}
              {gradingMetric === "sales" &&
                (salesKpis?.vsLy ?? salesDelta) !== null && (
                  <span
                    className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${comparisonPillClass((salesKpis?.vsLy ?? salesDelta)!, lyComplete, gradingThreshold)}`}
                  >
                    {(salesKpis?.vsLy ?? salesDelta)! >= 0 ? "+" : ""}
                    {(salesKpis?.vsLy ?? salesDelta)!.toFixed(2)}%
                  </span>
                )}
            </div>
          </div>
        </div>

        {/* ── Day sidebar ── */}
        <MarginPerfDaySidebar coverage={selectedGrade?.coverage} />

        {/* ── Tabs ── */}
        <div className="flex items-center border-b border-gray-100 px-3 flex-shrink-0">
          <button
            className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
              ctx.subDeptGridView === "item"
                ? "border-[#1e2a4a] text-content"
                : "border-transparent text-content"
            }`}
            onClick={() => dispatch(actions.setSubDeptGridView("item"))}
          >
            Items
          </button>
          <button
            className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
              ctx.subDeptGridView === "cost"
                ? "border-[#1e2a4a] text-content"
                : "border-transparent text-content"
            }`}
            onClick={handleCostTab}
          >
            Cost
          </button>
          <button
            className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
              ctx.subDeptGridView === "nocost"
                ? "border-red-400 text-red-700"
                : "border-transparent text-content"
            }`}
            onClick={handleNoCostTab}
          >
            No Cost
          </button>
        </div>

        {/* ── Items / Cost / No Cost grid ── */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {ctx.subDeptGridView === "item" ? (
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
