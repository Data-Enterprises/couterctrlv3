// Utils
import { GRID_COLS, TXN_COLUMNS } from "../utils";

// Interfaces
import type { SortCol, TxnSort } from "../interfaces";

// Components
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";

interface TxnSortHeadProps {
  sort: TxnSort;
  onSort: (col: SortCol) => void;
}

/** The transaction list's heading row; Date, Transaction, Qty and Amount sort. */
const TxnSortHead = ({ sort, onSort }: TxnSortHeadProps) => (
  <div
    className={`grid ${GRID_COLS} px-4 py-1.5 bg-fill_soft text-[10px] cc-caps-strong flex-shrink-0`}
  >
    {TXN_COLUMNS.map(({ col, label, align }) =>
      col ? (
        <button
          key={label}
          onClick={() => onSort(col)}
          className={`flex items-center gap-0.5 uppercase tracking-wide cc-muted-link ${align}`}
        >
          {label}
          {sort?.col === col &&
            (sort.dir === "desc" ? (
              <ChevronDownIcon className="w-3 h-3" />
            ) : (
              <ChevronUpIcon className="w-3 h-3" />
            ))}
        </button>
      ) : (
        <div key={label} className={align}>
          {label}
        </div>
      ),
    )}
  </div>
);

export default TxnSortHead;
