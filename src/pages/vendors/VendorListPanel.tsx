import InfoButton from "../../components/InfoButton";
import VendorRow from "./VendorRow";
import { useMemo, useState, useCallback } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import { useAppSelector, useAppDispatch } from "../../hooks";
import TextFilter from "../../components/filters/TextFilter";
import ThresholdFilter, {
  type ThresholdValue,
} from "../../components/filters/ThresholdFilter";
import InfoPopover from "../../components/InfoPopover";
import SortHeader, { PERF_SORT_HEADER } from "../../components/SortHeader";
import { useTriStateSort } from "../../utils/useTriStateSort";
import { formatCurrency2, formatCurrencyCompact } from "../../utils";
import { fmtCompactRange } from "../../utils/dateLabels";
import {
  severityDotClass,
  pillClass,
  PCT_COL_W,
  formatPct,
  type Severity,
} from "../../utils/severity";
import { pctChange, sortGraded, type Tier } from "../../utils/grading";
import { VENDORS_INFO } from "./vendorsInfo";
import {
  setTextFilter,
  setTierFilter,
  setSelectedVendor,
  setMetric,
  setThreshold,
  VENDOR_THRESHOLD_DEFAULT,
} from "../../features/vendorsSlice";
import { getVendorTier, vendorDelta, marginPct } from "./vendorsUtils";

const TOGGLE_OPTS = [
  { key: "margin" as const, label: "Margin" },
  { key: "sales" as const, label: "Sales" },
];

/** Margin deltas are POINTS, sales deltas are PERCENT — never interchangeable,
 *  so the suffix is part of the number. Same split Sub Dept Margins makes. */
const fmtDelta = (d: number | null, isMargin: boolean) =>
  d === null
    ? "—"
    : isMargin
      ? `${d >= 0 ? "+" : ""}${d.toFixed(2)} pts`
      : formatPct(d);

/** Ungraded has no severity equivalent, so it falls back to the neutral dot
 *  rather than borrowing a colour that would imply a verdict. */
const dotFor = (tier: Tier) =>
  tier === "ungraded" ? "bg-gray-300" : severityDotClass[tier as Severity];

/** Written out in full because Tailwind scans source text and never sees a
 *  class assembled at runtime. */
const CHIP_BASE: Record<Tier, string> = {
  critical: "bg-severity_critical_bg text-severity_critical_text",
  watch: "bg-severity_watch_bg text-severity_watch_text",
  healthy: "bg-severity_healthy_bg text-severity_healthy_text",
  ungraded: "bg-gray-100 text-content/70",
};

const CHIP_ON: Record<Tier, string> = {
  critical: "ring-2 ring-severity_critical_text/40 shadow-sm",
  watch: "ring-2 ring-severity_watch_text/40 shadow-sm",
  healthy: "ring-2 ring-severity_healthy_text/40 shadow-sm",
  ungraded: "ring-2 ring-gray-400/40 shadow-sm",
};

/** Sortable columns. With none active the list keeps its own worst-grade
 *  -first order, which is the point of a Performance page — see
 *  useTriStateSort. */
type ListSortCol = "ty" | "lw" | "ly";

interface Props {
  onSearchOpen: () => void;
}

