import { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import MobilePerfHeader from "../../../components/mobile/MobilePerfHeader";
import SevBadge from "../../../components/SevBadge";
import SevChips from "../../../components/SevChips";
import ThresholdFilter from "../../../components/filters/ThresholdFilter";
import { useSearchScopeLabel } from "../../../hooks/useSearchScopeLabel";
import { formatCurrency2, formatBigNumber } from "../../../utils";
import {
  setCouponThreshold,
  setCouponTrendThreshold,
  setSelectedCouponStore,
  COUPON_THRESHOLD_DEFAULT,
} from "../../../features/couponSalesSlice";
import { COUPON_SALES_INFO } from "../couponSalesInfo";
import { couponPillClass, type CouponRow } from "../shared/couponGrading";
import CpnMetricToggle from "./CpnMetricToggle";
import {
  badgeTier,
  filterByTier,
  tierCounts,
  ungradedCount,
  type CouponFilter,
} from "./couponTierUi";

/**
 * The graded store list — screen one of three, and the mobile equivalent of
 * the desktop's left panel.
 *
 * Built on the Loss Prevention list rather than the Sub Dept Margins one, and
 * for the reason LP is shaped the way it is: this page grades each store
 * against its OWN prior two weeks, not against a week-over-week figure that a
 * KPI strip and day cards were designed to show. So there is no KPI strip and
 * no day strip here — the day strip belongs one level down, inside a store,
 * which is where the desktop puts it too.
 */
interface Props {
  rows: CouponRow[];
  rangeLabel: string;
  onOpenSearch: () => void;
  onStoreSelected: () => void;
}

const CpnStoreListMobile = ({
  rows,
  rangeLabel,
  onOpenSearch,
  onStoreSelected,
}: Props) => {
  const dispatch = useAppDispatch();
  const scopeLabel = useSearchScopeLabel();
  const { metric, threshold, trendThreshold } = useAppSelector(
    (s) => s.couponSales,
  );
  const [filter, setFilter] = useState<CouponFilter>("all");

  const isTrend = metric === "trend";
  const activeThreshold = threshold ?? COUPON_THRESHOLD_DEFAULT;
  // The raw (possibly cleared) value behind whichever control is live — the
  // input has to be able to show empty, while grading keeps using the last
  // valid number.
  const activeRaw = isTrend ? trendThreshold : threshold;

  const counts = useMemo(() => tierCounts(rows), [rows]);
  const ungraded = useMemo(() => ungradedCount(rows), [rows]);
  const visible = useMemo(() => filterByTier(rows, filter), [rows, filter]);

  return (
    <div className="flex flex-col h-full">
      <MobilePerfHeader
        pageName="Coupon Sales"
        dateRange={rangeLabel}
        storeName={scopeLabel}
        onSearch={onOpenSearch}
        actions={<CpnMetricToggle />}
        info={COUPON_SALES_INFO}
        threshold={
          // One control, wired to whichever number is actually grading — Avg $
          // grades on the dollar line, Trend on the percentage move and keeps
          // the dollar line only for the outlier flag. Same shape the desktop
          // header uses, so the two agree on units and on `showOp={false}`.
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
            inputWidth={40}
            variant="dark"
          />
        }
      />

      {/* Ungraded is its own chip, never folded into OK — a store with no
          coupons in the baseline weeks hasn't passed, it hasn't been measured.
          Under Avg $ there is no baseline in play, so the chip drops out. */}
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
            No stores match
          </div>
        ) : (
          visible.map((row) => (
            <button
              key={row.key}
              onClick={() => {
                dispatch(setSelectedCouponStore(row.key));
                onStoreSelected();
              }}
              className="w-full px-4 py-3 border-b border-gray-100 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <SevBadge sev={badgeTier(row.tier)} />
                <div className="text-[13px] font-medium text-content truncate flex-1 min-w-0">
                  {row.label}
                </div>
                {/* The flat-dollar flag rides alongside the trend grade rather
                    than replacing it: a store can be steady against its own
                    norm and still be running unusually large coupons. Under
                    Avg $ that IS the grade, so it would say the same thing
                    twice. */}
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
                <span className="flex items-baseline gap-1 rounded px-1.5 py-0.5 bg-gray-100 text-content">
                  <span className="text-[11px] opacity-85">Trans</span>
                  <span className="text-[11px] font-semibold">
                    {formatBigNumber(row.transactions, 0)}
                  </span>
                </span>
                {/* Only under Trend: the move is not what Avg $ is asking, and
                    showing it there would order the eye by a number the grade
                    ignores. */}
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

export default CpnStoreListMobile;
