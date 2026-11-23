// Hooks
import { useMemo } from "react";
import { useTriStateSort } from "../../../../utils/useTriStateSort";
import { useVendorsCtx } from ".";

// Redux
import { VENDOR_THRESHOLD_DEFAULT } from "../../../../features/vendorsSlice";

// Utils
import { countedRows } from "../../../../utils/hashSubs";
import { storeMarginDelta } from "../../../../utils/storeMarginDelta";
import {
  applyStoreNumberToName,
  combinedStoreName,
} from "../../../../utils/storeIdentity";
import { formatCurrency2, formatCurrencyCompact } from "../../../../utils";
import { fmtCompactRange } from "../../../../utils/dateLabels";
import { comparisonPillClass } from "../../../../utils/severity";
import {
  pctChange,
  sortGraded,
  isCompleteCoverage,
} from "../../../../utils/grading";
import {
  getVendorTier,
  vendorDelta,
  marginPct,
  fmtDelta,
  dotFor,
} from "../utils";

// Interfaces
import type { ThresholdValue } from "../../../../interfaces";
import type { ListSortCol } from "../interfaces";

/**
 * The vendor list's figures: each vendor graded against the threshold, the
 * tier counts, the rows the tier and text filters leave, the store's totals,
 * the vendors with no vendor id, and the header's labels.
 */
