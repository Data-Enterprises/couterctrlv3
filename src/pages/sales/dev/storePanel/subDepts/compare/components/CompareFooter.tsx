// Utils
import { LIST_ACTION_BTN } from "../../utils";

interface CompareFooterProps {
  aCount: number;
  bCount: number;
  onCopyA: () => void;
  onCopyB: () => void;
  onExport: () => void;
  onClearA: () => void;
}

/** Under the lists: copy either list's UPCs, export both, or drop A. */
const CompareFooter = ({ aCount, bCount, onCopyA, onCopyB, onExport, onClearA }: CompareFooterProps) => (
  <div className="cc-bar-footer py-2 flex-shrink-0">
    <div className="flex items-center gap-1.5">
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
    </div>
    <button onClick={onClearA} className="cc-muted-link text-[11px] font-semibold">
      Clear A
    </button>
  </div>
);

export default CompareFooter;
