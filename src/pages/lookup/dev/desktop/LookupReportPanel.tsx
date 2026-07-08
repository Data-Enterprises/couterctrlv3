import { ArrowDownTrayIcon, ArrowTrendingDownIcon, ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import { formatCurrency2 } from "../../../../utils";
import type { MarginResult, DayBucket, TrendResult } from "../lookupMetrics";
import { computeActiveGap } from "../lookupMetrics";

interface LookupReportPanelProps {
  description: string;
  productCode: string;
  categoryDescription: string;
  margin: MarginResult;
  totalQty: number;
  daysSold: number;
  buckets: DayBucket[];
  trend: TrendResult;
  gaps: { start: string; end: string; days: number }[];
  onExportOpen: () => void;
}

const dayMarginPct = (b: DayBucket): number | null =>
  b.hasSale && b.revenue > 0 ? ((b.revenue - b.cost) / b.revenue) * 100 : null;

const LookupReportPanel = ({
  description,
  productCode,
  categoryDescription,
  margin,
  totalQty,
  daysSold,
  buckets,
  trend,
  gaps,
  onExportOpen,
}: LookupReportPanelProps) => {
  const isNegative = margin.marginPct !== null && margin.marginPct < 0;
  const activeGapDays = computeActiveGap(buckets);
  const longestGap = gaps.reduce((max, g) => Math.max(max, g.days), 0);

  return (
    <div className="flex-1 min-w-0 shadow-lg">
      <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
        {/* 1-row navy header */}
        <div className="flex-shrink-0 px-4 py-[10px] flex items-center justify-between gap-3 bg-[#1e2a4a]">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-white leading-tight truncate">
              {description}
            </div>
            <div className="text-[10px] mt-0.5 text-white truncate">
              {productCode} · {categoryDescription}
            </div>
          </div>
          <button
            onClick={onExportOpen}
            className="text-white/60 hover:text-white transition-colors flex-shrink-0"
            title="Export"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
          </button>
        </div>

        {/* 7-col KPI strip — margin first */}
        <div className="grid grid-cols-7 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="px-3 py-2.5">
            <div className="text-[9px] font-medium uppercase tracking-wide text-content">Margin</div>
            <div className={`text-[13px] font-semibold tabular-nums mt-0.5 ${isNegative ? "text-red-800" : "text-emerald-800"}`}>
              {margin.marginPct !== null ? `${margin.marginPct.toFixed(1)}%` : "-"}
            </div>
          </div>
          <div className="px-3 py-2.5">
            <div className="text-[9px] font-medium uppercase tracking-wide text-content">List price</div>
            <div className="text-[13px] font-semibold text-content tabular-nums mt-0.5">
              {formatCurrency2(margin.listPrice)}
            </div>
          </div>
          <div className="px-3 py-2.5">
            <div className="text-[9px] font-medium uppercase tracking-wide text-content">Avg sold at</div>
            <div
              className={`text-[13px] font-semibold tabular-nums mt-0.5 ${isNegative ? "text-red-800" : "text-content"}`}
            >
              {formatCurrency2(margin.avgSoldAt)}
            </div>
          </div>
          <div className="px-3 py-2.5">
            <div className="text-[9px] font-medium uppercase tracking-wide text-content">Case cost</div>
            <div className="text-[13px] font-semibold text-content tabular-nums mt-0.5">
              {formatCurrency2(margin.caseCost)}
            </div>
          </div>
          <div className="px-3 py-2.5">
            <div className="text-[9px] font-medium uppercase tracking-wide text-content">Total units</div>
            <div className="text-[13px] font-semibold text-content tabular-nums mt-0.5">{totalQty}</div>
          </div>
          <div className="px-3 py-2.5">
            <div className="text-[9px] font-medium uppercase tracking-wide text-content">Days sold</div>
            <div className="text-[13px] font-semibold text-content tabular-nums mt-0.5">
              {daysSold} <span className="text-[11px] font-medium text-gray-400">of 14</span>
            </div>
          </div>
          <div className="px-3 py-2.5">
            <div className="text-[9px] font-medium uppercase tracking-wide text-content">Longest gap</div>
            <div className="text-[13px] font-semibold text-content tabular-nums mt-0.5">
              {longestGap > 0 ? (
                <>
                  {longestGap} <span className="text-[11px] font-medium text-gray-400">days</span>
                </>
              ) : (
                <span className="text-gray-400">None</span>
              )}
            </div>
          </div>
        </div>

        {/* Banners */}
        {(trend.isSlowing || activeGapDays >= 2) && (
          <div className="px-4 pt-3 flex items-center gap-2 flex-shrink-0">
            {trend.isSlowing && (
              <div className="flex-1 flex items-center gap-1.5 px-2.5 py-2 bg-amber-50 rounded-lg min-w-0">
                <ArrowTrendingDownIcon className="w-4 h-4 text-amber-800 flex-shrink-0" />
                <span className="text-[11.5px] text-amber-900 truncate">
                  Slowing down - {trend.firstHalfQty} units first week, {trend.secondHalfQty} units this week
                </span>
              </div>
            )}
            {activeGapDays >= 2 && (
              <div className="flex-1 flex items-center gap-1.5 px-2.5 py-2 bg-red-50 rounded-lg min-w-0">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-700 flex-shrink-0" />
                <span className="text-[11.5px] text-red-800 truncate">
                  No sales in the last {activeGapDays} days
                </span>
              </div>
            )}
          </div>
        )}

        {/* Consolidated daily breakdown */}
        <div className="px-4 pt-4 pb-2 flex-shrink-0">
          <div className="text-[11px] font-semibold text-content">Daily breakdown</div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar px-4 pb-4">
          <div className="grid grid-cols-7 px-2 py-1.5 text-[9px] font-medium uppercase tracking-wide text-content border-b border-gray-100 sticky top-0 bg-custom-white">
            <span>Date</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Revenue</span>
            <span className="text-right">Case cost</span>
            <span className="text-right">Cost</span>
            <span className="text-right">List price</span>
            <span className="text-right">Margin</span>
          </div>
          {[...buckets].reverse().map((b) => {
            const pct = dayMarginPct(b);
            const isNeg = pct !== null && pct < 0;
            const caseCost = b.hasSale ? b.cost / b.qty : null;
            return (
              <div
                key={b.date}
                className={`grid grid-cols-7 px-2 py-2 text-[12px] border-b border-gray-50 ${b.hasSale ? "" : "bg-gray-50/60"}`}
              >
                <span className={b.hasSale ? "text-content" : "text-gray-400"}>{b.label}</span>
                <span className={`text-right tabular-nums ${b.hasSale ? "text-content" : "text-gray-400"}`}>
                  {b.hasSale ? b.qty : "—"}
                </span>
                <span className={`text-right tabular-nums ${b.hasSale ? "text-content" : "text-gray-400"}`}>
                  {b.hasSale ? formatCurrency2(b.revenue) : "—"}
                </span>
                <span className={`text-right tabular-nums ${b.hasSale ? "text-content" : "text-gray-400"}`}>
                  {b.hasSale ? formatCurrency2(b.cost) : "—"}
                </span>
                <span className={`text-right tabular-nums ${b.hasSale ? "text-content" : "text-gray-400"}`}>
                  {caseCost !== null ? formatCurrency2(caseCost) : "—"}
                </span>
                <span className={`text-right tabular-nums ${b.hasSale ? "text-content" : "text-gray-400"}`}>
                  {b.hasSale ? formatCurrency2(b.listPrice) : "—"}
                </span>
                <span
                  className={`text-right tabular-nums font-medium ${
                    !b.hasSale ? "text-gray-400" : isNeg ? "text-red-700" : "text-emerald-700"
                  }`}
                >
                  {pct !== null ? `${pct.toFixed(1)}%` : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LookupReportPanel;
