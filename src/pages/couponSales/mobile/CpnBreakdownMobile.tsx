import { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import MobilePerfHeader from "../../../components/mobile/MobilePerfHeader";
import MobileDayStrip from "../../../components/mobile/MobileDayStrip";
import SevBadge from "../../../components/SevBadge";
import SevChips from "../../../components/SevChips";
import { formatCurrency2, formatBigNumber } from "../../../utils";
import type { CouponItem } from "../../../interfaces";
import {
  setCouponBreakdown,
  setSelectedCouponSection,
  COUPON_THRESHOLD_DEFAULT,
} from "../../../features/couponSalesSlice";
import type { CouponBreakdown } from "../../../features/couponSalesSlice";
import { COUPON_SALES_INFO } from "../couponSalesInfo";
import {
  buildBreakdownRows,
  buildDateRows,
  couponPillClass,
  totalsFor,
  type GradingOptions,
} from "../shared/couponGrading";
import CpnMetricToggle from "./CpnMetricToggle";
import {
  badgeTier,
  filterByTier,
  tierCounts,
  ungradedCount,
  type CouponFilter,
} from "./couponTierUi";

/**
 * One store, broken down — screen two of three, and the mobile equivalent of
 * the desktop detail panel.
 *
 * The desktop dropped its Date tab when it gained a day-of-week strip, because
 * the two were the same cut twice. Mobile inherits that decision rather than
 * reintroducing it: the strip filters, the tabs group, and `buildDateRows` is
 * still what feeds the strip's up/down markers.
 */
const BREAKDOWNS: { value: CouponBreakdown; label: string }[] = [
  { value: "subdept", label: "Sub dept" },
  { value: "cashier", label: "Cashier" },
  { value: "item", label: "Item" },
];

interface Props {
  /** Every coupon line for the selected store, the full week. */
  storeCoupons: CouponItem[];
  storeLabel: string;
  rangeLabel: string;
  /** Grading scoped to this store's own baseline slice — see CouponSales. */
  grading: GradingOptions;
  onBack: () => void;
  onSectionSelected: () => void;
}

const CpnBreakdownMobile = ({
  storeCoupons,
  storeLabel,
  rangeLabel,
  grading,
  onBack,
  onSectionSelected,
}: Props) => {
  const dispatch = useAppDispatch();
  const { breakdown, metric, threshold } = useAppSelector((s) => s.couponSales);
  const [filter, setFilter] = useState<CouponFilter>("all");
  const [day, setDay] = useState<string | null>(null);

  const isTrend = metric === "trend";
  const activeThreshold = threshold ?? COUPON_THRESHOLD_DEFAULT;

  // Day markers come from the same day-matched builder the desktop strip uses:
  // this Tuesday against the baseline Tuesdays, not against a date that has no
  // counterpart. `isUp` is the bad direction — coupons getting larger.
  const dayEntries = useMemo(
    () =>
      buildDateRows(storeCoupons, grading)
        .slice()
        .sort((a, b) => a.key.localeCompare(b.key))
        .map((r) => ({
          date: r.key,
          isUp: (r.trendPct ?? 0) > 0,
          hasRef: r.trendPct !== null,
        })),
    [storeCoupons, grading],
  );

  // The day filter narrows what is grouped, but never what it is graded
  // against: the baseline stays the whole two-week window, because a single
  // day has no two-week counterpart of its own.
  const scoped = useMemo(
    () =>
      day === null
        ? storeCoupons
        : storeCoupons.filter((c) => c.sale_date.split("T")[0] === day),
    [storeCoupons, day],
  );

  const rows = useMemo(
    () => buildBreakdownRows(scoped, grading, breakdown),
    [scoped, grading, breakdown],
  );

  const totals = useMemo(() => totalsFor(scoped), [scoped]);
  const counts = useMemo(() => tierCounts(rows), [rows]);
  const ungraded = useMemo(() => ungradedCount(rows), [rows]);
  const visible = useMemo(() => filterByTier(rows, filter), [rows, filter]);

  return (
    <div className="flex flex-col h-full">
      <MobilePerfHeader
        pageName="Coupon Sales"
        dateRange={rangeLabel}
        storeName={storeLabel}
        onBack={onBack}
        actions={<CpnMetricToggle />}
        info={COUPON_SALES_INFO}
      />

      {/* This store's own totals for whatever the day strip has selected —
          the figure every row below adds up to, so a section can be read as a
          share of it without leaving the screen. */}
      <div className="flex-shrink-0 grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100 bg-custom-white">
        {[
          { label: "Avg", value: formatCurrency2(totals.avgAmount) },
          { label: "Total", value: formatCurrency2(totals.amount) },
          { label: "Coupons", value: formatBigNumber(totals.lines, 0) },
          { label: "Trans", value: formatBigNumber(totals.transactions, 0) },
        ].map(({ label, value }) => (
          <div key={label} className="px-2 py-2 text-center min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wide text-content">
              {label}
            </div>
            <div className="text-[13px] font-semibold text-content tabular-nums truncate">
              {value}
            </div>
          </div>
        ))}
      </div>

      <MobileDayStrip days={dayEntries} selected={day} onSelect={setDay} />

      {/* Group-by, as chips rather than a dropdown: three options, and the one
          in force changes what every row underneath means. */}
      <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 border-b border-gray-100 bg-custom-white">
        {BREAKDOWNS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => {
              dispatch(setCouponBreakdown(value));
              setFilter("all");
            }}
            className={`px-2 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
              breakdown === value
                ? "bg-[#1e2a4a] text-custom-white border-[#1e2a4a]"
                : "bg-custom-white text-content/85 border-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <SevChips
        active={filter}
        counts={counts}
        onChange={(f) => setFilter(f)}
        extra={
          isTrend && ungraded > 0
            ? {
                label: "Ungraded",
                count: ungraded,
                active: filter === "ungraded",
                onClick: () =>
                  setFilter(filter === "ungraded" ? "all" : "ungraded"),
              }
            : undefined
        }
      />

      <div className="flex-1 overflow-y-auto pb-14 thin-scrollbar">
        {visible.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/85">
            Nothing matches
          </div>
        ) : (
          visible.map((row) => (
            <button
              key={row.key}
              onClick={() => {
                dispatch(setSelectedCouponSection(row.key));
                onSectionSelected();
              }}
              className="w-full px-4 py-3 border-b border-gray-100 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <SevBadge sev={badgeTier(row.tier)} />
                <div className="text-[13px] font-medium text-content truncate flex-1 min-w-0">
                  {row.label}
                </div>
                {isTrend && row.isOutlier && (
                  <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-severity_critical_bg text-severity_critical_text flex-shrink-0">
                    ${activeThreshold}+
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 flex-wrap pl-[30px]">
                <span
                  className={`flex items-baseline gap-1 rounded px-1.5 py-0.5 ${couponPillClass[row.tier]}`}
                >
                  <span className="text-[11px] opacity-85">Avg</span>
                  <span className="text-[11px] font-semibold">
                    {formatCurrency2(row.avgAmount)}
                  </span>
                </span>
                <span className="flex items-baseline gap-1 rounded px-1.5 py-0.5 bg-gray-100 text-content">
                  <span className="text-[11px] opacity-85">Total</span>
                  <span className="text-[11px] font-semibold">
                    {formatCurrency2(row.amount)}
                  </span>
                </span>
                <span className="flex items-baseline gap-1 rounded px-1.5 py-0.5 bg-gray-100 text-content">
                  <span className="text-[11px] opacity-85">Coupons</span>
                  <span className="text-[11px] font-semibold">
                    {formatBigNumber(row.lines, 0)}
                  </span>
                </span>
                {isTrend && (
                  <span
                    className={`text-[11px] font-semibold tabular-nums px-1 ${
                      row.trendPct === null
                        ? "text-content/85"
                        : row.trendPct > 0
                          ? "text-severity_critical_text"
                          : "text-severity_healthy_text"
                    }`}
                  >
                    {row.trendPct === null
                      ? "no baseline"
                      : `${row.trendPct > 0 ? "▲" : "▼"} ${Math.abs(row.trendPct).toFixed(1)}% vs base`}
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default CpnBreakdownMobile;
