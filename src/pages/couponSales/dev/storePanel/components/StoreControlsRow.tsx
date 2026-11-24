// Hooks
import { useRef } from "react";

// Redux
import {
  COUPON_THRESHOLD_DEFAULT,
  COUPON_TREND_THRESHOLD_DEFAULT,
  type CouponMetric,
} from "../../../../../features/dev/devCouponSalesSlice";

// Utils
import { METRIC_OPTS } from "../../utils";

// Components
import BackButton from "../../../../../components-dev/BackButton";
import PageInfoButton from "../../../../../components-dev/PageInfoButton";
import ThresholdFilter from "../../../../../components-dev/filters/ThresholdFilter";
import ThresholdSlider from "../../../../../components-dev/filters/ThresholdSlider";

interface StoreControlsRowProps {
  metric: CouponMetric;
  onMetric: (metric: CouponMetric) => void;
  /** The dollar threshold as typed; null while the input is empty. */
  threshold: number | null;
  /** The trend threshold as typed; null while the input is empty. */
  trendThreshold: number | null;
  onThreshold: (value: number | null) => void;
  onTrendThreshold: (value: number | null) => void;
  onOpenSearch: () => void;
}

/** The store panel header's second row: Back to the search, the Trend / Avg $
 *  switch, the threshold for that mode, and help. */
const StoreControlsRow = ({
  metric,
  onMetric,
  threshold,
  trendThreshold,
  onThreshold,
  onTrendThreshold,
  onOpenSearch,
}: StoreControlsRowProps) => {
  const isTrend = metric === "trend";
  const activeRaw = isTrend ? trendThreshold : threshold;

  // Mirrors the dollar threshold's ref: hold the last valid amount while the
  // input is empty so clearing it never reshuffles the list mid-edit.
  const lastValidTrendRef = useRef(
    trendThreshold ?? COUPON_TREND_THRESHOLD_DEFAULT,
  );
  if (trendThreshold !== null) lastValidTrendRef.current = trendThreshold;

  // Clearing the numeric input dispatches null; grading deliberately holds the
  // last valid amount so rows don't reshuffle mid-edit. The slider has to sit
  // at that same number or it would show a value nothing is graded against.
  const lastValidRef = useRef<number>(threshold ?? COUPON_THRESHOLD_DEFAULT);
  if (threshold != null) lastValidRef.current = threshold;

  return (
    <div className="flex items-center gap-2 cc-navy-header-row">
      <BackButton onClick={onOpenSearch} helpAnchor="search" />

      <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />

      {/* Trend / Avg $ — which question the page grades on. The threshold
          control below follows the mode, because the two modes measure in
          different units: a percentage move against the baseline, or a
          flat dollar line with no baseline in play. */}
      <div
        data-help="metric"
        className="flex items-center flex-shrink-0 rounded overflow-hidden"
        style={{ height: 22 }}
      >
        {METRIC_OPTS.map(({ key, label }) => {
          const active = metric === key;
          return (
            <button
              key={key}
              onClick={() => onMetric(key)}
              className={`px-2.5 text-[10px] text-custom-white font-medium transition-colors h-full ${
                active ? "bg-custom-white/20" : "bg-custom-white/[0.07]"
              }`}
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
            isTrend ? onTrendThreshold(amount) : onThreshold(amount)
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
            activeRaw === null ? null : { op: "gt" as const, amount: activeRaw }
          }
          onChange={(v) =>
            isTrend
              ? onTrendThreshold(v?.amount ?? null)
              : onThreshold(v?.amount ?? null)
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
        <PageInfoButton page="coupon-sales" />
      </div>
    </div>
  );
};

export default StoreControlsRow;
