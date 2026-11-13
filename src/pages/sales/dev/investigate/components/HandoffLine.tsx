// Utils
import { CAUSE_LABEL, CAUSE_TIP, CAUSE_TONE } from "../utils/deptInvestigation";
import { HANDOFF_COLS } from "../utils/handoff";

// Interfaces
import type { ItemVerdict } from "../interfaces";

interface HandoffLineProps {
  item: ItemVerdict;
  n: number;
  /** Name the item's cause: on a list that holds more than one. */
  showCause: boolean;
  /** The two stores' numbers, for the cause tooltip. */
  us: string;
  them: string;
  fmt: (v: number) => string;
  onPick: (code: string) => void;
}

/** One item on a Hand-off list: its name, its cause where the list holds
 *  several, its UPC and the difference.
 *  Clicking it opens its evidence in Items. */
const HandoffLine = ({ item, n, showCause, us, them, fmt, onPick }: HandoffLineProps) => (
  <button
    type="button"
    onClick={() => onPick(item.productCode)}
    title="View in Items"
    className={`w-full grid ${
      showCause ? HANDOFF_COLS.withCause : HANDOFF_COLS.oneCause
    } gap-3 items-center px-1.5 py-1.5 border-b border-brand_navy/15 even:bg-row_stripe hover:bg-fill_soft text-left`}
  >
    <span className="text-right text-[12px] text-content/95 tabular-nums">{n}</span>
    <span className="min-w-0 truncate text-[12.5px] font-mono text-content">
      {item.description}
    </span>
    {showCause && (
      <span className="min-w-0">
        <span
          className={`cc-tag text-[11px] whitespace-nowrap ${CAUSE_TONE[item.cause].chip}`}
          title={CAUSE_TIP[item.cause](us, them)}
        >
          {CAUSE_LABEL[item.cause]}
        </span>
      </span>
    )}
    <span className="font-mono text-[12px] text-brand_slate truncate">{item.productCode}</span>
    <span
      className={`text-right text-[12.5px] font-bold tabular-nums whitespace-nowrap ${
        item.gap < 0 ? "text-delta_negative_text" : "text-content"
      }`}
    >
      {item.gap < 0 ? "−" : ""}
      {fmt(Math.abs(item.gap))}
    </span>
  </button>
);

export default HandoffLine;
