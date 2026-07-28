import { useMemo, useRef, useState } from "react";
import { MagnifyingGlassIcon, QuestionMarkCircleIcon } from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { formatCurrency2, formatBigNumber } from "../../../utils";
import {
  setCouponThreshold,
  setCouponTrendThreshold,
  setCouponMetric,
  setSelectedCouponStore,
  setCouponTierFilter,
  setCouponStoreFilter,
  COUPON_THRESHOLD_DEFAULT,
  COUPON_TREND_THRESHOLD_DEFAULT,
  type CouponTierFilter,
  type CouponMetric,
} from "../../../features/couponSalesSlice";
import ThresholdFilter from "../../../components/filters/ThresholdFilter";
import ThresholdSlider from "../../../components/filters/ThresholdSlider";
import TextFilter from "../../../components/filters/TextFilter";
import InfoPopover from "../../../components/InfoPopover";
import { COUPON_SALES_INFO } from "../couponSalesInfo";
import { couponDotClass, couponPillClass, type CouponRow, type CouponTotals } from "../shared/couponGrading";
import SortHeader from "./SortHeader";
import { useTriStateSort } from "../shared/useTriStateSort";

const METRIC_OPTS: { key: CouponMetric; label: string }[] = [
  { key: "trend", label: "Trend" },
  { key: "avg", label: "Avg $" },
];

type StoreSortCol = "amount" | "trans" | "count";

interface Props {
  rows: CouponRow[];
  totals: CouponTotals;
  rangeLabel: string;
  onOpenSearch: () => void;
}

