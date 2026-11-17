// Utils
import { formatCurrencyCompact } from "../../../../../utils";
import { ACTION_TONE } from "../../utils/actionTone";
import { ACTION_LABEL } from "../../utils/verdict";
import { daysSince } from "../../utils/metrics";
import { COLS } from "../../utils";

// Interfaces
import type { ReceiptLine, SheetRow } from "../../interfaces";

// Components
import DeltaPill from "./DeltaPill";

interface ActionRowProps {
  row: SheetRow;
  receipts: ReceiptLine[];
  isSelected: boolean;
  receivingComplete: boolean;
  onSelect: () => void;
}

/** One item on the sheet: its action chip, the item, units and their change,
 *  received and net, days since the last delivery, and sales. Rows stay
 *  neutral and the chip carries the colour. */
const ActionRow = ({
  row,
  receipts,
  isSelected,
  receivingComplete,
  onSelect,
}: ActionRowProps) => {
  const { item, verdict } = row;
  const lastDays = receipts[0] ? daysSince(receipts[0].date) : null;
  const tone = ACTION_TONE[verdict.action];

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left border-b border-l-2 transition-colors ${
        isSelected
          ? "cc-row-selected"
          : "border-line_hair even:bg-row_stripe hover:bg-fill_soft"
      } ${tone.rule}`}
    >
      <div
        className="grid gap-3 px-3 py-2.5 items-center"
        style={{ gridTemplateColumns: COLS }}
      >
        {/* Truncating, not wrapping: a chip that wraps drags the row taller
            than its neighbours. The full label is one hover away. */}
        <span
          title={ACTION_LABEL[verdict.action]}
          className={`justify-self-start min-w-0 max-w-full truncate px-2 py-px rounded-full text-[12px] font-semibold ${tone.chip}`}
        >
          {ACTION_LABEL[verdict.action]}
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] font-medium text-content truncate">
            {item.description}
          </span>
          <span className="block text-[12px] font-medium text-content/95 truncate">
            {item.productCode} · {item.department} · {item.vendorName}
          </span>
        </span>
        {/* Priced selling units — the same basis as Recv and Net,
            which is what lets the three be read across the row. */}
        <span
          className={`text-right text-[13px] font-semibold tabular-nums ${
            item.ty.units > 0 ? "text-content" : "text-severity_critical_text"
          }`}
        >
          {item.ty.units % 1 === 0 ? item.ty.units : item.ty.units.toFixed(1)}
        </span>
        <DeltaPill pct={item.lwPct} />
        <DeltaPill pct={item.lyPct} />
        <span className="text-right text-[12px] font-medium tabular-nums text-content">
          {item.movement === null ? "—" : item.movement.received}
        </span>
        <span
          className={`text-right text-[12px] font-medium tabular-nums ${
            item.movement === null
              ? "text-content/95"
              : item.movement.net > 0
                ? "text-severity_watch_text"
                : "text-content/95"
          }`}
          title={
            item.movement
              ? `${item.movement.received} received, ${item.movement.sold} sold over ${item.movement.days} days`
              : undefined
          }
        >
          {item.movement === null
            ? "—"
            : `${item.movement.net > 0 ? "+" : ""}${item.movement.net}`}
        </span>
        <span
          className={`text-right text-[12px] font-medium tabular-nums ${
            lastDays === null
              ? "text-content/95"
              : lastDays > 21
                ? "text-severity_critical_text"
                : "text-content/95"
          }`}
        >
          {lastDays === null
            ? receivingComplete
              ? "none"
              : "…"
            : `${lastDays}d`}
        </span>
        <span className="text-right text-[12px] font-medium tabular-nums text-content/95">
          {item.ty.sales > 0 ? formatCurrencyCompact(item.ty.sales) : "$0"}
        </span>
      </div>
    </button>
  );
};

export default ActionRow;
