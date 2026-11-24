// Utils
import { formatCurrency2 } from "../../../../../utils";

// Interfaces
import type { ForecastOutlierRow } from "../../../../../features/forecastDevSlice";

interface ItemRowProps {
  row: ForecastOutlierRow;
  checked: boolean;
  /** The item is on the uploaded AD list. */
  isAd: boolean;
  onToggle: () => void;
}

/** One item in the list: its tick, description with AD and 1pt badges, UPC
 *  and forecast price. Ticking narrows what the grid covers. */
const ItemRow = ({ row, checked, isAd, onToggle }: ItemRowProps) => (
  <button
    onClick={onToggle}
    className={`w-full text-left flex items-start gap-2 px-3 py-2.5 border-b border-l-2 border-b-line_hair transition-colors ${
      checked ? "cc-row-selected" : "border-l-transparent hover:bg-fill_soft"
    }`}
  >
    <div
      className={`flex-shrink-0 mt-[1px] w-3.5 h-3.5 rounded border transition-colors ${
        checked
          ? "bg-brand_navy border-brand_navy"
          : "border-line_strong bg-custom-white"
      }`}
    >
      {checked && (
        <svg viewBox="0 0 10 10" className="w-full h-full text-custom-white">
          <polyline
            points="2,5 4,7.5 8,2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
    <div className="min-w-0 flex-1">
      <span
        className={`flex items-center gap-1 text-[12px] text-content ${
          checked ? "font-semibold" : "font-medium"
        }`}
      >
        <span className="truncate">{row.description}</span>
        {isAd && (
          <span className="flex-shrink-0 text-[9px] bg-brand_navy text-custom-white rounded px-0.5 font-medium">
            AD
          </span>
        )}
        {row.singlePrice && (
          <span className="flex-shrink-0 text-[9px] bg-severity_watch_bg text-severity_watch_text rounded px-0.5 font-medium">
            1pt
          </span>
        )}
      </span>
      <div className="flex items-center justify-between mt-0.5">
        <span className="text-[11px] font-medium text-content tabular-nums">
          {row.upc}
        </span>
        <span className="text-[11px] font-semibold text-content tabular-nums">
          {formatCurrency2(row.fcstPrice)}
        </span>
      </div>
    </div>
  </button>
);

export default ItemRow;
