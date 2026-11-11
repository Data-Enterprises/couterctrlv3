// Hooks
import { useAppDispatch } from "../../../../../hooks";

// Redux
import { setSelectedCouponSection } from "../../../../../features/dev/devCouponSalesSlice";

// Utils
import { formatCurrency2, formatBigNumber } from "../../../../../utils";
import { totalsFor, type buildBreakdownRows, type CouponTransaction } from "../../utils";

// Interfaces
import type { CouponItem } from "../../../../../interfaces";
import type { TxSortCol } from "../interfaces";
import type { useTriStateSort } from "../../../../../utils/useTriStateSort";

// Components
import SortHeader from "../../../../../components-dev/SortHeader";

interface TransactionsPaneProps {
  selectedSection: ReturnType<typeof buildBreakdownRows>[number] | undefined;
  transactions: CouponTransaction[];
  scopedCoupons: CouponItem[];
  txSort: ReturnType<typeof useTriStateSort<TxSortCol>>;
  onOpen: (t: CouponTransaction) => void;
}

/** The transactions for the selection (every one in the store when nothing
 *  is picked), each opening its receipt. */
const TransactionsPane = ({ selectedSection, transactions, scopedCoupons, txSort, onOpen }: TransactionsPaneProps) => {
  const dispatch = useAppDispatch();
  return (
    <>
    <div className="flex-shrink-0 px-3.5 py-1.5 border-b border-line_hair bg-gray-100 flex items-center gap-2">
      <span className="text-[11px] font-semibold text-content truncate">
        {selectedSection ? selectedSection.label : "All transactions"}
      </span>
      <span className="text-[11px] text-content truncate">
        {formatBigNumber(transactions.length, 0)} transactions ·{" "}
        {formatCurrency2(totalsFor(scopedCoupons).avgAmount)} avg
      </span>
      {selectedSection && (
        <>
          <div className="flex-1" />
          <button
            onClick={() => dispatch(setSelectedCouponSection(null))}
            className="text-[11px] font-medium text-content hover:underline transition-colors flex-shrink-0"
          >
            Clear
          </button>
        </>
      )}
    </div>

    <div
      className="flex-shrink-0 grid border-b border-line_hair bg-fill_soft"
      style={{ gridTemplateColumns: "1.4fr 1fr 0.6fr 0.7fr" }}
    >
      {(["Transaction", "Cashier"] as const).map((h) => (
        <div
          key={h}
          className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-content text-left"
        >
          {h}
        </div>
      ))}
      <SortHeader
        col="count"
        label="Count"
        sort={txSort.sort}
        onSort={txSort.handleSort}
        className="px-3 py-1.5 text-[9px] font-bold justify-end uppercase tracking-wide text-content hover:underline"
      />
      <SortHeader
        col="amount"
        label="Amount"
        sort={txSort.sort}
        onSort={txSort.handleSort}
        className="px-3 py-1.5 text-[9px] font-bold justify-end uppercase tracking-wide text-content hover:underline"
      />
    </div>

    <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
      {transactions.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-[11px] text-content/95">
          No transactions in this selection
        </div>
      ) : (
        transactions.map((t) => (
          <button
            key={t.sale_id}
            onClick={() => onOpen(t)}
            className="w-full grid items-center border-b border-line_hair text-left hover:bg-fill_soft transition-colors even:bg-row_stripe"
            style={{ gridTemplateColumns: "1.4fr 1fr 0.6fr 0.7fr" }}
          >
            {/* No grade dot here — a transaction is almost always a
                single coupon, so the dot just restated Amount vs the
                threshold on every row. Grading lives at the store and
                section levels, where it aggregates something. */}
            <div className="px-3 py-2 flex items-center gap-1.5 min-w-0">
              <span className="min-w-0">
                {/* Underlined like LP's TRANS ID column — signals
                    the row drills into the coupon lines. */}
                <span className="block text-[12px] font-medium text-content truncate underline underline-offset-2 decoration-content/40">
                  #{t.sale_id}
                </span>
                <span className="block text-[11px] text-content truncate">
                  {t.sale_date}
                  {t.terminal ? ` · Term ${t.terminal}` : ""}
                </span>
              </span>
            </div>
            <div className="px-3 py-2 text-[12px] font-medium text-content truncate">
              {t.cashier_name || `Cashier ${t.cashier_number}`}
            </div>
            <div className="px-3 py-2 text-[12px] font-semibold text-content text-right">
              {formatBigNumber(t.lines, 0)}
            </div>
            {/* No Avg column — a transaction almost always carries a
                single coupon, so it would just repeat Amount. The
                severity dot already carries the grade, and the
                Coupons count shows when the two would differ. */}
            <div className="px-3 py-2 text-[12px] font-semibold text-content text-right">
              {formatCurrency2(t.amount)}
            </div>
          </button>
        ))
      )}
    </div>
    </>
  );
};

export default TransactionsPane;
