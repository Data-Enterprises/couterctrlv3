import {
  ArrowDownTrayIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";
import { formatCurrency2 } from "../../../../utils";
import type { SaleTypeSummary } from "../../../../features/dev/devItemLookupSlice";
import SaleTypeBreakdown from "../SaleTypeBreakdown";
import type { MarginResult, DayBucket, TrendResult } from "../lookupMetrics";
import {
  computeActiveGap,
  dayMarginPct,
  dayUnitCost,
  formatUnits,
  hasSaleTypeBreakdown,
} from "../lookupMetrics";

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
  saleTypes: SaleTypeSummary[];
  /** "Sale", or the type whose timeline replaces the daily breakdown. */
  selectedSaleType: string;
  onSelectSaleType: (saleType: string) => void;
  /** The selected type's days. Ignored while that type is Sale, which uses
   *  `buckets` — the timeline the KPIs and banners are built on. */
  timeline: DayBucket[];
  onExportOpen: () => void;
}

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
  saleTypes,
  selectedSaleType,
  onSelectSaleType,
  timeline,
  onExportOpen,
}: LookupReportPanelProps) => {
  const showingSales = selectedSaleType === "Sale";
  const isNegative = margin.marginPct !== null && margin.marginPct < 0;
  const activeGapDays = computeActiveGap(buckets);
  const longestGap = gaps.reduce((max, g) => Math.max(max, g.days), 0);
  const unit = margin.weighed ? "lb" : "unit";
  // A scale item gets Qty and Weight side by side: qty is how many times it
  // rang, weight is what it was priced and costed by.
  const salesGrid = {
    gridTemplateColumns: `repeat(${margin.weighed ? 8 : 7}, minmax(0, 1fr))`,
  };

  return (
    <div className="flex-1 min-w-0 shadow-lg">
      <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
        {/* 1-row navy header */}
        <div className="flex-shrink-0 px-4 py-[10px] flex items-center justify-between gap-3 bg-[#1e2a4a]">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-custom-white leading-tight truncate">
              {description}
            </div>
            <div className="text-[10px] mt-0.5 text-custom-white truncate">
              {[productCode, categoryDescription].filter(Boolean).join(" · ")}
            </div>
          </div>
          <button
            onClick={onExportOpen}
            className="text-custom-white/60 hover:text-custom-white transition-colors flex-shrink-0"
            title="Export"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
          </button>
        </div>

        {/* 7-col KPI strip — margin first */}
        <div className="grid grid-cols-7 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="px-4 pt-2.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-content">
              Margin
            </div>
            <div
              className={`text-[14px] font-bold tabular-nums mt-0.5 ${isNegative ? "text-red-800" : "text-emerald-800"}`}
            >
              {margin.costMissing ? (
                <span className="text-[12px] font-semibold text-gray-500">
                  No cost on file
                </span>
              ) : margin.marginPct !== null ? (
                `${margin.marginPct.toFixed(2)}%`
              ) : (
                "-"
              )}
            </div>
          </div>
          <div className="px-4 pt-2.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-content">
              List price
            </div>
            <div className="text-[14px] font-bold text-content tabular-nums mt-0.5">
              {formatCurrency2(margin.listPrice)}
            </div>
          </div>
          <div className="px-4 pt-2.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-content">
              Avg sold at / {margin.weighed ? "lb" : "unit"}
            </div>
            <div
              className={`text-[14px] font-bold tabular-nums mt-0.5 ${isNegative ? "text-red-800" : "text-content"}`}
            >
              {formatCurrency2(margin.avgSoldAt)}
            </div>
          </div>
          <div className="px-4 pt-2.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-content">
              Cost / {unit}
            </div>
            <div className="text-[14px] font-bold text-content tabular-nums mt-0.5">
              {margin.costMissing ? (
                <span className="text-[12px] font-semibold text-gray-500">
                  No cost on file
                </span>
              ) : (
                formatCurrency2(margin.unitCost)
              )}
            </div>
          </div>
          <div className="px-4 pt-2.5 text-center">
            {/* A scale item rings qty 0 and sells by weight, so its count is
                always zero — show what it actually sold. */}
            <div className="text-[10px] font-bold uppercase tracking-wide text-content">
              {margin.weighed ? "Total weight" : "Total units"}
            </div>
            <div className="text-[14px] font-bold text-content tabular-nums mt-0.5">
              {margin.weighed ? formatUnits(margin.totalUnits, true) : totalQty}
            </div>
          </div>
          <div className="px-4 pt-2.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-content">
              Days sold
            </div>
            <div className="text-[14px] font-bold text-content tabular-nums mt-0.5">
              {daysSold}{" "}
              <span className="text-[11px] font-medium text-gray-400">
                of 14
              </span>
            </div>
          </div>
          <div className="px-4 pt-2.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-content">
              Longest gap
            </div>
            <div className="text-[14px] font-bold text-content tabular-nums mt-0.5">
              {longestGap > 0 ? (
                <>
                  {longestGap}{" "}
                  <span className="text-[11px] font-medium text-gray-400">
                    days
                  </span>
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
                  Slowing down - {formatUnits(trend.firstHalfUnits, margin.weighed)}
                  {margin.weighed ? "" : " units"} first week,{" "}
                  {formatUnits(trend.secondHalfUnits, margin.weighed)}
                  {margin.weighed ? "" : " units"} this week
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

        {hasSaleTypeBreakdown(saleTypes) && (
          <div className="px-4 pt-4 flex-shrink-0">
            <div className="text-[11px] font-semibold text-content pb-1">
              By sale type
            </div>
            <SaleTypeBreakdown
              saleTypes={saleTypes}
              weighed={margin.weighed}
              selected={selectedSaleType}
              onSelect={onSelectSaleType}
            />
          </div>
        )}

        {/* Consolidated daily breakdown */}
        <div className="px-4 pt-4 pb-2 flex-shrink-0 flex items-baseline justify-between gap-3">
          <div className="text-[11px] font-semibold text-content">
            Daily breakdown
            {!showingSales && (
              <span className="font-normal text-content/85"> · {selectedSaleType}</span>
            )}
          </div>
          {!showingSales && (
            <button
              type="button"
              onClick={() => onSelectSaleType("Sale")}
              className="text-[11px] font-semibold text-[#1e2a4a] hover:underline"
            >
              Back to sales
            </button>
          )}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar px-4 pb-4">
          {!showingSales ? (
            <SaleTypeTimeline
              buckets={timeline}
              weighed={margin.weighed}
              saleType={selectedSaleType}
            />
          ) : (
          <>
          <div
            className="grid px-2 py-1.5 text-[9px] font-medium uppercase tracking-wide text-content border-b border-gray-100 sticky top-0 bg-custom-white"
            style={salesGrid}
          >
            <span>Date</span>
            <span className="text-right">Qty</span>
            {margin.weighed && <span className="text-right">Weight</span>}
            <span className="text-right">Amount</span>
            <span className="text-right">Cost of goods</span>
            <span className="text-right">Cost / {unit}</span>
            <span className="text-right">List price</span>
            <span className="text-right">Margin</span>
          </div>
          {[...buckets].reverse().map((b) => {
            const pct = dayMarginPct(b);
            const isNeg = pct !== null && pct < 0;
            const caseCost = dayUnitCost(b);
            // Sold, but nothing to cost it against — not a $0.00 cost.
            const noCost = b.hasSale && !b.hasCost;
            return (
              <div
                key={b.date}
                className={`grid px-2 py-2 text-[12px] border-b border-gray-50 ${b.hasSale ? "even:bg-row_stripe" : "bg-gray-50/60"}`}
                style={salesGrid}
              >
                <span className={b.hasSale ? "text-content" : "text-gray-400"}>
                  {b.label}
                </span>
                <span
                  className={`text-right tabular-nums ${b.hasSale ? "text-content" : "text-gray-400"}`}
                >
                  {b.hasSale ? b.qty.toLocaleString() : "—"}
                </span>
                {margin.weighed && (
                  <span
                    className={`text-right tabular-nums ${b.hasSale ? "text-content" : "text-gray-400"}`}
                  >
                    {b.hasSale ? formatUnits(b.units, true) : "—"}
                  </span>
                )}
                <span
                  className={`text-right tabular-nums ${b.hasSale ? "text-content" : "text-gray-400"}`}
                >
                  {b.hasSale ? formatCurrency2(b.revenue) : "—"}
                </span>
                <span
                  className={`text-right tabular-nums ${b.hasSale && !noCost ? "text-content" : "text-gray-400"}`}
                >
                  {noCost ? "No cost" : b.hasSale ? formatCurrency2(b.cost) : "—"}
                </span>
                <span
                  className={`text-right tabular-nums ${b.hasSale ? "text-content" : "text-gray-400"}`}
                >
                  {caseCost !== null ? formatCurrency2(caseCost) : "—"}
                </span>
                <span
                  className={`text-right tabular-nums ${b.hasSale ? "text-content" : "text-gray-400"}`}
                >
                  {b.hasSale ? formatCurrency2(b.listPrice) : "—"}
                </span>
                <span
                  className={`text-right tabular-nums font-medium ${
                    !b.hasSale
                      ? "text-gray-400"
                      : isNeg
                        ? "text-red-700"
                        : "text-emerald-700"
                  }`}
                >
                  {pct !== null ? `${pct.toFixed(2)}%` : "—"}
                </span>
              </div>
            );
          })}
          </>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * One non-Sale type's days. Cost and margin are left off: a voided or
 * restored line isn't a sale, so neither means anything against it.
 */
const SaleTypeTimeline = ({
  buckets,
  weighed,
  saleType,
}: {
  buckets: DayBucket[];
  weighed: boolean;
  saleType: string;
}) => {
  const grid = {
    gridTemplateColumns: `repeat(${weighed ? 5 : 4}, minmax(0, 1fr))`,
  };
  return (
    <>
      <div
        className="grid px-2 py-1.5 text-[9px] font-medium uppercase tracking-wide text-content border-b border-gray-100 sticky top-0 bg-custom-white"
        style={grid}
      >
        <span>Date</span>
        <span className="text-right">Qty</span>
        {weighed && <span className="text-right">Weight</span>}
        <span className="text-right">Amount</span>
        <span className="text-right">List price</span>
      </div>
      {[...buckets].reverse().map((b) => (
        <div
          key={b.date}
          className={`grid px-2 py-2 text-[12px] tabular-nums border-b border-gray-50 ${
            b.hasSale ? "even:bg-row_stripe text-content" : "bg-gray-50/60 text-gray-400"
          }`}
          style={grid}
          aria-label={b.hasSale ? `${saleType} on ${b.label}` : undefined}
        >
          <span>{b.label}</span>
          <span className="text-right">{b.hasSale ? b.qty.toLocaleString() : "—"}</span>
          {weighed && (
            <span className="text-right">{b.hasSale ? formatUnits(b.units, true) : "—"}</span>
          )}
          <span className="text-right">{b.hasSale ? formatCurrency2(b.revenue) : "—"}</span>
          <span className="text-right">{b.hasSale ? formatCurrency2(b.listPrice) : "—"}</span>
        </div>
      ))}
    </>
  );
};

export default LookupReportPanel;