const VendorListPanel = ({ onSearchOpen }: Props) => {
  const dispatch = useAppDispatch();
  const [infoOpen, setInfoOpen] = useState(false);
  const { sort, handleSort, applySort } = useTriStateSort<ListSortCol>();
  const vend = useAppSelector((s) => s.vendors);
  const { rows, metric, threshold, tierFilter, textFilter, selectedVendor } = vend;

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
        return {
          ...r,
          delta: vendorDelta(r, metric),
          lwPct,
          lyPct,
          twText: isMargin ? pct(r.tyMarginPct) : formatCurrency2(r.twNet),
          lwText: r.hasLW
            ? isMargin
              ? pct(r.lwMarginPct)
              : formatCurrency2(r.lwNet)
            : "—",
          lyText: r.hasLY
            ? isMargin
              ? pct(r.lyMarginPct)
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
          lwPillClass: pillClass(b.lwPct, activeThreshold),
          lyPillClass: pillClass(b.lyPct, activeThreshold),
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
    const twCogsLW = sum((g) => g.twCogsForLW);
    const lwNet = sum((g) => g.lwNet);
    const lwCogs = sum((g) => g.lwCogs);
    const twNetLY = sum((g) => g.twNetForLY);
    const twCogsLY = sum((g) => g.twCogsForLY);
    const lyNet = sum((g) => g.lyNet);
    const lyCogs = sum((g) => g.lyCogs);
    return {
      // Store margin is WEIGHTED — dollars over dollars, not a mean of the
      // vendors' percentages, which would let a $5 supplier count as much as
      // the wholesaler behind half the shelves.
      tw: isMargin ? marginPct(twNet, twCogs) : twNet,
      lwPct:
        lwNet > 0
          ? isMargin
            ? marginPct(twNetLW, twCogsLW) - marginPct(lwNet, lwCogs)
            : pctChange(twNetLW, lwNet)
          : null,
      lyPct:
        lyNet > 0
          ? isMargin
            ? marginPct(twNetLY, twCogsLY) - marginPct(lyNet, lyCogs)
            : pctChange(twNetLY, lyNet)
          : null,
    };
  }, [graded, metric]);

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
      <div className="bg-[#1e2a4a] rounded-t-xl px-4 pt-1 pb-2.5 flex flex-col gap-0">
        {/* Row 1: date range | store total + vs LW/LY pills. Store name moved
            down to row 2 beside the search button, matching Sub Dept Margins. */}
        <div className="flex items-center gap-2 min-h-[26px]">
          <span className="text-custom-white font-semibold text-[13px] flex-shrink-0">
            {dateRange}
          </span>
          <div className="flex-1" />
          {graded.length > 0 && (
            <>
              <span className="text-[14px] font-semibold text-custom-white">
                {fmtHeader(totals.tw)}
              </span>
              {totals.lwPct !== null && (
                <span
                  className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${
                    totals.lwPct >= 0
                      ? "bg-emerald-300/15 text-emerald-300"
                      : "bg-red-300/15 text-red-300"
                  }`}
                >
                  LW {fmtDelta(totals.lwPct, metric === "margin")}
                </span>
              )}
              {totals.lyPct !== null && (
                <span
                  className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${
                    totals.lyPct >= 0
                      ? "bg-emerald-300/15 text-emerald-300"
                      : "bg-red-300/15 text-red-300"
                  }`}
                >
                  LY {fmtDelta(totals.lyPct, metric === "margin")}
                </span>
              )}
            </>
          )}
        </div>

        {/* Row 2: search btn + store | metric toggle | threshold | help btn */}
        <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-custom-white/[0.08]">
          <button
            className="w-[22px] h-[22px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/60 hover:text-custom-white hover:border-custom-white/40 transition-colors flex-shrink-0"
            onClick={onSearchOpen}
            title="Search"
          >
            <MagnifyingGlassIcon className="w-3.5 h-3.5" />
          </button>

          <span className="text-[11px] font-medium text-custom-white truncate min-w-0">
            {vend.storeName}
          </span>

          <div className="flex-1" />

          <div
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
                    metric === key ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />

          {/* Threshold. The label stays generic so the Performance headers read
              identically — the page already says what is being graded. */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[11px] text-custom-white font-medium">Threshold</span>
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
            <InfoButton onClick={() => setInfoOpen((prev) => !prev)} />
            {infoOpen && (
              <InfoPopover
                title={VENDORS_INFO.title}
                purpose={VENDORS_INFO.purpose}
                glossary={VENDORS_INFO.glossary}
                onClose={() => setInfoOpen(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex items-center justify-between gap-1.5 px-4 py-2 bg-custom-white border-x border-gray-100">
        <div className="flex items-center gap-1.5 flex-wrap">
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
        <div className="px-4 py-1.5 bg-custom-white border-x border-b border-gray-100 text-[11px] text-content/60 flex-shrink-0">
          <span className="font-medium text-content">{fmt(noVendor.value)}</span> booked
          without a vendor — coupon lines and anything else the POS records with no
          supplier. Counted in the store total so the vendors below still add up.
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col bg-custom-white border-x border-b border-gray-100 rounded-b-xl overflow-hidden">
        {/* Column headers */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 border-b border-gray-100 flex-shrink-0">
          <span className="w-2.5 flex-shrink-0" />
          <span className="text-[11.5px] font-semibold uppercase tracking-wide text-content/80 flex-1">
            Vendor
          </span>
          <div className="flex items-center gap-[14px]">
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

        <div className="flex-1 overflow-y-auto thin-scrollbar">
          {visible.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-[11px] text-content/40">
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
