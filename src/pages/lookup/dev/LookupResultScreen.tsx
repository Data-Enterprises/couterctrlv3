import { useState } from "react";
import {
  ArrowTrendingDownIcon,
  ChevronLeftIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";
import { formatCurrency2 } from "../../../utils";
import type { MarginResult, DayBucket, TrendResult } from "./lookupMetrics";
import { computeActiveGap } from "./lookupMetrics";
import RecentLookupsStrip from "./RecentLookupsStrip";
import DailyBreakdownSheet from "./DailyBreakdownSheet";

interface LookupResultScreenProps {
  description: string;
  productCode: string;
  categoryDescription: string;
  storeName: string;
  onBack: () => void;
  onSelectRecent: (productCode: string) => void;
  margin: MarginResult;
  totalQty: number;
  daysSold: number;
  buckets: DayBucket[];
  trend: TrendResult;
  gaps: { start: string; end: string; days: number }[];
}

const LookupResultScreen = ({
  description,
  productCode,
  categoryDescription,
  storeName,
  onBack,
  onSelectRecent,
  margin,
  totalQty,
  daysSold,
  buckets,
  trend,
  gaps,
}: LookupResultScreenProps) => {
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const isNegative = margin.marginPct !== null && margin.marginPct < 0;
  const activeGapDays = computeActiveGap(buckets);
  const longestGap = gaps.reduce((max, g) => Math.max(max, g.days), 0);
  const dateRangeLabel = buckets.length
    ? `${buckets[0].label} – ${buckets[buckets.length - 1].label}`
    : "";

  return (
    <div className="min-h-[calc(100vh-56px)] bg-custom-white">
      <div
        className="flex-shrink-0 px-3 pt-2 pb-2.5"
        style={{ background: "#1e2a4a" }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="text-custom-white/85 hover:text-custom-white transition-colors flex-shrink-0 -ml-1"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-custom-white truncate">
              {storeName}
            </div>
            <div className="text-[10px] mt-0.5 truncate text-custom-white/85">
              {dateRangeLabel}
            </div>
          </div>
        </div>
      </div>

      <div className="p-3.5">
        <div className="bg-content/5 rounded-xl p-3.5">
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-content/10">
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-content truncate">
                {description}
              </div>
              <div className="text-[10px] text-content/85 mt-0.5 truncate">
                {productCode} · {categoryDescription}
              </div>
            </div>
          </div>

          <div className="flex items-start justify-between gap-2 mt-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-content/85">
              Margin, last 14 days
            </span>
            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
              {isNegative && (
                <span className="text-[10px] font-semibold text-red-800">
                  Selling below cost
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div
              className={`text-[16px] font-bold mt-0.5 tabular-nums ${isNegative ? "text-red-800" : "text-emerald-800"}`}
            >
              {margin.marginPct !== null
                ? `${margin.marginPct.toFixed(1)}%`
                : "-"}
            </div>
            <button
              onClick={() => setBreakdownOpen(true)}
              className="text-[10px] mt-1.5 font-semibold text-[#1e2a4a] border border-[#1e2a4a] rounded-md py-0.5 px-1"
            >
              View breakdown
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2 border-t border-content/10 pt-2.5">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-content/85">
                List price
              </div>
              <div className="text-[13px] font-semibold tabular-nums mt-0.5">
                {formatCurrency2(margin.listPrice)}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-content/85">
                Avg sold at
              </div>
              <div
                className={`text-[13px] font-semibold tabular-nums mt-0.5 ${isNegative ? "text-red-800" : ""}`}
              >
                {formatCurrency2(margin.avgSoldAt)}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-content/85">
                Case cost
              </div>
              <div className="text-[13px] font-semibold tabular-nums mt-0.5">
                {formatCurrency2(margin.caseCost)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2.5 border-t border-content/10 pt-2.5">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-content/85">
                Total units
              </div>
              <div className="text-[13px] font-semibold tabular-nums mt-0.5">
                {totalQty}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-content/85">
                Days sold
              </div>
              <div className="text-[13px] font-semibold tabular-nums mt-0.5">
                {daysSold}{" "}
                <span className="text-[11px] font-medium text-content/85">
                  of 14
                </span>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-content/85">
                Longest gap
              </div>
              <div className="text-[13px] font-semibold tabular-nums mt-0.5">
                {longestGap > 0 ? (
                  <>
                    {longestGap}{" "}
                    <span className="text-[11px] font-medium text-content/85">
                      days
                    </span>
                  </>
                ) : (
                  <span className="text-content/85">None</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {trend.isSlowing && (
          <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-2 bg-amber-50 rounded-lg">
            <ArrowTrendingDownIcon className="w-4 h-4 text-amber-800" />
            <span className="text-[11.5px] text-amber-900">
              Slowing down - {trend.firstHalfQty} units first week,{" "}
              {trend.secondHalfQty} units this week
            </span>
          </div>
        )}

        {activeGapDays >= 2 && (
          <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-2 bg-red-50 rounded-lg">
            <ExclamationTriangleIcon className="w-4 h-4 text-red-700" />
            <span className="text-[11.5px] text-red-800">
              No sales in the last {activeGapDays} days
            </span>
          </div>
        )}

        <div className="mt-4">
          <RecentLookupsStrip onSelect={onSelectRecent} variant="list" />
        </div>
      </div>

      {breakdownOpen && (
        <DailyBreakdownSheet
          description={description}
          buckets={buckets}
          onClose={() => setBreakdownOpen(false)}
        />
      )}
    </div>
  );
};

export default LookupResultScreen;
