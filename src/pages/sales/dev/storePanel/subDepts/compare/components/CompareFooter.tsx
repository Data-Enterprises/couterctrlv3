// Utils
import { LIST_ACTION_BTN } from "../../utils";

interface CompareFooterProps {
  line: string;
  count: number;
  onCopy: () => void;
  onShow: () => void;
}

/** Under the open tab: how many from each list, copy their UPCs, or show
 *  them in the item list. */
const CompareFooter = ({ line, count, onCopy, onShow }: CompareFooterProps) => (
  <div className="cc-bar-footer px-4 py-2 flex-shrink-0 gap-3">
    <span className="truncate text-[11.5px] text-content">{line}</span>
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <button disabled={count === 0} onClick={onCopy} title="Copy the open tab's UPCs" className={LIST_ACTION_BTN}>
        Copy UPCs
      </button>
      <button
        data-help="compare-show"
        disabled={count === 0}
        onClick={onShow}
        title="Close the drawer and show the open tab's items in the list"
        className="cc-btn-primary px-2.5 py-0.5 text-[11px]"
      >
        Show in list
      </button>
    </div>
  </div>
);

export default CompareFooter;
