// Utils
import { formatCurrency2 } from "../../../../../utils";
import { EST_COLS } from "../../utils";

// Interfaces
import type { estimatedPricePoints } from "../../../../../utils/pricePoints";

interface EstimatedColumnProps {
  estimated: ReturnType<typeof estimatedPricePoints>;
}

/** The left column: prices worked out from daily roll-ups, a day's sales
 *  divided by its units. */
const EstimatedColumn = ({ estimated }: EstimatedColumnProps) => (
  <div
    data-help="estimated"
    className="min-h-0 overflow-y-auto thin-scrollbar px-4 py-3"
  >
    <div className="flex items-baseline gap-2 mb-2">
      {/* Names the arithmetic (an average), so nobody quotes a figure
          from it. */}
      <span className="text-[12px] font-semibold text-content">
        Daily average
      </span>
      <span className="text-[11px] text-content/95">
        a day&rsquo;s sales &divide; its units
      </span>
    </div>
    <div
      className="grid px-1 py-1.5 text-[10px] font-medium uppercase tracking-wide text-content border-b border-line_hair sticky top-0 bg-custom-white"
      style={{ gridTemplateColumns: EST_COLS }}
    >
      <span>Price</span>
      <span>Type</span>
      <span className="text-right">Qty</span>
      <span className="text-right">GM%</span>
      <span className="text-right">Days</span>
    </div>
    {estimated.map((p) => (
      <div
        key={`${p.price}-${p.priceType}`}
        className="grid px-1 py-2 text-[13px] border-b border-line_faint even:bg-row_stripe"
        style={{ gridTemplateColumns: EST_COLS }}
      >
        <span className="tabular-nums text-content">
          {formatCurrency2(p.price)}
        </span>
        <span className="text-content/95">{p.priceType}</span>
        <span className="text-right tabular-nums text-content">
          {p.units % 1 === 0 ? p.units : p.units.toFixed(2)}
        </span>
        <span
          className={`text-right tabular-nums font-medium ${p.marginPct < 0 ? "text-delta_negative_text" : "text-delta_positive_text"}`}
        >
          {p.marginPct.toFixed(1)}%
        </span>
        <span className="text-right tabular-nums text-content">
          {p.daysSeen}
        </span>
      </div>
    ))}
    {estimated.length === 0 && (
      <div className="py-6 text-center text-[12.5px] text-content/95">
        No sales rows in this window
      </div>
    )}
  </div>
);

export default EstimatedColumn;