const CpnSalesStorePanel = ({ rows, totals, rangeLabel, onOpenSearch }: Props) => {
  const dispatch = useAppDispatch();
  const [infoOpen, setInfoOpen] = useState(false);
  const rawThreshold = useAppSelector((s) => s.couponSales.threshold);
  const activeThreshold = rawThreshold ?? COUPON_THRESHOLD_DEFAULT;
  const rawTrendThreshold = useAppSelector((s) => s.couponSales.trendThreshold);
  const metric = useAppSelector((s) => s.couponSales.metric);
  const isTrend = metric === "trend";
  const activeRaw = isTrend ? rawTrendThreshold : rawThreshold;

  // Mirrors the dollar threshold's ref: hold the last valid amount while the
  // input is empty so clearing it never reshuffles the list mid-edit.
  const lastValidTrendRef = useRef(
    rawTrendThreshold ?? COUPON_TREND_THRESHOLD_DEFAULT,
  );
  if (rawTrendThreshold !== null) lastValidTrendRef.current = rawTrendThreshold;
  const tierFilter = useAppSelector((s) => s.couponSales.tierFilter);
  const storeFilter = useAppSelector((s) => s.couponSales.storeFilter);
  const selectedStoreKey = useAppSelector((s) => s.couponSales.selectedStoreKey);

  // Clearing the numeric input dispatches null; grading deliberately holds the
  // last valid amount so rows don't reshuffle mid-edit. The slider has to sit
  // at that same number or it would show a value nothing is graded against.
  const lastValidRef = useRef<number>(rawThreshold ?? COUPON_THRESHOLD_DEFAULT);
  if (rawThreshold != null) lastValidRef.current = rawThreshold;

  const criticalCount = rows.filter((r) => r.tier === "critical").length;
  const watchCount = rows.filter((r) => r.tier === "watch").length;
  const okCount = rows.filter((r) => r.tier === "ok").length;

  const { sort, handleSort, applySort } = useTriStateSort<StoreSortCol>();

  const visible = useMemo(() => {
    const byTier =
      tierFilter === "all" ? rows : rows.filter((r) => r.tier === tierFilter);
    const q = storeFilter.trim().toLowerCase();
    const filtered = q
      ? byTier.filter((r) => r.label.toLowerCase().includes(q))
      : byTier;
    // No sort selected leaves the grade order (worst first) intact.
    return applySort(filtered, (a, b, col) => {
      if (col === "amount") return a.amount - b.amount;
      if (col === "trans") return a.transactions - b.transactions;
      return a.lines - b.lines;
    });
  }, [rows, tierFilter, storeFilter, sort]);

  const toggleTier = (tier: Exclude<CouponTierFilter, "all">) =>
    dispatch(setCouponTierFilter(tierFilter === tier ? "all" : tier));

  return (
    <div className="flex flex-col min-w-0 h-full shadow-lg">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-[#1e2a4a] rounded-t-xl px-4 pt-1 pb-2.5 flex flex-col gap-0 flex-shrink-0">
        {/* Row 1: range | labelled totals, matching LP's SALES/TRANS/QTY run */}
        <div className="flex items-center gap-2 min-h-[26px]">
          <span className="text-custom-white font-semibold text-[13px] flex-shrink-0">
            {rangeLabel}
          </span>
          <div className="flex-1" />
          <div className="flex items-center gap-3 text-custom-white">
            <span className="text-[10px] uppercase tracking-wide text-custom-white/70">
              Amount{" "}
              <span className="text-[13px] font-semibold text-custom-white normal-case tracking-normal">
                {formatCurrency2(totals.amount)}
              </span>
            </span>
            <span className="w-px h-3.5 bg-custom-white/20" />
            <span className="text-[10px] uppercase tracking-wide text-custom-white/70">
              Coupons{" "}
              <span className="text-[13px] font-semibold text-custom-white normal-case tracking-normal">
                {formatBigNumber(totals.lines, 0)}
              </span>
            </span>
            <span className="w-px h-3.5 bg-custom-white/20" />
            <span className="text-[10px] uppercase tracking-wide text-custom-white/70">
              Avg{" "}
              <span className="text-[13px] font-semibold text-custom-white normal-case tracking-normal">
                {formatCurrency2(totals.avgAmount)}
              </span>
            </span>
          </div>
        </div>

        {/* Row 2: search | threshold */}
        <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-custom-white/[0.08]">
          <button
            onClick={onOpenSearch}
            className="w-[22px] h-[22px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/60 hover:text-custom-white hover:border-custom-white/40 transition-colors flex-shrink-0"
            aria-label="New search"
          >
            <MagnifyingGlassIcon className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />

          {/* Trend / Avg $ — which question the page grades on. The threshold
              control below follows the mode, because the two modes measure in
              different units: a percentage move against the baseline, or a
              flat dollar line with no baseline in play. */}
          <div
            className="flex items-center flex-shrink-0 rounded overflow-hidden"
            style={{ height: 22 }}
          >
            {METRIC_OPTS.map(({ key, label }) => {
              const active = metric === key;
              return (
                <button
                  key={key}
                  onClick={() => dispatch(setCouponMetric(key))}
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

          <div className="flex-1" />

          {/* The slider and the numeric input write the same value; the slider
              covers the range that actually separates stores, the input takes
              anything. */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[11px] text-custom-white font-medium">
              {isTrend ? "Trend Threshold" : "Avg Threshold"}
            </span>
            <ThresholdSlider
              value={isTrend ? lastValidTrendRef.current : lastValidRef.current}
              onChange={(amount) =>
                dispatch(
                  isTrend
                    ? setCouponTrendThreshold(amount)
                    : setCouponThreshold(amount),
                )
              }
              fallback={
                isTrend ? COUPON_TREND_THRESHOLD_DEFAULT : COUPON_THRESHOLD_DEFAULT
              }
              min={isTrend ? 5 : 1}
              max={isTrend ? 100 : 20}
              variant="dark"
              ariaLabel={
                isTrend
                  ? "Coupon trend threshold, percent"
                  : "Coupon grading threshold, dollars"
              }
            />
            <ThresholdFilter
              value={
                activeRaw === null
                  ? null
                  : { op: "gt" as const, amount: activeRaw }
              }
              onChange={(v) =>
                dispatch(
                  isTrend
                    ? setCouponTrendThreshold(v?.amount ?? null)
                    : setCouponThreshold(v?.amount ?? null),
                )
              }
              prefix={isTrend ? undefined : "$"}
              suffix={isTrend ? "%" : undefined}
              showOp={false}
              inputWidth={44}
              variant="dark"
            />
          </div>

          <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />

          {/* About this view — sits after the threshold, matching Sales and
              Sub Dept Margins. */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setInfoOpen((o) => !o)}
              title="About this view"
              className="w-[22px] h-[22px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/75 hover:text-custom-white hover:border-custom-white/40 transition-colors"
            >
              <QuestionMarkCircleIcon className="w-3.5 h-3.5" />
            </button>
            {infoOpen && (
              <InfoPopover
                title={COUPON_SALES_INFO.title}
                purpose={COUPON_SALES_INFO.purpose}
                glossary={COUPON_SALES_INFO.glossary}
                onClose={() => setInfoOpen(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Tier chips + text filter ───────────────────────────────────── */}
      <div className="flex items-center justify-between gap-1.5 px-4 py-2 bg-custom-white border-x border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => toggleTier("critical")}
            className={`text-[12px] font-semibold px-2 py-1 rounded-full bg-severity_critical_bg text-severity_critical_text transition-shadow ${
              tierFilter === "critical"
                ? "ring-2 ring-severity_critical_text/40 shadow-sm"
                : ""
            }`}
          >
            Crit ({criticalCount})
          </button>
          {/* Avg $ is a two-tier question — over the line or not — so Watch
              has nothing to count under it. */}
          {isTrend && (
          <button
            onClick={() => toggleTier("watch")}
            className={`text-[12px] font-semibold px-2 py-1 rounded-full bg-severity_watch_bg text-severity_watch_text transition-shadow ${
              tierFilter === "watch"
                ? "ring-2 ring-severity_watch_text/40 shadow-sm"
                : ""
            }`}
          >
            Watch ({watchCount})
          </button>
          )}
          <button
            onClick={() => toggleTier("ok")}
            className={`text-[12px] font-semibold px-2 py-1 rounded-full bg-severity_healthy_bg text-severity_healthy_text transition-shadow ${
              tierFilter === "ok"
                ? "ring-2 ring-severity_healthy_text/40 shadow-sm"
                : ""
            }`}
          >
            OK ({okCount})
          </button>
        </div>
        <div className="flex-shrink-0">
          <TextFilter
            value={storeFilter}
            onChange={(v) => dispatch(setCouponStoreFilter(v))}
            placeholder="Filter stores"
          />
        </div>
      </div>

      {/* ── Column headers ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-3 py-1.5 bg-custom-white border-x border-b border-gray-100 flex-shrink-0">
        <span className="w-2.5 flex-shrink-0" />
        <span className="flex-1 text-[10px] font-bold uppercase tracking-wide text-content">
          Store
        </span>
        <div className="flex items-center gap-[14px]">
          <SortHeader
            col="amount"
            label="Amount"
            sort={sort}
            onSort={handleSort}
            className="text-[10px] font-bold justify-end w-[64px] flex-shrink-0"
          />
          <SortHeader
            col="trans"
            label="Trans"
            sort={sort}
            onSort={handleSort}
            className="text-[10px] font-bold justify-end w-[46px] flex-shrink-0"
          />
          <SortHeader
            col="count"
            label="Count"
            sort={sort}
            onSort={handleSort}
            className="text-[10px] font-bold justify-end w-[46px] flex-shrink-0"
          />
          <span className="text-[10px] font-bold uppercase tracking-wide text-content text-center" style={{ width: 58 }}>
            Avg
          </span>
          {isTrend && (
            <span
              className="text-[10px] font-bold uppercase tracking-wide text-content text-center"
              style={{ width: 62 }}
              title="Change in average coupon versus this store's own prior two weeks"
            >
              vs Baseline
            </span>
          )}
        </div>
      </div>

      {/* ── Rows ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto thin-scrollbar bg-custom-white border-x border-b border-gray-100 rounded-b-xl">
        {visible.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-[12px] text-content/60">
            No stores match
          </div>
        ) : (
          visible.map((row) => {
            const isSel = selectedStoreKey === row.key;
            return (
              <button
                key={row.key}
                onClick={() => dispatch(setSelectedCouponStore(row.key))}
                className={`w-full flex items-center gap-2.5 p-3 text-left transition-colors border-l-2 border-b border-b-[#1e2a4a]/15 ${
                  isSel
                    ? "bg-row_selected border-row_selected_border"
                    : "border-transparent hover:bg-gray-50"
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${couponDotClass[row.tier]}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-content truncate flex items-center gap-1.5">
                    <span className="truncate">{row.label}</span>
                    {/* The flat-dollar outlier flag, independent of the trend
                        grade — a store can be steady (ok) and still be running
                        unusually large coupons. */}
                    {isTrend && row.isOutlier && (
                      <span
                        title={`Average coupon over the $${activeThreshold} threshold`}
                        className="text-[9px] font-bold px-1 py-0.5 rounded bg-severity_critical_bg text-severity_critical_text flex-shrink-0"
                      >
                        ${activeThreshold}+
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-[14px]">
                  <span
                    className="text-[13px] font-semibold text-content flex-shrink-0 text-right"
                    style={{ width: 64 }}
                  >
                    {formatCurrency2(row.amount)}
                  </span>
                  <span
                    className="text-[13px] font-medium text-content flex-shrink-0 text-right"
                    style={{ width: 46 }}
                  >
                    {formatBigNumber(row.transactions, 0)}
                  </span>
                  <span
                    className="text-[13px] font-medium text-content flex-shrink-0 text-right"
                    style={{ width: 46 }}
                  >
                    {formatBigNumber(row.lines, 0)}
                  </span>
                  <span
                    className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 ${couponPillClass[row.tier]}`}
                    style={{ width: 58 }}
                  >
                    {formatCurrency2(row.avgAmount)}
                  </span>
                  {/* Movement against this store's own prior two weeks. Up is
                      the bad direction — larger coupons than its own norm. */}
                  {isTrend && (
                  <span
                    className={`text-[12px] font-semibold text-right flex-shrink-0 tabular-nums ${
                      row.trendPct === null
                        ? "text-content/40"
                        : row.trendPct > 0
                          ? "text-severity_critical_text"
                          : "text-severity_healthy_text"
                    }`}
                    style={{ width: 62 }}
                    title={
                      row.avgBaseline === null
                        ? "No coupons in the baseline weeks"
                        : `Baseline avg ${formatCurrency2(row.avgBaseline)}`
                    }
                  >
                    {row.trendPct === null
                      ? "—"
                      : `${row.trendPct > 0 ? "+" : ""}${row.trendPct.toFixed(1)}%`}
                  </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CpnSalesStorePanel;
