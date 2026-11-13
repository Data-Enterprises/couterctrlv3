// Utils
import { COMPARE_COLS, SIDE_EDGE, SIDE_TINT, mainFig, otherFig, pctText, pctTextClass } from "../utils";

// Interfaces
import type { GradingMetric } from "../../../../../../../features/dev/devSalesLedgerSlice";
import type { Side } from "../../interfaces";
import type { CompareTotals } from "../interfaces";

interface CompareTotalRowProps {
  side: Side;
  totals: CompareTotals;
  metric: GradingMetric;
}

/** Under a list, outside its scroll so it always shows: the count, this
 *  week's total and the list's two changes. */
const CompareTotalRow = ({ side, totals, metric }: CompareTotalRowProps) => (
  <div
    className={`${COMPARE_COLS} flex-shrink-0 px-1 py-1.5 border-t-2 whitespace-nowrap ${SIDE_EDGE[side]} ${SIDE_TINT[side]}`}
  >
    <span />
    <span className="min-w-0 flex flex-col">
      <span className="text-[12px] font-bold text-content">Total</span>
      <span className="truncate text-[10.5px] font-medium text-content">
        {totals.count.toLocaleString()} item{totals.count === 1 ? "" : "s"}
      </span>
    </span>
    <span className="flex flex-col items-end">
      <span className="text-[12.5px] font-bold text-content">
        {mainFig(totals.tyNet, totals.tyQty, metric)}
      </span>
      <span className="text-[10.5px] font-medium text-content">
        {otherFig(totals.tyNet, totals.tyQty, metric)}
      </span>
    </span>
    <span className={`text-right text-[12px] font-bold ${pctTextClass(totals.lwPct)}`}>
      {pctText(totals.lwPct)}
    </span>
    <span className={`text-right text-[12px] font-bold ${pctTextClass(totals.lyPct)}`}>
      {pctText(totals.lyPct)}
    </span>
  </div>
);

export default CompareTotalRow;
