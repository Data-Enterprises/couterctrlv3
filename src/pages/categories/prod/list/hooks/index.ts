// Hooks
import { useMemo } from "react";
import { useTriStateSort } from "../../../../../utils/useTriStateSort";

// Redux
import { CATEGORY_THRESHOLD_DEFAULT } from "../../../../../features/categoriesSlice";

// Utils
import { formatCurrency2, formatBigNumber } from "../../../../../utils";
import { comparisonPillClass, formatPct } from "../../../../../utils/severity";
import { isCompleteCoverage } from "../../../../../utils/grading";
import {
  getTier,
  categoryDelta,
  pctChange,
  sortGraded,
  dotFor,
} from "../../utils";

// Interfaces
import type { ListSortCol } from "../../interfaces";
import type { useCategoriesCtx } from "../../hooks";

/**
 * The category list's rows, graded and filtered, with the store's totals and
 * the uncategorized line. The sort is owned here too, since the visible order
 * depends on it.
 */
export const useCategoryList = (cats: ReturnType<typeof useCategoriesCtx>) => {
  const { sort, handleSort, applySort } = useTriStateSort<ListSortCol>();
  const { rows, metric, threshold, tierFilter, textFilter } = cats;

  // Null threshold means the input is mid-edit; grade against the default
  // rather than 0, which would make every decline critical as you type.
  const activeThreshold = threshold ?? CATEGORY_THRESHOLD_DEFAULT;

  // Same split Sales uses (SalesLedger.tsx:326). Everything that doesn't depend
  // on the threshold — the deltas, the percentages, the formatted strings — is
  // derived once from the data. Dragging the slider then only runs the cheap
  // re-grade below instead of rebuilding all 1100 rows per frame.
  const base = useMemo(
    () =>
      rows.map((r) => {
        const isQty = metric === "qty";
        const lwPct = r.hasLW
          ? pctChange(
              isQty ? r.twQtyForLW : r.twNetForLW,
              isQty ? r.lwQty : r.lwNet,
            )
          : null;
        const lyPct = r.hasLY
          ? pctChange(
              isQty ? r.twQtyForLY : r.twNetForLY,
              isQty ? r.lyQty : r.lyNet,
            )
          : null;
        const f = (n: number) =>
          isQty ? formatBigNumber(n) : formatCurrency2(n);
        return {
          ...r,
          delta: categoryDelta(r, metric),
          lwPct,
          lyPct,
          label: r.description ?? `Category ${r.category}`,
          twText: f(isQty ? r.twQty : r.twNet),
          lwText: r.hasLW ? f(isQty ? r.lwQty : r.lwNet) : "—",
          lyText: r.hasLY ? f(isQty ? r.lyQty : r.lyNet) : "—",
          lwPctText: lwPct === null ? "—" : formatPct(lwPct),
          lyPctText: lyPct === null ? "—" : formatPct(lyPct),
        };
      }),
    [rows, metric],
  );

  // The cheap half. Resolving the pill classes here rather than in the row is
  // what lets CategoryRow's memo work: a row only re-renders when its own grade
  // crosses the threshold, not because the threshold moved at all.
  const graded = useMemo(
    () =>
      base.map((b) => {
        const tier = getTier(b, activeThreshold, metric);
        return {
          ...b,
          tier,
          dotClass: dotFor(tier),
          // Grey when the comparison is missing days — it shows, but it
          // doesn't grade (see utils/grading).
          lwPillClass: comparisonPillClass(
            b.lwPct,
            isCompleteCoverage(b.coverage.lwDayCount, b.coverage.dayCount),
            activeThreshold,
          ),
          lyPillClass: comparisonPillClass(
            b.lyPct,
            isCompleteCoverage(b.coverage.lyDayCount, b.coverage.dayCount),
            activeThreshold,
          ),
        };
      }),
    [base, activeThreshold, metric],
  );

  const counts = useMemo(() => {
    const c = { critical: 0, watch: 0, healthy: 0, ungraded: 0 };
    for (const g of graded) c[g.tier] += 1;
    return c;
  }, [graded]);

  const visible = useMemo(() => {
    const q = textFilter.trim().toLowerCase();
    const filtered = graded.filter((g) => {
      if (tierFilter !== "all" && g.tier !== tierFilter) return false;
      if (!q) return true;
      const label = g.description ?? `category ${g.category}`;
      return label.toLowerCase().includes(q) || String(g.category).includes(q);
    });
    // applySort hands the rows straight back when nothing is sorted, so the
    // grade order stays the default.
    return applySort(sortGraded(filtered, metric), (g, col) =>
      col === "ty"
        ? metric === "qty"
          ? g.twQty
          : g.twNet
        : col === "lw"
          ? g.lwPct
          : g.lyPct,
    );
  }, [graded, tierFilter, textFilter, metric, sort]);

  /** Header aggregates — the whole store's week, and how it moved. */
  const totals = useMemo(() => {
    const tw = graded.reduce(
      (a, g) => a + (metric === "qty" ? g.twQty : g.twNet),
      0,
    );
    const twLW = graded.reduce(
      (a, g) => a + (metric === "qty" ? g.twQtyForLW : g.twNetForLW),
      0,
    );
    const lw = graded.reduce(
      (a, g) => a + (metric === "qty" ? g.lwQty : g.lwNet),
      0,
    );
    const twLY = graded.reduce(
      (a, g) => a + (metric === "qty" ? g.twQtyForLY : g.twNetForLY),
      0,
    );
    const ly = graded.reduce(
      (a, g) => a + (metric === "qty" ? g.lyQty : g.lyNet),
      0,
    );
    return {
      tw,
      lwPct: lw > 0 ? pctChange(twLW, lw) : null,
      lyPct: ly > 0 ? pctChange(twLY, ly) : null,
      // The two sides the percentages were actually taken over. Categories
      // pairs per category per day and drops a category-day with no
      // counterpart from BOTH sides, so these are smaller than `tw` whenever
      // a category traded this week and not in the compared one.
      twForLW: twLW,
      lwPaired: lw,
      twForLY: twLY,
      lyPaired: ly,
    };
  }, [graded, metric]);

  const uncategorized = useMemo(() => {
    const u = graded.filter((g) => g.uncategorized);
    return {
      count: u.length,
      value: u.reduce((a, g) => a + (metric === "qty" ? g.twQty : g.twNet), 0),
    };
  }, [graded, metric]);

  return {
    sort,
    handleSort,
    graded,
    counts,
    visible,
    totals,
    uncategorized,
  };
};
