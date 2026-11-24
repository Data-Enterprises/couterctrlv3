// Utils
import { formatCurrency2, formatDate } from "../../../../../utils";

// Interfaces
import type { AggRow, AggUse } from "../interfaces";

// Components
import { ChevronRightIcon, ChevronDownIcon } from "@heroicons/react/20/solid";

interface CpnProductRowProps {
  agg: AggRow;
  expanded: boolean;
  onToggle: () => void;
  onUse: (use: AggUse) => void;
}

/** One product's coupons on the phone: its name, code, count and total,
 *  opening to a row per use that opens that receipt. */
const CpnProductRow = ({
  agg,
  expanded,
  onToggle,
  onUse,
}: CpnProductRowProps) => (
  <div className="border-b border-brand_line last:border-b-0">
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-3.5 py-2.5 text-left active:bg-bkg"
    >
      {expanded ? (
        <ChevronDownIcon className="w-3.5 h-3.5 text-content/95 flex-shrink-0" />
      ) : (
        <ChevronRightIcon className="w-3.5 h-3.5 text-content/95 flex-shrink-0" />
      )}
      <span className="flex-1 text-[11px] font-medium text-content truncate">
        {agg.product_description}
      </span>
      <span className="text-[10px] text-content/95 flex-shrink-0">
        {agg.product_code}
      </span>
      <span className="text-[10px] text-content/95 flex-shrink-0">
        {agg.count}×
      </span>
      <span className="text-[11px] font-semibold text-content flex-shrink-0 tabular-nums">
        {formatCurrency2(agg.total)}
      </span>
    </button>
    {expanded && (
      <div className="border-t border-brand_line">
        <div className="grid grid-cols-4 gap-2 px-3.5 py-1 bg-fill_muted border-b border-brand_line">
          {["Cashier", "Date", "Trans #", "Amt"].map((h, i) => (
            <div
              key={h}
              className={`text-[10px] cc-caps ${i === 3 ? "text-right" : ""}`}
            >
              {h}
            </div>
          ))}
        </div>
        {agg.uses.map((use) => (
          <button
            key={use.sale_id}
            onClick={() => onUse(use)}
            className="w-full grid grid-cols-4 gap-2 px-3.5 py-2 border-b border-brand_line last:border-0 text-left active:bg-bkg"
          >
            <span className="text-[10px] text-content/95 truncate">
              {use.cashier_name}
            </span>
            <span className="text-[10px] text-content/95">
              {formatDate(use.sale_date.split("T")[0])}
            </span>
            <span className="text-[10px] text-content/95 tabular-nums">
              #{use.sale_id}
            </span>
            <span className="text-[10px] font-semibold text-content text-right tabular-nums">
              {formatCurrency2(use.amount)}
            </span>
          </button>
        ))}
      </div>
    )}
  </div>
);

export default CpnProductRow;
