// Utils
import { transactionLabel } from "../utils";

interface ReceiptBarProps {
  saleId: string;
  onBack: () => void;
}

/** Over an open receipt: Back to the list, and which transaction it is. It
 *  sits where the list's column header was, so the panel keeps its height. */
const ReceiptBar = ({ saleId, onBack }: ReceiptBarProps) => (
  <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-fill_muted border-b border-line_hair">
    <button
      onClick={onBack}
      className="text-[12px] font-semibold text-brand_navy hover:text-brand_navy/70 transition-colors"
    >
      ← Back
    </button>
    <span className="text-[11px] text-content/95">
      Transaction {transactionLabel(saleId)}
    </span>
  </div>
);

export default ReceiptBar;
