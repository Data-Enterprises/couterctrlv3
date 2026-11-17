// Hooks
import { useRef } from "react";
import { useSubMarginCtx, useSubMarginState } from ".";

// Utils
import { countedRows } from "../../../../utils/hashSubs";
import { storeMarginDelta } from "../../../../utils/storeMarginDelta";
import {
  applyStoreNumberToName,
  combinedStoreName,
} from "../../../../utils/storeIdentity";
import { setDates } from "../../../../utils/dates";
import { formatDate } from "../utils/gridColumns";
import { getTier, getGradeDelta, storeMarginPctOf, SEV_RANK } from "../utils";

// Interfaces
import type { SubDeptMargin } from "../../../../interfaces";
import type {
  MarginTier,
  SubDeptGrade,
} from "../../../../features/dev/devSubMarginSlice";
import type { SevFilter } from "../../../../utils/severity";

/**
 * The left panel's figures: the store's name and week, its margin and sales
 * against last week and last year, the severity counts, the threshold, and
 * the sub departments the severity and text filters leave, worst first.
 */
export const useLeftPanelFigures = (
  sevFilter: SevFilter,
  subDeptFilter: string,
) => {
  const ctx = useSubMarginCtx();

  const {
    subDeptGrades,
    gradingThreshold: rawGradingThreshold,
    gradingMetric,
    loadingGrades,
    storeSalesTotals,
    availableStoreNumbers,
    selectedStoreNumber,
  } = useSubMarginState();

  // Grading should never move sub depts around on its own when the threshold
  // input is cleared — keep grading against the last valid amount so tier
  // placement stays exactly where it was until a new number is typed.
  const gradingThresholdRef = useRef<number>(rawGradingThreshold ?? 9);
  if (rawGradingThreshold != null)
    gradingThresholdRef.current = rawGradingThreshold;
  const gradingThreshold = gradingThresholdRef.current;

  // Co-located stores (one storeid, two locations) resolve to a single
  // assignedStores record, so the name embeds only one of the two numbers —
  // rewrite it to whichever location is on screen. Same helper Sales uses, so
  // both pages label these stores identically.
  const rawStoreName =
    ctx.assignedStores.find((s) => s.storeid === ctx.searchValue)?.store_name ??
    "";
  const storeName = selectedStoreNumber
    ? applyStoreNumberToName(
        rawStoreName,
        selectedStoreNumber,
        availableStoreNumbers,
      )
    : // The combined tab is both locations, so it says both. The stored name
      // carries one of the two numbers and would otherwise head the pair's
      // total with one store's number.
      combinedStoreName(rawStoreName, availableStoreNumbers);

  const periodEnd = ctx.weekDate
    ? formatDate(setDates(new Date(ctx.weekDate), 0))
    : "";
  const periodStart = ctx.weekDate
    ? formatDate(setDates(new Date(ctx.weekDate), 6))
    : "";
  const dateRange =
    periodStart && periodEnd ? `${periodStart} – ${periodEnd}` : "";

  // Oldest → newest, so the sparkline reads left-to-right chronologically.
  const weekDates = ctx.weekDate
    ? Array.from({ length: 7 }, (_, i) =>
        setDates(new Date(ctx.weekDate!), 6 - i),
      )
    : [];

  // Each grade already carries its own week's raw line items (tyWeekOneMargins)
  // from the per-sub-dept fetch — state.subMargin.margins itself is never
  // populated in dev mode (only the legacy page's fetch dispatches setMargins),
  // so that flat array can't be used as a shared lookup here.
  const dailySeries = (margins: SubDeptMargin[]) => {
    const byDay = new Map<string, number>();
    for (const m of margins) {
      const day = m.sale_date.split("T")[0];
      byDay.set(day, (byDay.get(day) ?? 0) + (m.total_sales - m.total_tax));
    }
    return weekDates.map((d) => byDay.get(d) ?? 0);
  };

  const grades = Object.entries(subDeptGrades).map(([key, grade]) => ({
    key,
    grade,
    tier: getTier(grade, gradingThreshold, gradingMetric),
  }));

  // Store-level, so every department grade carries the same coverage.
  const headerCov = grades[0]?.grade.coverage ?? {
    dayCount: 0,
    lwDayCount: 0,
    lyDayCount: 0,
  };

  const criticalCount = grades.filter((g) => g.tier === "critical").length;
  const watchCount = grades.filter((g) => g.tier === "watch").length;
  const healthyCount = grades.filter((g) => g.tier === "healthy").length;

  /**
   * The store's margin and its two deltas, WEIGHTED -- dollars over dollars.
   *
   * This averaged the departments' percentages, which gives floral the same
   * vote as grocery and read about five points high on a real store-week.
   * Tommy's test run caught it by loading this screen and Vendors for the
   * same store-week and finding 31.91% against 27.04%: both read the same
   * `subs/subs` rows, so one had to be wrong, and it was this one. The rule
   * lives in the page helpers now, where it is under test.
   */
  /**
   * The store header counts what the store counts.
   *
   * Fuel, lottery and cash accounts are in `subs/subs` on purpose -- the
   * list below should show a store its own fuel -- and `sales/weekly` leaves
   * them out. This header sits beside those store figures, so a margin built
   * over every department describes a different store from the one named
   * above it. The LIST is untouched: a department is still listed, graded and
   * drillable, it just does not move the store's own number.
   */
  const counted = grades.filter(
    (g) => countedRows(g.grade.tyWeekOneMargins).length > 0,
  );
  const dollars = counted.map((g) => g.grade.dollars);
  /**
   * Every row the store rang, for the header's own day matching.
   *
   * The deltas below used to sum each DEPARTMENT's matched days. Vendors sums
   * each VENDOR's. A Tuesday one vendor missed is still a Tuesday its
   * department worked, so the two headers landed 0.03 points apart on an
   * identical week. The store figure matches days once, over everything.
   */
  const storeRows = {
    tw: countedRows(grades.flatMap((g) => g.grade.tyWeekOneMargins)),
    lw: countedRows(grades.flatMap((g) => g.grade.lwWeekOneMargins)),
    ly: countedRows(grades.flatMap((g) => g.grade.lyWeekOneMargins)),
  };
  const storeMarginPct = storeMarginPctOf(dollars);
  const storeLyDelta = storeMarginDelta(storeRows.tw, storeRows.ly, "ly");
  // Store-level figures come from sales/weekly (day-matched), matching the
  // Sales page header exactly. Summing the sub-dept grades is a different
  // quantity — it also compared a partial TY week against a full LW one — so
  // it's only the fallback if the weekly fetch didn't land.
  const totalTySales =
    storeSalesTotals?.tySales ??
    grades.reduce((acc, g) => acc + g.grade.tySales, 0);
  const totalLySales =
    storeSalesTotals?.lySales ??
    grades.reduce((acc, g) => acc + g.grade.lySales, 0);
  const totalLwSales =
    storeSalesTotals?.lwSales ??
    grades.reduce((acc, g) => acc + g.grade.lwSales, 0);
  const vsLYSalesPct =
    storeSalesTotals && storeSalesTotals.lySales > 0
      ? storeSalesTotals.vsLYSalesPct
      : totalLySales > 0
        ? ((totalTySales - totalLySales) / totalLySales) * 100
        : null;
  const vsLWSalesPct =
    storeSalesTotals && storeSalesTotals.lwSales > 0
      ? storeSalesTotals.vsLWSalesPct
      : totalLwSales > 0
        ? ((totalTySales - totalLwSales) / totalLwSales) * 100
        : null;
  const storeLwDelta = storeMarginDelta(storeRows.tw, storeRows.lw, "lw");

  const threshValue =
    rawGradingThreshold === null
      ? null
      : { op: "gt" as const, amount: rawGradingThreshold };

  const rows = grades
    .map(({ key, grade, tier }) => {
      const sd = ctx.subDepts.find((s) => s.key === key);
      if (!sd) return null;
      return { id: sd.id, key, grade, tier, name: sd.desc };
    })
    .filter(
      (
        r,
      ): r is {
        id: number;
        key: string;
        grade: SubDeptGrade;
        tier: MarginTier;
        name: string;
      } => r !== null,
    );

  const sevFilteredRows =
    sevFilter === "all" ? rows : rows.filter((r) => r.tier === sevFilter);
  const textFilteredRows = subDeptFilter
    ? sevFilteredRows.filter((r) =>
        r.name.toLowerCase().includes(subDeptFilter.toLowerCase()),
      )
    : sevFilteredRows;
  // Severity rank, then worst-performing first — the same ordering Sales uses
  // for its sub-dept list. Without the second comparator this fell back to
  // sub_department id inside each tier, so the two pages listed the same
  // departments in different orders and looked like they disagreed.
  const gradeOrdered = [...textFilteredRows].sort((a, b) => {
    const rankDiff = SEV_RANK[a.tier] - SEV_RANK[b.tier];
    if (rankDiff !== 0) return rankDiff;
    const ad = getGradeDelta(a.grade, gradingMetric);
    const bd = getGradeDelta(b.grade, gradingMetric);
    // Ungraded rows have nothing to rank by; biggest department first.
    if (ad === null || bd === null) return b.grade.tySales - a.grade.tySales;
    return ad - bd;
  });

  return {
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
  };
};
