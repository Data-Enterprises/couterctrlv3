// Hooks
import { useAppDispatch } from "../../../../../hooks";

// Redux
import { setSelectedCouponSection } from "../../../../../features/dev/devCouponSalesSlice";

// Utils
import { formatCurrency2, formatBigNumber } from "../../../../../utils";
import { couponDotClass } from "../../utils";

// Interfaces
import type { buildBreakdownRows } from "../../utils";

interface SectionRowProps {
  row: ReturnType<typeof buildBreakdownRows>[number];
  isSel: boolean;
  /** Items stack their figures under the description; the other breakdowns
   *  keep the aligned grid. */
  isItemView: boolean;
}

/** One sub department, cashier or item: its grade, its figures and its
 *  average, picked to narrow the transactions. */
const SectionRow = ({ row, isSel, isItemView }: SectionRowProps) => {
  const dispatch = useAppDispatch();
  return (
    <button
      onClick={() => dispatch(setSelectedCouponSection(isSel ? null : row.key))}
      className={`w-full ${
        isItemView ? "block" : "grid items-center"
      } border-b border-gray-100 border-l-2 text-left transition-colors ${
        isSel
          ? "bg-row_selected border-l-row_selected_border"
          : "border-l-transparent hover:bg-gray-50"
      }`}
      style={
        isItemView
          ? undefined
          : { gridTemplateColumns: "1fr 0.62fr 0.4fr 0.4fr 0.55fr" }
      }
    >
      {isItemView ? (
        <>
          {/* Item descriptions are far longer than a sub dept or
              cashier name, so they take the full width on their
              own line. The metrics then repeat the header's grid
              below, keeping each figure under its own column. */}
          <div className="px-2 pt-2 pb-1 flex items-center gap-1.5 min-w-0">
            <span
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${couponDotClass[row.tier]}`}
            />
            <span className="text-[12px] font-medium text-content truncate">
              {row.label}
            </span>
          </div>
          <div
            className="grid items-center pb-2"
            style={{ gridTemplateColumns: "1fr 0.62fr 0.4fr 0.4fr 0.55fr" }}
          >
            <div />
            <div className="px-2 text-[12px] font-semibold text-content text-right">
              {formatCurrency2(row.amount)}
            </div>
            <div className="px-1.5 text-[12px] font-medium text-content text-right">
              {formatBigNumber(row.transactions, 0)}
            </div>
            <div className="px-1.5 text-[12px] font-medium text-content text-right">
              {formatBigNumber(row.lines, 0)}
            </div>
            <div className="px-2 text-right">
              <span
                className={`text-[12px] font-semibold px-1.5 py-0.5 rounded ${
                  row.tier === "critical"
                    ? "bg-severity_critical_bg text-severity_critical_text"
                    : "bg-severity_healthy_bg text-severity_healthy_text"
                }`}
              >
                {formatCurrency2(row.avgAmount)}
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="px-2 py-[11px] flex items-center gap-1.5 min-w-0">
            <span
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${couponDotClass[row.tier]}`}
            />
            <span className="text-[12px] font-medium text-content truncate">
              {row.label}
            </span>
          </div>
          <div className="px-2 py-[11px] text-[12px] font-semibold text-content text-right">
            {formatCurrency2(row.amount)}
          </div>
          <div className="px-1.5 py-[11px] text-[12px] font-medium text-content text-right">
            {formatBigNumber(row.transactions, 0)}
          </div>
          <div className="px-1.5 py-[11px] text-[12px] font-medium text-content text-right">
            {formatBigNumber(row.lines, 0)}
          </div>
          <div className="px-2 py-[11px] text-right">
            <span
              className={`text-[12px] font-semibold px-1.5 py-0.5 rounded ${
                row.tier === "critical"
                  ? "bg-severity_critical_bg text-severity_critical_text"
                  : "bg-severity_healthy_bg text-severity_healthy_text"
              }`}
            >
              {formatCurrency2(row.avgAmount)}
            </span>
          </div>
        </>
      )}
    </button>
  );
};

export default SectionRow;
