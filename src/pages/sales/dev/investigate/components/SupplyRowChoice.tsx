// Utils
import { supplyLabel } from "../utils/supplyRows";

// Interfaces
import type { SupplyRow } from "../interfaces";

// Components
import { ChevronRightIcon } from "@heroicons/react/20/solid";

interface SupplyRowChoiceProps {
  row: SupplyRow;
  us: string;
  them: string;
  /** False when this row's documents could not be read. */
  read: boolean;
  on: boolean;
  onPick: () => void;
}

/** One of the Supply tab's rows. Picking it slides the documents card to
 *  that store's orders or receipts. A received row wears a hollow dot. */
const SupplyRowChoice = ({ row, us, them, read, on, onPick }: SupplyRowChoiceProps) => {
  const label = supplyLabel(row, us, them);
  const n = row.docs.length;
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={on}
      className={`grid grid-cols-[10px_minmax(0,1fr)_96px_104px_14px] gap-2.5 items-center w-full px-2 py-1.5 rounded-md border text-left transition-colors ${
        on ? "cc-row-selected" : "border-transparent hover:bg-fill_soft"
      }`}
    >
      <span
        className={`w-2.5 h-2.5 rounded-full border-2 ${
          row.mine ? "border-store_open" : "border-store_compare"
        } ${row.isOrder ? (row.mine ? "bg-store_open" : "bg-store_compare") : ""}`}
      />
      <span
        className={`flex items-center gap-1.5 min-w-0 text-[13px] text-content/95 ${
          on ? "font-semibold" : ""
        }`}
      >
        <span>{label.pre}</span>
        <span
          className={`w-[7px] h-[7px] rounded-full flex-shrink-0 ${
            row.mine ? "bg-store_open" : "bg-store_compare"
          }`}
        />
        <span className="font-bold text-content">{label.store}</span>
      </span>
      <span className="text-right text-[12.5px] text-content/95 tabular-nums whitespace-nowrap">
        {read ? `${n.toLocaleString("en-US")} ${row.isOrder ? "order" : "receiver"}${n === 1 ? "" : "s"}` : "not read"}
      </span>
      <span className="text-right text-[13px] font-bold tabular-nums text-content whitespace-nowrap">
        {read ? `${Math.round(row.units).toLocaleString("en-US")} units` : "—"}
      </span>
      <ChevronRightIcon
        className={`w-3.5 h-3.5 ${on ? "text-brand_navy" : "text-brand_slate_2"}`}
      />
    </button>
  );
};

export default SupplyRowChoice;
