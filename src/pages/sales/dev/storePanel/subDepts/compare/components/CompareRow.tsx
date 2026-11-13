// Utils
import { COMPARE_COLS, mainFig, otherFig, pctText, pctTextClass } from "../utils";

// Interfaces
import type { GradingMetric } from "../../../../../../../features/dev/devSalesLedgerSlice";
import type { CompareRowData } from "../interfaces";

interface CompareRowProps {
  rank: number;
  row: CompareRowData;
  metric: GradingMetric;
}

/** One item: its rank in the sort, this week, and its two changes. */
const CompareRow = ({ rank, row, metric }: CompareRowProps) => (
  <div className={`${COMPARE_COLS} px-1 py-1 border-b border-line_hair even:bg-row_stripe whitespace-nowrap`}>
    <span className="text-[10.5px] font-semibold text-content">{rank}</span>
    <span className="min-w-0 flex flex-col" title={`${row.desc} | ${row.upc}`}>
      <span className="truncate text-[12px] font-medium text-content">{row.desc}</span>
      <span className="truncate text-[10.5px] text-content">{row.upc}</span>
    </span>
    <span className="flex flex-col items-end">
      <span className="text-[12px] font-semibold text-content">
        {row.hasTY ? mainFig(row.tyNet, row.tyQty, metric) : "—"}
      </span>
      <span className="text-[10.5px] text-content">
        {row.hasTY ? otherFig(row.tyNet, row.tyQty, metric) : ""}
      </span>
    </span>
    <span className={`text-right text-[12px] font-semibold ${pctTextClass(row.lwPct)}`}>
      {pctText(row.lwPct)}
    </span>
    <span className={`text-right text-[12px] font-semibold ${pctTextClass(row.lyPct)}`}>
      {pctText(row.lyPct)}
    </span>
  </div>
);

export default CompareRow;
