// Hooks
import { useEffect, useMemo, useRef } from "react";
import { useAppDispatch, useStoreName } from "../../../../hooks";
import { useSubMarginCtx, useSubMarginActions, useSubMarginState } from ".";

// Utils
import { applyStoreNumberToName } from "../../../../utils/storeIdentity";
import { gpm } from "../../../../functions";
import { calculateCogs, hasNoUsableCost } from "../../../../utils/cogs";
import { setDates, getLYDate } from "../../../../utils/dates";
import { isCompleteCoverage, shiftIso } from "../../../../utils/grading";
import { formatDate } from "../utils/gridColumns";
import { matchedCounterpartRows, matchedTyRows, getTier } from "../utils";
import { collectGradedItems } from "../utils/gradedItems";
import { buildCostRows } from "../utils/costRows";

// Interfaces
import type { SubDeptMargin } from "../../../../interfaces";

/**
 * The right panel's figures for the open sub department: its store and dates,
 * this week against last week and last year (or one day against the same
 * weekdays), the grade and tier, items with no cost, and its critical items.
 */
export const useRightPanelFigures = () => {
  const ctx = useSubMarginCtx();

  const {
    gradingMetric,
    subDeptGrades,
    loadingGrades,
    availableStoreNumbers,
    selectedStoreNumber,
    gradingThreshold: rawGradingThreshold,
  } = useSubMarginState();
  const subDeptName =
    ctx.subDepts.find((s) => s.key === ctx.selectedSubDeptKey)?.desc ?? "";
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
  const gradingThresholdRef = useRef<number>(rawGradingThreshold ?? 9);
  if (rawGradingThreshold != null)
    gradingThresholdRef.current = rawGradingThreshold;
  const gradingThreshold = gradingThresholdRef.current;

  const selectedGrade =
    ctx.selectedSubDeptKey != null
      ? subDeptGrades[ctx.selectedSubDeptKey]
      : undefined;
  const tier = selectedGrade
    ? getTier(selectedGrade, gradingThreshold, gradingMetric)
    : "healthy";
  // A selected single day is one of one — never partial. The whole week is
  // partial when the store is missing matched days.
  const lwComplete =
    !selectedGrade ||
    !!ctx.selectedWeekDay ||
    isCompleteCoverage(
      selectedGrade.coverage.lwDayCount,
      selectedGrade.coverage.dayCount,
    );
  const lyComplete =
    !selectedGrade ||
    !!ctx.selectedWeekDay ||
    isCompleteCoverage(
      selectedGrade.coverage.lyDayCount,
      selectedGrade.coverage.dayCount,
    );

  const periodEnd = ctx.weekDate
    ? formatDate(setDates(new Date(ctx.weekDate), 0))
    : "";
  const periodStart = ctx.weekDate
    ? formatDate(setDates(new Date(ctx.weekDate), 6))
    : "";
  const dateRange =
    periodStart && periodEnd ? `${periodStart} – ${periodEnd}` : "";

  const lyPeriodEnd = ctx.weekDate ? formatDate(getLYDate(ctx.weekDate)) : "";
  const lyPeriodStart = ctx.weekDate
    ? formatDate(getLYDate(setDates(new Date(ctx.weekDate), 6)))
    : "";
  const lyDateRange =
    lyPeriodStart && lyPeriodEnd ? `${lyPeriodStart} – ${lyPeriodEnd}` : "";

  const lwPeriodEnd = ctx.weekDate
    ? formatDate(setDates(new Date(ctx.weekDate), 7))
    : "";
  const lwPeriodStart = ctx.weekDate
    ? formatDate(setDates(new Date(ctx.weekDate), 13))
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
    ? shiftIso(ctx.selectedWeekDay, -7)
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
        : computeKpis(
            matchedTyRows(ctx.weekOneMargins, ctx.weekTwoMargins, "lw"),
          ),
    [selectedLwDate, tyKpis, ctx.weekOneMargins, ctx.weekTwoMargins],
  );
  const tyForLyKpis = useMemo(
    () =>
      selectedLyDate
        ? tyKpis
        : computeKpis(
            matchedTyRows(ctx.weekOneMargins, ctx.weekOneMarginsLY, "ly"),
          ),
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

  /**
   * The open department's critical items, selected exactly the way the UPC List
   * export selects them — same collector, so the button and the file can never
   * disagree about what "critical" meant.
   *
   * Computed rather than fetched: grading already holds every department's item
   * rows, so this costs nothing until the button is pressed.
   */
  const criticalItems = useMemo(() => {
    const dept = ctx.subDepts.find((s) => s.key === ctx.selectedSubDeptKey);
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
    ctx.selectedSubDeptKey,
    subDeptGrades,
    gradingThreshold,
    gradingMetric,
  ]);

  return {
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
  };
};

/**
 * The cost and no-cost grids: their rows, rolled up per product for the day
 * in view, built when a tab opens and rebuilt when the day changes under it.
 */
export const useCostGrid = () => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();

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

  return { handleNoCostTab, handleCostTab };
};
