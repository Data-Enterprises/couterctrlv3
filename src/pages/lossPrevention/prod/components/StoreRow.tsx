// Utils
import { formatCurrency2, formatBigNumber } from "../../../../utils";
import { severityDotClass } from "../../../../utils/severity";

// Interfaces
import type { GradedStore } from "../hooks/stores";

// Components
import PctPill from "./PctPill";

interface StoreRowProps {
  store: GradedStore;
  isSelected: boolean;
  hasAmount: boolean;
  onSelect: () => void;
}

/** One store in the list: its severity dot, name, and transactions, quantity,
 *  total and average, each tinted by its change against the baseline. */
const StoreRow = ({
  store,
  isSelected,
  hasAmount,
  onSelect,
}: StoreRowProps) => {
  const { detail, name, sev, transPct, itemsPct, amountPct, avgPct } = store;

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-2.5 p-3 text-left transition-colors border-l-2 border-b border-b-brand_navy/15 ${
        isSelected ? "cc-row-selected" : "border-transparent hover:bg-fill_soft"
      }`}
    >
      <span
        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${severityDotClass[sev]}`}
      />
      <span className="text-[13px] font-medium text-content truncate flex-1">
        {name}
      </span>
      <div className="flex items-center gap-[14px]">
        <PctPill pct={transPct} minWidth={58}>
          {formatBigNumber(detail.transaction_count, 0)}
        </PctPill>
        <PctPill pct={itemsPct} minWidth={58}>
          {formatBigNumber(detail.total_items, 0)}
        </PctPill>
        {hasAmount && (
          <PctPill pct={amountPct} minWidth={64}>
            {formatCurrency2(Math.abs(detail.amount))}
          </PctPill>
        )}
        {hasAmount && (
          <PctPill pct={avgPct} minWidth={58}>
            {formatCurrency2(Math.abs(detail.average_dollars))}
          </PctPill>
        )}
      </div>
    </button>
  );
};

export default StoreRow;
