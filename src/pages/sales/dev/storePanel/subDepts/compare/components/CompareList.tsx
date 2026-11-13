// Utils
import { LIST_ACTION_BTN } from "../../utils";
import { COMPARE_COLS, SIDE_EDGE } from "../utils";

// Interfaces
import type { GradingMetric } from "../../../../../../../features/dev/devSalesLedgerSlice";
import type { ItemSortColumn, ItemSortState, Side } from "../../interfaces";
import type { CompareRowData, CompareTotals } from "../interfaces";

// Components
import ListBadge from "../../components/ListBadge";
import CompareRow from "./CompareRow";
import CompareSortHead from "./CompareSortHead";
import CompareTotalRow from "./CompareTotalRow";

interface CompareListProps {
  side: Side;
  label: string;
  rows: CompareRowData[];
  totals: CompareTotals;
  sort: ItemSortState;
  onSort: (c: ItemSortColumn) => void;
  onCopy: () => void;
  metric: GradingMetric;
}

/** One list: its name and a copy of its UPCs, its items in the shared sort
 *  (they scroll; a heading sorts both lists), and its totals pinned underneath. */
const CompareList = ({ side, label, rows, totals, sort, onSort, onCopy, metric }: CompareListProps) => (
  <div className="flex flex-col min-h-0 min-w-0">
    <div className={`flex items-center gap-1.5 pb-1 border-b-2 flex-shrink-0 ${SIDE_EDGE[side]}`}>
      <ListBadge side={side} />
      <span className="truncate text-[12px] font-bold text-content">
        {label} | {totals.count.toLocaleString()} item{totals.count === 1 ? "" : "s"}
      </span>
      <button disabled={rows.length === 0} onClick={onCopy} className={`${LIST_ACTION_BTN} ml-auto flex-shrink-0`}>
        Copy {rows.length.toLocaleString()} UPC{rows.length === 1 ? "" : "s"}
      </button>
    </div>
    <div className={`${COMPARE_COLS} px-1 pt-1 pb-0.5 flex-shrink-0`}>
      <span />
      <span className="cc-caps text-[10px]">Item</span>
      <CompareSortHead label="TY" column="ty" sort={sort} onSort={onSort} />
      <CompareSortHead label="LW" column="lw" sort={sort} onSort={onSort} />
      <CompareSortHead label="LY" column="ly" sort={sort} onSort={onSort} />
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
