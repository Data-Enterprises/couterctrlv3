// Utils
import { formatCurrency2 } from "../../../../../utils";
import { fmtDate } from "../utils";

// Interfaces
import type { TransactionOverview } from "../../../../../interfaces";

interface TransactionRowsProps {
  fetchingCashierTransactions: boolean;
  transactionLoadingMessage: string;
  filteredOverviews: TransactionOverview[];
  handleRowClick: (o: TransactionOverview) => void;
}

/** The transactions, each ID opening its receipt. */
const TransactionRows = ({
  fetchingCashierTransactions,
  transactionLoadingMessage,
  filteredOverviews,
  handleRowClick,
}: TransactionRowsProps) => {
  return (
    <>
    {fetchingCashierTransactions ? (
      <div className="flex items-center justify-center h-24 text-[11px] text-content/95">
        {transactionLoadingMessage || "Loading…"}
      </div>
    ) : (
      filteredOverviews.map((o, i) => (
        <div
          key={o.transaction_id + i}
          className="grid border-b border-b-brand_navy/15 hover:bg-fill_soft transition-colors"
          style={{
            gridTemplateColumns: "1fr 0.7fr 0.45fr 0.6fr",
            background:
              i % 2 === 1
                ? "rgb(var(--color-brand-navy) / 0.015)"
                : undefined,
          }}
        >
          <button
            onClick={() => handleRowClick(o)}
            className="px-3 py-2 text-[13px] font-semibold text-brand_navy underline underline-offset-2 text-left truncate"
          >
            {o.transaction_id}
          </button>
          <div className="px-3 py-2 text-[13px] text-content">
            {fmtDate(o.sale_date)}
          </div>
          <div className="px-3 py-2 text-[13px] text-content text-right tabular-nums">
            {o.qty}
          </div>
          <div className="px-3 py-2 text-[13px] text-content text-right tabular-nums">
            {formatCurrency2(o.total_sales)}
          </div>
        </div>
      ))
    )}
    </>
  );
};

export default TransactionRows;
