// Utils
import { LIST_ACTION_BTN } from "../../utils";

interface CompareBucketHeadProps {
  /** "18 items sold last year and nothing this week." */
  text: string;
  count: number;
  onCopy: () => void;
}

/** Over the carousel's list: what the open bucket holds, and copy its UPCs. */
const CompareBucketHead = ({ text, count, onCopy }: CompareBucketHeadProps) => (
  <div className="flex items-center justify-between gap-3">
    <span className="truncate text-[15px] font-medium text-content">{text}</span>
    <button disabled={count === 0} onClick={onCopy} title="Copy this bucket's UPCs, both lists" className={`${LIST_ACTION_BTN} flex-shrink-0`}>
      Copy UPCs
    </button>
  </div>
);

export default CompareBucketHead;
