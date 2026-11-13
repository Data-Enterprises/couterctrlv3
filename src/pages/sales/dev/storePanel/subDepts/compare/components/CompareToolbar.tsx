// Utils
import { LIST_ACTION_BTN } from "../../utils";
import { SORTS } from "../utils";

// Interfaces
import type { CompareSort } from "../interfaces";

interface CompareToolbarProps {
  sort: CompareSort;
  onSort: (s: CompareSort) => void;
  aCount: number;
  bCount: number;
  onCopyA: () => void;
  onCopyB: () => void;
  onExport: () => void;
  onClearA: () => void;
}

/** Above the lists: the one sort that ranks both, then copy either list's
 *  UPCs, export both, or drop A. */
const CompareToolbar = ({
  sort,
  onSort,
  aCount,
  bCount,
  onCopyA,
  onCopyB,
  onExport,
  onClearA,
}: CompareToolbarProps) => (
  <div className="flex items-center gap-2 px-4 py-1.5 border-b border-line_hair flex-shrink-0">
    <span className="cc-caps text-[10px]">Sort</span>
    <div className="flex rounded-md border border-brand_navy/35 overflow-hidden flex-shrink-0">
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
    <span className="truncate text-[11px] font-medium text-content">Both lists sort together</span>
    <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
      <button disabled={aCount === 0} onClick={onCopyA} className={LIST_ACTION_BTN}>
        Copy A's {aCount.toLocaleString()} UPC{aCount === 1 ? "" : "s"}
      </button>
      <button disabled={bCount === 0} onClick={onCopyB} className={LIST_ACTION_BTN}>
        Copy B's {bCount.toLocaleString()} UPC{bCount === 1 ? "" : "s"}
      </button>
      <button
        data-help="compare-export"
        disabled={aCount + bCount === 0}
        onClick={onExport}
        title="Download both lists and their totals as a CSV file"
        className="cc-btn-primary px-2.5 py-0.5 text-[11px]"
      >
        Export CSV
      </button>
      <button onClick={onClearA} className="cc-muted-link px-1 text-[11px] font-semibold">
        Clear A
      </button>
    </div>
  </div>
);

export default CompareToolbar;
