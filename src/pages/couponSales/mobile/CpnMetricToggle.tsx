import { useAppDispatch, useAppSelector } from "../../../hooks";
import { setCouponMetric } from "../../../features/couponSalesSlice";
import type { CouponMetric } from "../../../features/couponSalesSlice";

/**
 * Trend / Avg $ — the same two questions the desktop toggle asks, sized for
 * the navy header's `actions` slot.
 *
 * It lives in the header rather than above the list because it changes what
 * the grade *means*, not what the list shows: under Trend a row is measured
 * against its own prior two weeks, under Avg $ against a flat dollar line.
 * Putting it beside the threshold keeps the two grading controls together.
 */
const OPTIONS: { value: CouponMetric; label: string }[] = [
  { value: "trend", label: "Trend" },
  { value: "avg", label: "Avg $" },
];

const CpnMetricToggle = () => {
  const dispatch = useAppDispatch();
  const metric = useAppSelector((s) => s.couponSales.metric);

  return (
    <div className="flex items-center gap-0.5 bg-custom-white/10 rounded p-0.5">
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => dispatch(setCouponMetric(value))}
          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
            metric === value
              ? "bg-custom-white text-[#1e2a4a]"
              : "text-custom-white"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default CpnMetricToggle;
