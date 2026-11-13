// Utils
import { formatCurrency2 } from "../../../../../utils";
import {
  computeActiveGap,
  dayMarginPct,
  dayUnitCost,
  formatUnits,
  hasSaleTypeBreakdown,
} from "../../utils";

// Interfaces
import type { DayBucket, MarginResult, TrendResult } from "../../interfaces";
import type { SaleTypeSummary } from "../../../../../features/dev/devItemLookupSlice";

// Components
import {
  ArrowDownTrayIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";
import SaleTypeBreakdown from "./SaleTypeBreakdown";
import SaleTypeTimeline from "./SaleTypeTimeline";

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

/** The Item lookup's report for the selected item: header with export, a KPI strip (margin, prices, cost, units, days
 *  sold, longest gap), slowing and no-sales banners, the by-sale-type breakdown, and the daily breakdown. */
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
      <div className="cc-panel shadow-sm h-full">
        {/* 1-row navy header */}
        <div className="flex-shrink-0 px-4 py-[10px] flex items-center justify-between gap-3 bg-brand_navy">
          <div className="min-w-0">
            <div className="text-[13px] cc-navy-title leading-tight truncate">
              {description}
            </div>
            <div className="text-[10px] mt-0.5 text-custom-white truncate">
              {[productCode, categoryDescription].filter(Boolean).join(" · ")}
            </div>
          </div>
          <button
            onClick={onExportOpen}
            className="cc-navy-link flex-shrink-0"
            title="Export"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
          </button>
        </div>

        {/* 7-col KPI strip — margin first */}
        <div className="grid grid-cols-7 divide-x divide-line_hair border-b border-line_hair bg-fill_soft flex-shrink-0">
          <div className="px-4 pt-2.5 text-center">
            <div className="text-[10px] cc-caps-strong">
              Margin
            </div>
            <div
              className={`text-[14px] font-bold tabular-nums mt-0.5 ${isNegative ? "text-delta_negative_text" : "text-delta_positive_text"}`}
            >
              {margin.costMissing ? (
                <span className="text-[12px] font-semibold text-brand_slate">
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
            <div className="text-[10px] cc-caps-strong">
              List price
            </div>
            <div className="text-[14px] font-bold text-content tabular-nums mt-0.5">
              {formatCurrency2(margin.listPrice)}
            </div>
          </div>
          <div className="px-4 pt-2.5 text-center">
            <div className="text-[10px] cc-caps-strong">
              Avg sold at / {margin.weighed ? "lb" : "unit"}
            </div>
            <div
              className={`text-[14px] font-bold tabular-nums mt-0.5 ${isNegative ? "text-delta_negative_text" : "text-content"}`}
            >
              {formatCurrency2(margin.avgSoldAt)}
            </div>
          </div>
          <div className="px-4 pt-2.5 text-center">
            <div className="text-[10px] cc-caps-strong">
              Cost / {unit}
            </div>
            <div className="text-[14px] font-bold text-content tabular-nums mt-0.5">
              {margin.costMissing ? (
                <span className="text-[12px] font-semibold text-brand_slate">
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
            <div className="text-[10px] cc-caps-strong">
              {margin.weighed ? "Total weight" : "Total units"}
            </div>
            <div className="text-[14px] font-bold text-content tabular-nums mt-0.5">
              {margin.weighed ? formatUnits(margin.totalUnits, true) : totalQty}
            </div>
          </div>
          <div className="px-4 pt-2.5 text-center">
            <div className="text-[10px] cc-caps-strong">
              Days sold
            </div>
            <div className="text-[14px] font-bold text-content tabular-nums mt-0.5">
              {daysSold}{" "}
              <span className="text-[11px] font-medium text-brand_slate">
                of 14
              </span>
            </div>
          </div>
          <div className="px-4 pt-2.5 text-center">
            <div className="text-[10px] cc-caps-strong">
              Longest gap
            </div>
            <div className="text-[14px] font-bold text-content tabular-nums mt-0.5">
              {longestGap > 0 ? (
                <>
                  {longestGap}{" "}
                  <span className="text-[11px] font-medium text-brand_slate">
                    days
                  </span>
                </>
              ) : (
                <span className="text-brand_slate">None</span>
              )}
            </div>
          </div>
        </div>

        {/* Banners */}
        {(trend.isSlowing || activeGapDays >= 2) && (
          <div className="px-4 pt-3 flex items-center gap-2 flex-shrink-0">
            {trend.isSlowing && (
              <div className="flex-1 flex items-center gap-1.5 px-2.5 py-2 bg-severity_watch_bg rounded-lg min-w-0">
                <ArrowTrendingDownIcon className="w-4 h-4 text-severity_watch_text flex-shrink-0" />
                <span className="text-[11.5px] text-severity_watch_text truncate">
                  Slowing down - {formatUnits(trend.firstHalfUnits, margin.weighed)}
                  {margin.weighed ? "" : " units"} first week,{" "}
                  {formatUnits(trend.secondHalfUnits, margin.weighed)}
                  {margin.weighed ? "" : " units"} this week
                </span>
              </div>
            )}
            {activeGapDays >= 2 && (
              <div className="flex-1 flex items-center gap-1.5 px-2.5 py-2 bg-severity_critical_bg rounded-lg min-w-0">
                <ExclamationTriangleIcon className="w-4 h-4 text-severity_critical_text flex-shrink-0" />
                <span className="text-[11.5px] text-severity_critical_text truncate">
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
              <span className="font-normal text-content/95"> · {selectedSaleType}</span>
            )}
          </div>
          {!showingSales && (
            <button
              type="button"
              onClick={() => onSelectSaleType("Sale")}
              className="text-[11px] font-semibold text-brand_navy hover:underline"
            >
              Back to sales
            </button>
          )}
        </div>
        <div className="cc-scroll px-4 pb-4">
          {!showingSales ? (
            <SaleTypeTimeline
              buckets={timeline}
              weighed={margin.weighed}
              saleType={selectedSaleType}
            />
          ) : (
          <>
          <div
            className="grid px-2 py-1.5 text-[9px] font-medium uppercase tracking-wide text-content border-b border-line_hair sticky top-0 bg-custom-white"
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
                className={`grid px-2 py-2 text-[12px] border-b border-line_faint ${b.hasSale ? "even:bg-row_stripe" : "bg-fill_soft/60"}`}
                style={salesGrid}
              >
                <span className={b.hasSale ? "text-content" : "text-content/95"}>
                  {b.label}
                </span>
                <span
                  className={`text-right tabular-nums ${b.hasSale ? "text-content" : "text-content/95"}`}
                >
                  {b.hasSale ? b.qty.toLocaleString() : "—"}
                </span>
                {margin.weighed && (
                  <span
                    className={`text-right tabular-nums ${b.hasSale ? "text-content" : "text-content/95"}`}
                  >
                    {b.hasSale ? formatUnits(b.units, true) : "—"}
                  </span>
                )}
                <span
                  className={`text-right tabular-nums ${b.hasSale ? "text-content" : "text-content/95"}`}
                >
                  {b.hasSale ? formatCurrency2(b.revenue) : "—"}
                </span>
                <span
                  className={`text-right tabular-nums ${b.hasSale && !noCost ? "text-content" : "text-content/95"}`}
                >
                  {noCost ? "No cost" : b.hasSale ? formatCurrency2(b.cost) : "—"}
                </span>
                <span
                  className={`text-right tabular-nums ${b.hasSale ? "text-content" : "text-content/95"}`}
                >
                  {caseCost !== null ? formatCurrency2(caseCost) : "—"}
                </span>
                <span
                  className={`text-right tabular-nums ${b.hasSale ? "text-content" : "text-content/95"}`}
                >
                  {b.hasSale ? formatCurrency2(b.listPrice) : "—"}
                </span>
                <span
                  className={`text-right tabular-nums font-medium ${
                    !b.hasSale
                      ? "text-content/95"
                      : isNeg
                        ? "text-delta_negative_text"
                        : "text-delta_positive_text"
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

export default LookupReportPanel;
