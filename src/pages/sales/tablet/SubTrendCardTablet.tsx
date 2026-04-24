import { couponSalePct } from "../../../functions";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import type { TopSub } from "../components";

interface SubTrendCardTabletProps {
  title: string;
  leftLabel: string;
  rightLabel: string;
  leftSub: TopSub;
  rightSub: TopSub;
  leftTone: "emerald" | "blue" | "orange";
  rightTone: "emerald" | "blue" | "orange";
  datesLeft: string;
  datesRight: string;
}

const toneMap = {
  emerald: {
    border: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
    line: "from-emerald-200 to-transparent",
  },
  blue: {
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    line: "from-blue-200 to-transparent",
  },
  orange: {
    border: "border-orange-200",
    badge: "bg-orange-100 text-orange-700",
    line: "from-orange-200 to-transparent",
  },
} as const;

const SubTrendCardTablet = ({
  title,
  leftLabel,
  rightLabel,
  leftSub,
  rightSub,
  leftTone,
  rightTone,
  datesLeft,
  datesRight,
}: SubTrendCardTabletProps) => {
  const left = toneMap[leftTone];
  const right = toneMap[rightTone];

  const renderMetric = (
    label: string,
    value: string,
    _tone: keyof typeof toneMap,
  ) => (
    <div className="rounded-xl bg-slate-50 px-2.5 py-2 ring-1 ring-slate-200">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold tabular-nums text-slate-800">
        {value}
      </div>
    </div>
  );

  const cpnsLeft = [
    leftSub.digital_coupons,
    leftSub.store_coupon,
    leftSub.elec_store_coupons,
    leftSub.elec_instore_coupons,
  ];

  const cpnsRight = [
    rightSub.digital_coupons,
    rightSub.store_coupon,
    rightSub.elec_store_coupons,
    rightSub.elec_instore_coupons,
  ];

  const salesDiff = leftSub.total_sales - rightSub.total_sales;
  const salesPct =
    rightSub.total_sales !== 0 ? (salesDiff / rightSub.total_sales) * 100 : 0;

  const diffClass =
    salesDiff > 0
      ? "text-emerald-600"
      : salesDiff < 0
        ? "text-rose-600"
        : "text-slate-500";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-slate-800">{title}</div>
            <div className="text-[11px] text-slate-500">
              {datesLeft} vs {datesRight}
            </div>
          </div>

          <div
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${left.badge}`}
          >
            {salesDiff > 0 ? "+" : ""}
            {formatCurrency2(salesDiff)} ({salesPct.toFixed(1)}%)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2">
        <div className={`h-[2px] bg-gradient-to-r ${left.line}`} />
        <div className={`h-[2px] bg-gradient-to-l ${right.line}`} />
      </div>

      <div className="px-3 py-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-emerald-50/60 p-2 ring-1 ring-emerald-100">
            <div className="text-[11px] font-semibold text-emerald-700">
              {leftLabel}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {renderMetric(
                "Sales",
                formatCurrency2(leftSub.total_sales),
                leftTone,
              )}
              {renderMetric(
                "Net",
                formatCurrency2(leftSub.net_sales),
                leftTone,
              )}
              {renderMetric("Qty", formatBigNumber(leftSub.qty, 0), leftTone)}
              {renderMetric(
                "Cpn %",
                couponSalePct(cpnsLeft, leftSub.total_sales),
                leftTone,
              )}
            </div>
          </div>

          <div className="rounded-xl bg-slate-50/70 p-2 ring-1 ring-slate-200">
            <div className={`text-[11px] font-semibold ${diffClass}`}>
              {rightLabel}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {renderMetric(
                "Sales",
                formatCurrency2(rightSub.total_sales),
                rightTone,
              )}
              {renderMetric(
                "Net",
                formatCurrency2(rightSub.net_sales),
                rightTone,
              )}
              {renderMetric("Qty", formatBigNumber(rightSub.qty, 0), rightTone)}
              {renderMetric(
                "Cpn %",
                couponSalePct(cpnsRight, rightSub.total_sales),
                rightTone,
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {renderMetric(
            "Digital Cpn",
            formatCurrency2(leftSub.digital_coupons),
            leftTone,
          )}
          {renderMetric(
            "Store Cpn",
            formatCurrency2(leftSub.store_coupon),
            leftTone,
          )}
          {renderMetric(
            "E. Store Cpn",
            formatCurrency2(leftSub.elec_store_coupons),
            leftTone,
          )}
          {renderMetric(
            "E. Instore Cpn",
            formatCurrency2(leftSub.elec_instore_coupons),
            leftTone,
          )}
        </div>
      </div>
    </div>
  );
};

export default SubTrendCardTablet;
