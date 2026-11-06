// Utils
import { formatCurrency2 } from "../../../../utils";

// Components
import { ChevronRightIcon } from "@heroicons/react/20/solid";

interface Props {
  label: string;
  count: number;
  total: number;
  onClick: () => void;
}

/**
 * One grouped row: a store, a sub department, a date or a cashier. The count
 * sits on line two beside the average, which is derived as total over count.
 */
const CpnSectionRow = ({ label, count, total, onClick }: Props) => (
  <button
    type="button"
    onClick={onClick}
    className="block w-full border-t border-brand_line px-3.5 py-3 text-left first:border-t-0 active:bg-bkg"
  >
    <div className="flex items-baseline gap-2">
      <span className="min-w-0 flex-1 truncate font-display text-[13.5px] font-semibold text-content">
        {label}
      </span>
      <span className="flex-none font-display text-[13px] font-bold tabular-nums text-content">
        {formatCurrency2(total)}
      </span>
      <ChevronRightIcon className="h-4 w-4 flex-none self-center text-content/95" />
    </div>
    <div className="mt-1 truncate font-mono text-[12px] tabular-nums text-content/95">
      <span className="uppercase tracking-wider">Coupons</span>{" "}
      {count.toLocaleString("en-US")}
      {" · "}
      <span className="uppercase tracking-wider">Avg</span>{" "}
      {formatCurrency2(count > 0 ? total / count : 0)}
    </div>
  </button>
);

export default CpnSectionRow;
