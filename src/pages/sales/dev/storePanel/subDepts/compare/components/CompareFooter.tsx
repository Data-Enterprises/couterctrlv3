// Utils
import { LIST_ACTION_BTN } from "../../utils";

interface CompareFooterProps {
  line: string;
  count: number;
  onCopy: () => void;
  onShow: () => void;
}

/** Under the open tab: what it holds, copy its UPCs, or show those items in
 *  the item list. */
const CompareFooter = ({ line, count, onCopy, onShow }: CompareFooterProps) => (
  <div className="cc-bar-footer px-[18px] py-2.5 flex-shrink-0 gap-3">
    <span className="truncate text-[12px] text-content">{line}</span>
    <div className="flex items-center gap-2 flex-shrink-0">
      <button disabled={count === 0} onClick={onCopy} className={LIST_ACTION_BTN}>
        Copy these UPCs
      </button>
      <button
        data-help="compare-show"
        disabled={count === 0}
        onClick={onShow}
        className="cc-btn-primary px-3 py-1 text-[12px]"
      >
        Show in the item list
      </button>
    </div>
  </div>
);

export default CompareFooter;
