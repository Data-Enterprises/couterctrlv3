// Utils
import { COMPARE_COLS, SIDE_EDGE } from "../utils";

// Interfaces
import type { GradingMetric } from "../../../../../../../features/dev/devSalesLedgerSlice";
import type { Side } from "../../interfaces";
import type { CompareRowData, CompareTotals } from "../interfaces";

// Components
import CompareRow from "./CompareRow";
import CompareTotalRow from "./CompareTotalRow";
import ListBadge from "../../components/ListBadge";

interface CompareListProps {
  side: Side;
  label: string;
  rows: CompareRowData[];
  totals: CompareTotals;
  metric: GradingMetric;
}

/** One list: its name, its items in the shared sort (they scroll), and its
 *  totals pinned underneath. */
const CompareList = ({ side, label, rows, totals, metric }: CompareListProps) => (
  <div className="flex flex-col min-h-0 min-w-0">
    <div className={`flex items-center gap-1.5 pb-1 border-b-2 flex-shrink-0 ${SIDE_EDGE[side]}`}>
      <ListBadge side={side} />
      <span className="truncate text-[12px] font-bold text-content">
        {label} | {totals.count.toLocaleString()} item{totals.count === 1 ? "" : "s"}
      </span>
    </div>
    <div className={`${COMPARE_COLS} px-1 py-1 flex-shrink-0`}>
      <span />
      <span className="cc-caps text-[10px]">Item</span>
      <span className="cc-caps text-[10px] text-right">TY</span>
      <span className="cc-caps text-[10px] text-right">vs LW</span>
      <span className="cc-caps text-[10px] text-right">vs LY</span>
    </div>
    <div className="cc-scroll">
      {rows.length ? (
        rows.map((r, i) => <CompareRow key={r.key} rank={i + 1} row={r} metric={metric} />)
      ) : (
        <div className="px-1 py-2 text-[11px] text-content">No items</div>
      )}
    </div>
    <CompareTotalRow side={side} totals={totals} metric={metric} />
  </div>
);

export default CompareList;
