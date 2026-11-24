// Utils
import { formatCurrency2, formatBigNumber } from "../../../../../utils";
import { couponDotClass, couponPillClass, type CouponRow } from "../../utils";

interface StoreRowProps {
  row: CouponRow;
  isSelected: boolean;
  /** Trend mode adds the outlier flag and the move against the baseline. */
  isTrend: boolean;
  /** The flat-dollar line the outlier flag names. */
  activeThreshold: number;
  onSelect: () => void;
}

/** One store in the graded list: its grade dot and name, amount, transactions,
 *  coupon count, average and, in Trend mode, its move against its baseline. */
const StoreRow = ({
  row,
  isSelected,
  isTrend,
  activeThreshold,
  onSelect,
}: StoreRowProps) => (
  <button
    onClick={onSelect}
    className={`w-full flex items-center gap-2.5 p-3 text-left transition-colors border-l-2 border-b border-b-brand_navy/15 ${
      isSelected ? "cc-row-selected" : "border-transparent hover:bg-fill_soft"
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
        className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 whitespace-nowrap ${couponPillClass[row.tier]}`}
        style={{ minWidth: 58 }}
      >
        {formatCurrency2(row.avgAmount)}
      </span>
      {/* Movement against this store's own prior two weeks. Up is
          the bad direction — larger coupons than its own norm. */}
      {isTrend && (
        <span
          className={`text-[12px] font-semibold text-right flex-shrink-0 tabular-nums ${
            row.trendPct === null
              ? "text-content/95"
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

export default StoreRow;
