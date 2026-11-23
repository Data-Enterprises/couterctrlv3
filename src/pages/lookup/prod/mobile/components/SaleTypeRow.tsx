// Utils
import { formatCurrency2 } from "../../../../../utils";
import { formatUnits } from "../../utils";

// Interfaces
import type { SaleTypeSummary } from "../../../../../features/itemLookupSlice";

interface SaleTypeRowProps {
  saleType: SaleTypeSummary;
  isSelected: boolean;
  weighed: boolean;
  /** Sale dollars, the denominator for every other type's share. */
  saleDollars: number;
  onPick: () => void;
}

/** One sale type on the header card: its dollars, days, units and share of
 *  sales. Tapping it shows that type's timeline. */
const SaleTypeRow = ({
  saleType: s,
  isSelected,
  weighed,
  saleDollars,
  onPick,
}: SaleTypeRowProps) => (
  <button
    type="button"
    aria-pressed={isSelected}
    onClick={onPick}
    className={`block w-full border-l-2 border-t border-line_hair px-3.5 py-2.5 text-left first:border-t-0 ${
      isSelected
        ? "border-l-brand_navy bg-row_selected"
        : "border-l-transparent active:bg-bkg"
    }`}
  >
    <div className="flex items-baseline justify-between gap-2">
      <span className="font-display text-[13px] font-semibold text-content">
        {s.saleType}
      </span>
      <span className="text-[13px] font-bold text-content">
        {formatCurrency2(s.sales)}
      </span>
    </div>
    <div className="mt-0.5 flex items-baseline gap-3 text-[11px] text-content/95">
      <span>
        {s.days} {s.days === 1 ? "day" : "days"}
      </span>
      <span className="font-semibold text-content">
        {formatUnits(s.units, weighed)}
      </span>
      {/* Sale is the denominator, so a percentage of itself
          would be 100% pretending to be information. */}
      {s.saleType !== "Sale" && saleDollars > 0 && (
        <span>{((s.sales / saleDollars) * 100).toFixed(2)}% of sales</span>
      )}
    </div>
  </button>
);

export default SaleTypeRow;
