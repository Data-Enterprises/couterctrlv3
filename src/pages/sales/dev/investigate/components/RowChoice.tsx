// Utils
import { rowLabel } from "../utils/holdsRows";

// Interfaces
import type { HoldsRow } from "../interfaces";

// Components
import { ChevronRightIcon } from "@heroicons/react/20/solid";

interface RowChoiceProps {
  row: HoldsRow;
  us: string;
  them: string;
  fmt: (v: number) => string;
  on: boolean;
  onPick: () => void;
}

/** One of the Summary's rows. Picking it slides the items card to its items. */
const RowChoice = ({ row, us, them, fmt, on, onPick }: RowChoiceProps) => {
  const label = rowLabel(row.kind, us, them);
  const empty = row.items.length === 0;
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={on}
      className={`grid grid-cols-[10px_minmax(0,1fr)_auto_96px_14px] gap-2.5 items-center w-full px-2 py-1.5 rounded-md border text-left transition-colors ${
        on ? "cc-row-selected" : "border-transparent hover:bg-fill_soft"
      }`}
    >
      <span
        className={`w-2.5 h-2.5 rounded-full ${
          empty ? "bg-bkg" : row.total < 0 ? "bg-red-500" : "bg-emerald-500"
        }`}
      />
      <span
        className={`flex items-center gap-1.5 min-w-0 text-[13px] text-content/95 ${
          on ? "font-semibold" : ""
        }`}
      >
        <span>{label.pre}</span>
        <span
          className={`w-[7px] h-[7px] rounded-full flex-shrink-0 ${
            label.mine ? "bg-store_open" : "bg-store_compare"
          }`}
        />
        <span className="font-bold text-content">{label.store}</span>
        <span>{label.post}</span>
      </span>
      <span className="text-[12.5px] text-content/95 tabular-nums whitespace-nowrap">
        {row.items.length.toLocaleString("en-US")} items
      </span>
      <span
        className={`text-right text-[13px] font-bold tabular-nums whitespace-nowrap ${
          empty
            ? "text-content/95"
            : row.total < 0
              ? "text-delta_negative_text"
              : "text-delta_positive_text"
        }`}
      >
        {row.total < 0 ? "−" : "+"}
        {fmt(Math.abs(row.total))}
      </span>
      <ChevronRightIcon
        className={`w-3.5 h-3.5 ${on ? "text-brand_navy" : "text-brand_slate_2"}`}
      />
    </button>
  );
};

export default RowChoice;
