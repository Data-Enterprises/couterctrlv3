// Utils
import { formatCurrency2, formatDate } from "../../../../../../utils";

// Interfaces
import type { AggRow } from "../interfaces";

// Components
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/20/solid";

interface Props {
  agg: AggRow;
  idx: number;
  isExp: boolean;
  toggleCoupon: (key: string) => void;
  handleRowClick: (row: any) => void;
}

/** One coupon in the grid, and its uses when opened. */
const CouponRow = ({ agg, idx, isExp, toggleCoupon, handleRowClick }: Props) => (
    <>
      <tr
        key={agg.product_code}
        className={`cursor-pointer hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-row_stripe" : ""}`}
        onClick={() => toggleCoupon(agg.product_code)}
      >
        <td className="px-3 py-2 whitespace-nowrap tabular-nums">
          <div className="flex items-center gap-1.5">
            {isExp ? (
              <ChevronDownIcon className="w-3 h-3 text-content/30 flex-shrink-0" />
            ) : (
              <ChevronRightIcon className="w-3 h-3 text-content/30 flex-shrink-0" />
            )}
            <span className="text-content">
              {agg.product_code || "—"}
            </span>
          </div>
        </td>
        <td
          className="px-3 py-2 text-content font-medium truncate max-w-0"
          style={{ maxWidth: 180 }}
        >
          {agg.product_description}
        </td>
        <td className="px-3 py-2 text-content whitespace-nowrap">
          {agg.sub_department_description}
        </td>
        <td className="px-3 py-2 text-right tabular-nums text-content">
          {agg.uses.length}
        </td>
        <td className="px-3 py-2 text-right tabular-nums text-content">
          {agg.count}
        </td>
        <td className="px-3 py-2 text-right tabular-nums font-semibold text-content">
          {formatCurrency2(agg.total)}
        </td>
      </tr>
      {isExp && (
        <>
          <tr className="bg-gray-100/70 text-[11px]">
            <td className="pl-8 pr-3 py-1" />
            <td className="px-3 py-1 font-semibold uppercase tracking-wide text-content">
              Cashier
            </td>
            <td className="px-3 py-1 font-semibold uppercase tracking-wide text-content">
              Date
            </td>
            <td className="px-3 py-1 font-semibold uppercase tracking-wide text-content">
              Trans ID
            </td>
            <td className="px-3 py-1 font-semibold uppercase tracking-wide text-content text-right">
              Qty
            </td>
            <td className="px-3 py-1 font-semibold uppercase tracking-wide text-content text-right">
              Amount
            </td>
          </tr>
          {agg.uses.map((use) => (
            <tr
              key={use.sale_id}
              className="bg-gray-50/85 cursor-pointer hover:bg-blue-50/40 transition-colors text-[11px]"
              onClick={(e) => {
                e.stopPropagation();
                handleRowClick(use.row);
              }}
            >
              <td className="pl-8 pr-3 py-1.5" />
              <td
                className="px-3 py-1.5 text-content truncate max-w-0"
                style={{ maxWidth: 180 }}
              >
                {use.cashier_name}
              </td>
              <td className="px-3 py-1.5 text-content whitespace-nowrap">
                {formatDate(
                  use.sale_date.split("T")[0],
                )}
              </td>
              <td className="px-3 py-1.5 text-content whitespace-nowrap tabular-nums">
                {use.sale_id}
              </td>
              <td className="px-3 py-1.5 text-right tabular-nums text-content">
                {use.count}
              </td>
              <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-content">
                {formatCurrency2(use.amount)}
              </td>
            </tr>
          ))}
        </>
      )}
    </>
);

export default CouponRow;
