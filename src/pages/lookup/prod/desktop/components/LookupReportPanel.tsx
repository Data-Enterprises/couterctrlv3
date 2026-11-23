// Utils
import { computeActiveGap, hasSaleTypeBreakdown } from "../../utils";

// Interfaces
import type { DayBucket, MarginResult, TrendResult } from "../../interfaces";
import type { SaleTypeSummary } from "../../../../../features/itemLookupSlice";

// Components
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import SaleTypeBreakdown from "./SaleTypeBreakdown";
import SaleTypeTimeline from "./SaleTypeTimeline";
import ReportKpiStrip from "./ReportKpiStrip";
import ReportBanners from "./ReportBanners";
import DailyRow from "./DailyRow";

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

        <ReportKpiStrip
          margin={margin}
          totalQty={totalQty}
          daysSold={daysSold}
          longestGap={longestGap}
        />

        {(trend.isSlowing || activeGapDays >= 2) && (
          <ReportBanners
            trend={trend}
            weighed={margin.weighed}
            activeGapDays={activeGapDays}
          />
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
              <span className="font-normal text-content/95">
                {" "}
                · {selectedSaleType}
              </span>
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
              {[...buckets].reverse().map((b) => (
                <DailyRow
                  key={b.date}
                  bucket={b}
                  weighed={margin.weighed}
                  gridStyle={salesGrid}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LookupReportPanel;