export const useVendorListFigures = () => {
  const vend = useVendorsCtx();
  const { sort, handleSort, applySort } = useTriStateSort<ListSortCol>();
  const { rows, metric, threshold, tierFilter, textFilter, selectedVendor } =
    vend;

  /**
   * The name says which location is on screen.
   *
   * `storeName` is resolved from the assignedStores record, which is keyed on
   * storeid, so a co-located pair embeds only one of its two numbers -- the
   * tabs would move every figure on the page while the header still named the
   * other store. Same helper Sales and Sub Dept Margins use, so all three
   * label these stores identically.
   */
  const locationName = vend.selectedStoreNumber
    ? applyStoreNumberToName(
        vend.storeName,
        vend.selectedStoreNumber,
        vend.availableStoreNumbers,
      )
    : // No location picked is the combined tab, which is both of them. Falling
      // through to the stored name put one store's number over a figure that is
      // the pair's -- 369 $303.2K, 370 $121.2K, Both $424.4K under "369".
      combinedStoreName(vend.storeName, vend.availableStoreNumbers);

  // Null threshold means the input is mid-edit; grade against the default
  // rather than 0, which would make every decline critical as you type.
  const activeThreshold = threshold ?? VENDOR_THRESHOLD_DEFAULT;

  // The expensive half, and the half that doesn't depend on the threshold.
  // Dragging the slider then only runs the cheap re-grade below.
  const base = useMemo(
    () =>
      rows.map((r) => {
        const isMargin = metric === "margin";
        // Both already day-matched upstream — the points deltas come from the
        // matched subtotals, not from the full week.
        const lwPct = r.hasLW
          ? isMargin
            ? r.lwPtsDelta
            : pctChange(r.twNetForLW, r.lwNet)
          : null;
        const lyPct = r.hasLY
          ? isMargin
            ? r.lyPtsDelta
            : pctChange(r.twNetForLY, r.lyNet)
          : null;
        const pct = (n: number) => `${n.toFixed(2)}%`;
        // A period with no sales has no margin to show. Zero would read as a
        // week sold at cost.
        const pctOrDash = (n: number | null) => (n === null ? "—" : pct(n));
        return {
          ...r,
          delta: vendorDelta(r, metric),
          lwPct,
          lyPct,
          twText: isMargin ? pct(r.tyMarginPct) : formatCurrency2(r.twNet),
          lwText: r.hasLW
            ? isMargin
              ? pctOrDash(r.lwMarginPct)
              : formatCurrency2(r.lwNet)
            : "—",
          lyText: r.hasLY
            ? isMargin
              ? pctOrDash(r.lyMarginPct)
              : formatCurrency2(r.lyNet)
            : "—",
          lwPctText: fmtDelta(lwPct, isMargin),
          lyPctText: fmtDelta(lyPct, isMargin),
        };
      }),
    [rows, metric],
  );

  // The cheap half. Resolving the pill classes here rather than in the row is
  // what lets VendorRow's memo work.
  const graded = useMemo(
    () =>
      base.map((b) => {
        const tier = getVendorTier(b, activeThreshold, metric);
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

  // Store-level, so every vendor row carries the same coverage.
  const headerCov = rows[0]?.coverage ?? {
    dayCount: 0,
    lwDayCount: 0,
    lyDayCount: 0,
  };

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
      return (
        g.vendorName.toLowerCase().includes(q) ||
        g.vendorId.toLowerCase().includes(q)
      );
    });
    // applySort hands the rows straight back when nothing is sorted, so the
    // grade order stays the default.
    // Size orders within a tier regardless of metric — a big vendor slipping
    // matters more than a small one, whichever number is on screen.
    return applySort(
      sortGraded(filtered, (g) => g.twNet),
      (g, col) =>
        col === "ty"
          ? metric === "margin"
            ? g.tyMarginPct
            : g.twNet
          : col === "lw"
            ? g.lwPct
            : g.lyPct,
    );
  }, [graded, tierFilter, textFilter, metric, sort]);

  /** Header aggregates — the whole store's week, and how it moved. */
  const totals = useMemo(() => {
    const sum = (pick: (g: (typeof graded)[number]) => number) =>
      graded.reduce((a, g) => a + pick(g), 0);
    const isMargin = metric === "margin";
    const twNet = sum((g) => g.twNet);
    const twCogs = sum((g) => g.twCogs);
    const twNetLW = sum((g) => g.twNetForLW);
    const lwNet = sum((g) => g.lwNet);
    const twNetLY = sum((g) => g.twNetForLY);
    const lyNet = sum((g) => g.lyNet);
    return {
      // Store margin is WEIGHTED — dollars over dollars, not a mean of the
      // vendors' percentages, which would let a $5 supplier count as much as
      // the wholesaler behind half the shelves.
      tw: isMargin ? marginPct(twNet, twCogs) : twNet,
      // The MARGIN delta is the store's, matched over the store's days.
      // Summing each vendor's own matched days answers a slightly different
      // question from summing each department's, which is how this and Sub
      // Dept Margins came to disagree by 0.03 points on an identical week.
      // The sales delta stays as it is: it is a total, not a rate, so the
      // grouping does not change it.
      lwPct: isMargin
        ? storeMarginDelta(
            countedRows(vend.raw.tw),
            countedRows(vend.raw.lw),
            "lw",
          )
        : lwNet > 0
          ? pctChange(twNetLW, lwNet)
          : null,
      lyPct: isMargin
        ? storeMarginDelta(
            countedRows(vend.raw.tw),
            countedRows(vend.raw.ly),
            "ly",
          )
        : lyNet > 0
          ? pctChange(twNetLY, lyNet)
          : null,
    };
  }, [graded, metric, vend.raw]);

  /** Coupon lines and anything else with no supplier. Surfaced rather than
   *  hidden — a large bucket here is worth knowing about, and it explains why
   *  the vendor rows don't sum to the header on their own. */
  const noVendor = useMemo(() => {
    const rows = graded.filter((g) => g.noVendor);
    return {
      count: rows.length,
      // Always dollars — a margin percentage on the coupon bucket is
      // meaningless, and the point of the notice is the size of the hole.
      value: rows.reduce((a, g) => a + g.twNet, 0),
    };
  }, [graded, metric]);

  const fmt = (n: number) => formatCurrency2(n);

  /** The header figure — a margin percentage, or an abbreviated total ($1.2K)
   *  so a store-wide number can't crowd the pills beside it. */
  const fmtHeader = (n: number) =>
    metric === "margin" ? `${n.toFixed(2)}%` : formatCurrencyCompact(n);

  const dateRange =
    vend.twStart && vend.twEnd ? fmtCompactRange(vend.twStart, vend.twEnd) : "";

  const threshValue: ThresholdValue | null =
    threshold === null ? null : { op: "lt", amount: threshold };

  return {
    sort,
    handleSort,
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
    threshold,
    tierFilter,
    textFilter,
    selectedVendor,
  };
};
