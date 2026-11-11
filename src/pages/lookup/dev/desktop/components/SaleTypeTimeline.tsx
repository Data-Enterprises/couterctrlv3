// Utils
import { formatUnits } from "../../utils";
import { formatCurrency2 } from "../../../../../utils";

// Interfaces
import type { DayBucket } from "../../interfaces";

interface SaleTypeTimelineProps {
  buckets: DayBucket[];
  weighed: boolean;
  saleType: string;
}

/**
 * One non-Sale type's days. Cost and margin are left off: a voided or
 * restored line isn't a sale, so neither means anything against it.
 */
const SaleTypeTimeline = ({ buckets, weighed, saleType }: SaleTypeTimelineProps) => {
  const grid = {
    gridTemplateColumns: `repeat(${weighed ? 5 : 4}, minmax(0, 1fr))`,
  };
  return (
    <>
      <div
        className="grid px-2 py-1.5 text-[9px] font-medium uppercase tracking-wide text-content border-b border-line_hair sticky top-0 bg-custom-white"
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
          className={`grid px-2 py-2 text-[12px] tabular-nums border-b border-line_faint ${
            b.hasSale ? "even:bg-row_stripe text-content" : "bg-gray-50/60 text-content/95"
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

export default SaleTypeTimeline;
