// Utils
import { formatCurrency2 } from "../../../../../utils";
import { dayMarginPct, dayUnitCost, formatUnits } from "../../utils";

// Interfaces
import type { CSSProperties } from "react";
import type { DayBucket } from "../../interfaces";

interface DailyRowProps {
  bucket: DayBucket;
  weighed: boolean;
  /** The grid template shared with the heading. */
  gridStyle: CSSProperties;
}

/** One day of sales: quantity (and weight on a scale item), amount, cost of
 *  goods, cost per unit, list price and margin. A day with no sale dims. */
const DailyRow = ({ bucket: b, weighed, gridStyle }: DailyRowProps) => {
  const pct = dayMarginPct(b);
  const isNeg = pct !== null && pct < 0;
  const caseCost = dayUnitCost(b);
  // Sold, but nothing to cost it against — not a $0.00 cost.
  const noCost = b.hasSale && !b.hasCost;

  return (
    <div
      className={`grid px-2 py-2 text-[12px] border-b border-line_faint ${b.hasSale ? "even:bg-row_stripe" : "bg-fill_soft/60"}`}
      style={gridStyle}
    >
      <span className={b.hasSale ? "text-content" : "text-content/95"}>
        {b.label}
      </span>
      <span
        className={`text-right tabular-nums ${b.hasSale ? "text-content" : "text-content/95"}`}
      >
        {b.hasSale ? b.qty.toLocaleString() : "—"}
      </span>
      {weighed && (
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
};

export default DailyRow;
