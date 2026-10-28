import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { formatCurrency2 } from "../../../../utils";

interface Props {
  label: string;
  count: number;
  total: number;
  onClick: () => void;
}

/**
 * One grouped row — a store, a sub department, a date, a cashier.
 *
 * The count used to float unlabelled between the name and the money, which
 * read as a second amount at a glance. It now carries its own word on the
 * second line beside the average, the same shape the Cashiers and Performance
 * rows use: the name and the figure you scan on line one, the detail that
 * qualifies them on line two.
 *
 * Average is derived rather than passed: it is total over count and nothing
 * else, and a caller computing it is a caller that can compute it differently.
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
