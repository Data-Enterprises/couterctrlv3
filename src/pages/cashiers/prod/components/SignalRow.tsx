// Utils
import { formatCurrency2 } from "../../../../utils";
import { SPREAD_STYLES } from "../utils";

// Interfaces
import type { Signal } from "../interfaces";

interface SignalRowProps {
  signal: Signal;
  isSelected: boolean;
  onSelect: () => void;
}

/** One signal in the lens list: its label, lines and transactions, amount and
 *  how widely it is spread. */
const SignalRow = ({ signal: s, isSelected, onSelect }: SignalRowProps) => (
  <button
    onClick={onSelect}
    className={`w-full text-left px-3 py-2 transition-colors ${
      isSelected ? "cc-row-selected" : "even:bg-row_stripe hover:bg-fill_soft"
    }`}
    style={
      isSelected
        ? {
            boxShadow: "inset 2px 0 0 rgb(var(--color-row-selected-border))",
          }
        : undefined
    }
  >
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[12.5px] font-medium text-content truncate">
        {s.label}
      </span>
      {/* Two numbers: one transaction with 15 voids is not 15
          transactions with one void each. */}
      <span
        className="text-[12.5px] font-medium text-content flex-shrink-0"
        title={`${s.count} exception lines across ${s.transactions} transactions`}
      >
        {s.count}
        <span className="text-content/95"> · {s.transactions}</span>
      </span>
    </div>
    <div className="flex items-center justify-between gap-2 mt-0.5">
      <span className="text-[10.5px] text-content/95 truncate">
        {s.sublabel ? `${s.sublabel} · ` : ""}
        {formatCurrency2(s.amount)}
      </span>
      <span
        className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${SPREAD_STYLES[s.spread]}`}
      >
        {s.spreadLabel}
      </span>
    </div>
  </button>
);

export default SignalRow;
