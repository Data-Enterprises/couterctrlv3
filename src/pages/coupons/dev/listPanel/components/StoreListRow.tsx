// Utils
import { formatCurrency2 } from "../../../../../utils";

interface StoreListRowProps {
  label: string;
  count: number;
  total: number;
  selected: boolean;
  /** "All stores" is set in bold and never truncates. */
  isAll?: boolean;
  onClick: () => void;
}

/** One row of the store list, or its "All stores" row: the name, the coupon
 *  count and the coupons' value. */
const StoreListRow = ({
  label,
  count,
  total,
  selected,
  isAll = false,
  onClick,
}: StoreListRowProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors border-l-2 ${
      selected ? "cc-row-selected" : "border-transparent hover:bg-fill_soft"
    }`}
  >
    <span
      className={
        isAll
          ? "text-[12px] font-semibold text-content"
          : "text-[12px] text-content truncate flex-1 mr-2"
      }
    >
      {label}
    </span>
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className="text-[11px] text-content/95">{count}</span>
      <span className="text-[11px] font-medium text-content/95">
        {formatCurrency2(total)}
      </span>
    </div>
  </button>
);

export default StoreListRow;
