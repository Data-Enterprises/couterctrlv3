import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { count, money, pct, pounds } from "./recapFormat";
import { NUM, ROW, ROW_OPEN, subCols } from "./recapGrid";
import type { RecapSubDept } from "./recapTypes";

/**
 * One sub dept on one day.
 *
 * The bar measures this day's sales and nothing else, so it is navy and
 * ungraded, scaled to the day's biggest sub dept so the small ones are not
 * all stubs. The percentage beside it is its share of the day.
 */
const RecapSubDeptRow = ({
  sub,
  top,
  itemCount,
  withPounds,
  open,
  onToggle,
}: {
  sub: RecapSubDept;
  /** The day's biggest sub dept's sales: the bar's full length. */
  top: number;
  /** Null while the day's items are being read. */
  itemCount: number | null;
  withPounds: boolean;
  open: boolean;
  onToggle: () => void;
}) => {
  const Chevron = open ? ChevronDownIcon : ChevronRightIcon;
  const width = top > 0 ? Math.max(2, (sub.net / top) * 100) : 0;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={open ? ROW_OPEN : ROW}
      style={{ gridTemplateColumns: subCols(withPounds) }}
    >
      <Chevron className="h-4 w-4 text-content" aria-hidden="true" />
      <span className={`min-w-0 truncate ${open ? "font-bold" : "font-medium"}`}>
        {sub.name}
      </span>
      <span className="flex items-center gap-2 min-w-0">
        <span className="flex-1 h-3 rounded bg-bkg min-w-0">
          <span
            className="block h-full rounded bg-brand_navy"
            style={{ width: `${width}%` }}
          />
        </span>
        <span className="w-[42px] flex-shrink-0 text-right text-[11.5px] text-content tabular-nums">
          {pct(sub.share)}
        </span>
      </span>
      <span className={NUM}>{itemCount === null ? "…" : count(itemCount)}</span>
      <span className={NUM}>{count(sub.units)}</span>
      {withPounds && <span className={NUM}>{pounds(sub.pounds)}</span>}
      <span className={`${NUM} font-semibold`}>{money(sub.net)}</span>
    </button>
  );
};

export default RecapSubDeptRow;
