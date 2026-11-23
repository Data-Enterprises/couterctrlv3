// Utils
import { formatCurrency2 } from "../../../../utils";
import { formatClock, formatQty, GRID_COLS, transactionLabel } from "../utils";

// Interfaces
import type { SignalTransaction } from "../interfaces";

interface SignalTxnRowProps {
  txn: SignalTransaction;
  onOpen: () => void;
}

/** One transaction behind a signal: when, which, the cashier, its exception
 *  lines (marked when one is the last line), qty and amount. Opens the receipt. */
const SignalTxnRow = ({ txn: t, onOpen }: SignalTxnRowProps) => (
  <button
    onClick={onOpen}
    className={`w-full text-left grid ${GRID_COLS} px-4 py-2 text-[12px] text-content items-center transition-colors even:bg-row_stripe hover:bg-fill_soft`}
  >
    <div className="truncate">
      {t.saleDate} · {formatClock(t.startTime)}
    </div>
    <div className="truncate text-brand_navy font-medium">
      {transactionLabel(t.saleId)}
    </div>
    <div className="truncate">{t.cashierName || `#${t.cashierNumber}`}</div>
    <div
      className={t.hasLastLine ? "text-delta_negative_text font-medium" : ""}
    >
      {t.lineCount} of {t.totalLines}
      {t.hasLastLine ? " · last" : ""}
    </div>
    <div className="text-right">{formatQty(t.qty)}</div>
    <div className="text-right">{formatCurrency2(t.amount)}</div>
  </button>
);

export default SignalTxnRow;
