// Utils
import { formatCurrency2 } from "../../../../../utils";

// Interfaces
import type { suggestPrice } from "../../../../../utils/pricePoints";

// Components
import { ArrowTrendingUpIcon } from "@heroicons/react/20/solid";

interface SuggestionBandProps {
  suggestion: NonNullable<ReturnType<typeof suggestPrice>>;
}

/** The page's headline: the price the item moves fastest at, its margin, and
 *  how it compares with where it sells now. */
const SuggestionBand = ({ suggestion }: SuggestionBandProps) => (
  <div data-help="suggestion" className="px-4 pt-3 flex-shrink-0">
    <div className="rounded-lg border border-brand_navy/15 bg-brand_navy/[0.06] px-3 py-2.5">
      <div className="flex items-center gap-2 flex-wrap">
        <ArrowTrendingUpIcon className="w-4 h-4 text-brand_navy flex-shrink-0" />
        <span className="text-[12px] font-semibold uppercase tracking-wide text-brand_navy">
          Moves fastest at
        </span>
        <span className="text-[16px] font-bold text-brand_navy tabular-nums">
          {formatCurrency2(suggestion.best.point.price)}
        </span>
        <span className="text-[12px] text-brand_navy">
          {suggestion.best.point.priceType} ·{" "}
          {suggestion.best.velocity.toFixed(1)}/day over{" "}
          {suggestion.best.point.daysSeen}{" "}
          {suggestion.best.point.daysSeen === 1 ? "day" : "days"} ·{" "}
          {formatCurrency2(suggestion.best.point.marginPerUnit)}/unit at{" "}
          {suggestion.best.point.marginPct.toFixed(1)}% GM
        </span>
        {/* A price can be the fastest mover and still lose money on
            every unit. That has to outrank everything else on the row. */}
        {suggestion.best.point.marginPerUnit < 0 && (
          <span className="text-[11px] px-1.5 py-px rounded bg-severity_critical_bg text-severity_critical_text font-medium">
            Below cost
          </span>
        )}
        {suggestion.isCurrent && (
          <span className="text-[11px] px-1.5 py-px rounded bg-brand_navy/10 text-brand_navy font-medium">
            Already selling here
          </span>
        )}
      </div>

      {suggestion.current && (
        <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[12px] text-brand_navy">
          <span>
            Now at{" "}
            <span className="tabular-nums font-medium">
              {formatCurrency2(suggestion.current.point.price)}
            </span>{" "}
            · {suggestion.current.velocity.toFixed(1)}/day ·{" "}
            {suggestion.current.point.marginPct.toFixed(1)}% GM
          </span>
          {/* Selling faster and earning less is the case this whole
              band exists to make visible. */}
          <span
            className={`px-1.5 py-px rounded font-medium ${
              suggestion.profitDelta >= 0
                ? "bg-delta_positive_bg text-delta_positive_text"
                : "bg-delta_negative_bg text-delta_negative_text"
            }`}
          >
            {suggestion.profitDelta >= 0 ? "+" : "−"}
            {formatCurrency2(Math.abs(suggestion.profitDelta))}/day profit
          </span>
        </div>
      )}

      {suggestion.isCheapest && !suggestion.isCurrent && (
        <div className="mt-1.5 text-[11.5px] text-brand_navy/95">
          This is also the lowest price on record — volume at the cheapest price
          is expected, not a finding.
        </div>
      )}
    </div>
  </div>
);

export default SuggestionBand;
