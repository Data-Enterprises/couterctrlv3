// Utils
import { formatCurrency2 } from "../../../../utils";

// Interfaces
import type { Signal } from "../interfaces";

interface SignalSummaryProps {
  signal: Signal;
}

/** The picked signal's name, with its lines, transactions and amount. */
const SignalSummary = ({ signal }: SignalSummaryProps) => (
  <div className="px-4 py-2.5 border-b border-line_hair flex-shrink-0">
    <div className="text-[13.5px] font-medium text-content">{signal.label}</div>
    <div className="text-[11px] text-content/95 mt-0.5">
      {signal.count} exception {signal.count === 1 ? "line" : "lines"} ·{" "}
      {signal.transactions}{" "}
      {signal.transactions === 1 ? "transaction" : "transactions"} ·{" "}
      {formatCurrency2(signal.amount)}
    </div>
  </div>
);

export default SignalSummary;
