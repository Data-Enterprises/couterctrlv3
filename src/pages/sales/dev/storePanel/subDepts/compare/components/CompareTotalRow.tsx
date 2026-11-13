// Utils
import { COMPARE_COLS, SIDE_EDGE, SIDE_TINT, mainFig, otherFig } from "../utils";

// Interfaces
import type { GradingMetric } from "../../../../../../../features/dev/devSalesLedgerSlice";
import type { Side } from "../../interfaces";
import type { CompareTotals } from "../interfaces";

interface CompareTotalRowProps {
  side: Side;
  totals: CompareTotals;
  metric: GradingMetric;
}

/** Under a list, outside its scroll so it always shows: the count and the
 *  three weeks, in the rows' columns. */
const CompareTotalRow = ({ side, totals, metric }: CompareTotalRowProps) => (
  <div
    className={`${COMPARE_COLS} flex-shrink-0 px-1 py-1.5 border-t-2 whitespace-nowrap text-[12px] text-content ${SIDE_EDGE[side]} ${SIDE_TINT[side]}`}
  >
    <span />
    <span className="min-w-0 truncate">
      <span className="font-bold">Total</span>{" "}
      <span className="text-[10.5px] font-medium">
        {totals.count.toLocaleString()} item{totals.count === 1 ? "" : "s"}
      </span>
    </span>
    <span className="text-right">
      <span className="font-bold">{mainFig(totals.tyNet, totals.tyQty, metric)}</span>{" "}
      <span className="text-[10.5px]">{otherFig(totals.tyNet, totals.tyQty, metric)}</span>
    </span>
    <span className="text-right font-semibold">
      {totals.hasLW ? mainFig(totals.lwNet, totals.lwQty, metric) : "—"}
    </span>
    <span className="text-right font-semibold">
      {totals.hasLY ? mainFig(totals.lyNet, totals.lyQty, metric) : "—"}
    </span>
  </div>
);

export default CompareTotalRow;
