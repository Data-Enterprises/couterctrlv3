// Utils
import { COMPARE_COLS, mainFig, otherFig } from "../utils";

// Interfaces
import type { GradingMetric } from "../../../../../../../features/dev/devSalesLedgerSlice";
import type { CompareRowData } from "../interfaces";

interface CompareRowProps {
  rank: number;
  row: CompareRowData;
  metric: GradingMetric;
}

/** One item on one line: its rank in the sort, name and UPC, then this week,
 *  last week and last year. */
const CompareRow = ({ rank, row, metric }: CompareRowProps) => (
  <div className={`${COMPARE_COLS} h-7 px-1 border-b border-line_hair even:bg-row_stripe whitespace-nowrap text-[12px] text-content`}>
    <span className="text-[10.5px] font-semibold">{rank}</span>
    <span className="min-w-0 truncate" title={`${row.desc} | ${row.upc}`}>
      <span className="font-medium">{row.desc}</span> <span className="text-[10.5px]">{row.upc}</span>
    </span>
    <span className="text-right">
      <span className="font-semibold">{row.hasTY ? mainFig(row.tyNet, row.tyQty, metric) : "—"}</span>{" "}
      <span className="text-[10.5px]">{row.hasTY ? otherFig(row.tyNet, row.tyQty, metric) : ""}</span>
    </span>
    <span className="text-right">{mainFig(row.lwNet, row.lwQty, metric)}</span>
    <span className="text-right">{mainFig(row.lyNet, row.lyQty, metric)}</span>
  </div>
);

export default CompareRow;
