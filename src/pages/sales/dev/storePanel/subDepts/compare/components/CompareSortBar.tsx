// Utils
import { SORTS } from "../utils";

// Interfaces
import type { CompareSort } from "../interfaces";

interface CompareSortBarProps {
  sort: CompareSort;
  onSort: (s: CompareSort) => void;
}

/** One sort that ranks both lists, so a row reads across. */
const CompareSortBar = ({ sort, onSort }: CompareSortBarProps) => (
  <div className="flex items-center gap-2 px-4 py-1.5 border-b border-line_hair flex-shrink-0">
    <span className="cc-caps text-[10px]">Sort</span>
    <div className="flex rounded-md border border-brand_navy/35 overflow-hidden">
      {SORTS.map((s) => (
        <button
          key={s.value}
          onClick={() => onSort(s.value)}
          className={`px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
            sort === s.value ? "bg-brand_navy text-custom-white" : "text-content hover:bg-fill_soft"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
    <span className="ml-auto text-[11px] font-medium text-content">Both lists sort together</span>
  </div>
);

export default CompareSortBar;
