// Utils
import { formatCurrency2 } from "../../../../../utils";
import { formatUnits } from "../../utils";

// Interfaces
import type { MarginResult } from "../../interfaces";

// Components
import KpiCell from "./KpiCell";

interface ReportKpiStripProps {
  margin: MarginResult;
  totalQty: number;
  daysSold: number;
  longestGap: number;
}

/** The report's seven figures, margin first: margin, list price, average sold
 *  at, cost, total units or weight, days sold and the longest gap. */
const ReportKpiStrip = ({
  margin,
  totalQty,
  daysSold,
  longestGap,
}: ReportKpiStripProps) => {
  const isNegative = margin.marginPct !== null && margin.marginPct < 0;
  const unit = margin.weighed ? "lb" : "unit";

  return (
    <div className="grid grid-cols-7 divide-x divide-line_hair border-b border-line_hair bg-fill_soft flex-shrink-0">
      <KpiCell
        label="Margin"
        valueClass={
          isNegative ? "text-delta_negative_text" : "text-delta_positive_text"
        }
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
      </KpiCell>
      <KpiCell label="List price">{formatCurrency2(margin.listPrice)}</KpiCell>
      <KpiCell
        label={`Avg sold at / ${margin.weighed ? "lb" : "unit"}`}
        valueClass={isNegative ? "text-delta_negative_text" : "text-content"}
      >
        {formatCurrency2(margin.avgSoldAt)}
      </KpiCell>
      <KpiCell label={`Cost / ${unit}`}>
        {margin.costMissing ? (
          <span className="text-[12px] font-semibold text-brand_slate">
            No cost on file
          </span>
        ) : (
          formatCurrency2(margin.unitCost)
        )}
      </KpiCell>
      {/* A scale item rings qty 0 and sells by weight, so its count is
          always zero — show what it actually sold. */}
      <KpiCell label={margin.weighed ? "Total weight" : "Total units"}>
        {margin.weighed ? formatUnits(margin.totalUnits, true) : totalQty}
      </KpiCell>
      <KpiCell label="Days sold">
        {daysSold}{" "}
        <span className="text-[11px] font-medium text-brand_slate">of 14</span>
      </KpiCell>
      <KpiCell label="Longest gap">
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
      </KpiCell>
    </div>
  );
};

export default ReportKpiStrip;
