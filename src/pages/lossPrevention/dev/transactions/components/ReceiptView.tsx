// Interfaces
import type { TransactionListItem } from "../../../../../interfaces";

// Components
import Transaction from "../../../../../components-dev/transactions/Transaction";
import LoadingIndicator from "../../../../../components-dev/loading/LoadingIndicator";

interface ReceiptViewProps {
  isReceiptLoading: boolean;
  receiptData: TransactionListItem[] | null;
  onBack: () => void;
}

/** One transaction's receipt, with a way back to the list. */
const ReceiptView = ({ isReceiptLoading, receiptData, onBack }: ReceiptViewProps) => {
  return (
    <>
      {/* Back bar — same height slot as the filter header so layout doesn't shift */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-gray-100 border-b border-line_hair">
        <button
          onClick={onBack}
          className="text-[12px] font-semibold text-brand_navy hover:text-brand_navy/70 transition-colors"
        >
          ← Back
        </button>
      </div>
      {/* Transaction component fills remaining space */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {isReceiptLoading ? (
          <div className="flex-1 relative">
            <LoadingIndicator message="Fetching transaction…" />
          </div>
        ) : receiptData ? (
          <Transaction trans={receiptData} />
        ) : null}
      </div>
    </>
  );
};

export default ReceiptView;
