import type { UpcTrend } from "../../../../interfaces";
import {
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
} from "@heroicons/react/24/outline";

interface TrendCardProps {
  trend: UpcTrend;
  id: number;
}

const TrendCard = ({ trend, id }: TrendCardProps) => {
  const textColor = (num1: number, num2: number) => {
    if (num1 > num2) return "text-emerald-500 font-medium";
    if (num1 < num2) return "text-orange-500 font-medium";
    return "text-content font-medium";
  };

  const calcPercentChange = (before: number, after: number) => {
    if (before === 0) return after === 0 ? 0 : 100;
    return ((after - before) / Math.abs(before)) * 100;
  };

  const isDecimal = (num: number) => {
    return num % 1 !== 0 ? num.toFixed(2) : num;
  };

  return (
    <div
      data-testid={`selected-trend-card-${id}`}
      className="flex flex-col text-xs relative bg-custom-white px-2 py-1 rounded-lg shadow-lg"
    >
      <div className="flex gap-1 absolute -top-1 right-0 items-center">
        <div className="pt-1">
          {trend.trend === "up" ? (
            <ArrowUpCircleIcon
              className="h-6 w-6 text-emerald-500"
              strokeWidth={2}
            />
          ) : (
            <ArrowDownCircleIcon
              className="h-6 w-6 text-orange-500"
              strokeWidth={2}
            />
          )}
        </div>
      </div>

      <div className="border-b border-content/20 pb-1">
        <div className="flex gap-1">
          <div className="">{trend.product_code}</div>
        </div>
        <div className="flex gap-1">
          <div className="truncate">{trend.product_description}</div>
        </div>
      </div>

      <div className="col-span-2 border-b border-content/20 pb-1">
        <div className="gap-1 flex">
          <div className="font-medium">Before:</div>
          <div>{(trend.tooltip ?? "").split(". ")[0]?.replace("Before:", "")}</div>
        </div>
        <div className="flex gap-1">
          <div className="font-medium">After:</div>
          <div>{(trend.tooltip ?? "").split(". ")[1]?.replace("After:", "").replace(/nan/g, "0")}</div>
        </div>
      </div>

      <div className="border-b border-content/20 pb-1">
        {/* Days active */}
        <div className="grid grid-cols-3 gap-4">
          <div className="font-medium">Days Active</div>
          <div className="flex gap-1">
            <div className="font-medium">Before:</div>
            <div>{trend.active_days_before}</div>
          </div>
          <div className="flex gap-1">
            <div>After:</div>
            <div className="font-medium">{trend.active_days_after}</div>
          </div>
        </div>

        {/* total qty */}
        <div className="grid grid-cols-3 gap-4">
          <div className="font-medium">Total Qty</div>
          <div className="flex gap-1">
            <div>Before:</div>
            <div
              className={`${textColor(trend.total_before, trend.total_after)}`}
            >
              {trend.total_before}
            </div>
          </div>
          <div className="flex gap-1">
            <div>After:</div>
            <div
              className={`${textColor(trend.total_after, trend.total_before)}`}
            >
              {trend.total_after}
            </div>
          </div>
        </div>

        {/* Mean Percent */}
        <div className="grid grid-cols-3 gap-4">
          <div className="font-medium">Mean %:</div>
          <div className="flex gap-1">
            <div>Before:</div>
            <div
              className={`${textColor(trend.mean_before, trend.mean_after)}`}
            >
              {trend.mean_before.toFixed(2)}%
            </div>
          </div>
          <div className="flex gap-1">
            <div>After:</div>
            <div
              className={`${textColor(trend.mean_after, trend.mean_before)}`}
            >
              {trend.mean_after.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Volatility Percent */}
        <div className="grid grid-cols-3 gap-4">
          <div className="font-medium">Volatility %:</div>
          <div className="flex gap-1">
            <div>Before:</div>
            <div
              className={`${textColor(
                trend.volatility_before,
                trend.volatility_after
              )}`}
            >
              {trend.volatility_before.toFixed(2)}%
            </div>
          </div>
          <div className="flex gap-1">
            <div>After:</div>
            <div
              className={`${textColor(
                trend.volatility_after,
                trend.volatility_before
              )}`}
            >
              {trend.volatility_after.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Notes => needs to be refined with css */}
      <div className="py-1">
        <div className="font-medium underline">Notes:</div>
        <div className="grid grid-cols-1">
          <div className="flex gap-1">
            Impact Units:{" "}
            <div className="font-medium">{isDecimal(trend.impact_units)}</div>
          </div>
          <div className="flex gap-1">
            <div>Difference in Total:</div>
            <div className={`font-medium`}>
              {trend.total_after - trend.total_before}
            </div>
          </div>
          <div className="flex gap-1">
            Mean % Change:
            <div
              className={`font-medium ${
                trend.pct_change_mean > 0
                  ? "text-emerald-500"
                  : "text-orange-500"
              }`}
            >
              {isDecimal(trend.pct_change_mean)}%
            </div>
          </div>
          <div className="flex gap-1">
            Volatility % Change:
            <div
              className={`font-medium ${
                calcPercentChange(
                  trend.volatility_before,
                  trend.volatility_after
                ) > 0
                  ? "text-emerald-500"
                  : "text-orange-500"
              }`}
            >
              {calcPercentChange(
                trend.volatility_before,
                trend.volatility_after
              ).toFixed(2)}
              %
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendCard;
