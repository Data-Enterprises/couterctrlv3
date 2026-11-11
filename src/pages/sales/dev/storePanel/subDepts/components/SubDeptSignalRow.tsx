// Hooks
import { useAppDispatch } from "../../../../../../hooks";
import { useSalesCtx } from "../../../hooks";

// Redux
import { setSelectedSubDeptId } from "../../../../../../features/dev/devSalesLedgerSlice";

// Utils
import { formatCurrency2, formatBigNumber } from "../../../../../../utils";
import { comparisonPillClass, isCompleteCoverage, type Coverage } from "../../../utils/ledgerUtils";
import { formatPct, severityDotClass, PCT_COL_W } from "../../../utils/index";
import { deptSeverity } from "../utils";

// Interfaces
import type { DeptRow } from "../interfaces";

interface SubDeptSignalRowProps {
  row: DeptRow;
  coverage: Coverage;
  threshold: number;
}

/** One sub department in the left list; a click opens it, a second closes it. */
const SubDeptSignalRow = ({ row: r, coverage, threshold }: SubDeptSignalRowProps) => {
  const dispatch = useAppDispatch();
  const { gradingMetric, selectedSubDeptId } = useSalesCtx();
  const isQty = gradingMetric === "qty";
  const lwComplete = isCompleteCoverage(coverage.lwDayCount, coverage.dayCount);
  const lyComplete = isCompleteCoverage(coverage.lyDayCount, coverage.dayCount);
  const sev = deptSeverity(r, coverage, threshold, gradingMetric);
  const rowVsLWPct = isQty ? r.vsLWQtyPct : r.vsLWPct;
  const rowVsLYPct = isQty ? r.vsLYQtyPct : r.vsLYPct;
  const isSel = selectedSubDeptId === r.id;

  return (
    <button
      onClick={() => dispatch(setSelectedSubDeptId(isSel ? null : r.id))}
      className={`w-full flex items-center gap-2.5 p-3 text-left transition-colors border-l-2 border-b border-b-brand_navy/15 ${
        isSel
          ? "cc-row-selected"
          : "border-transparent hover:bg-fill_soft"
      }`}
    >
      <span
        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
          sev ? severityDotClass[sev] : "bg-gray-400"
        }`}
      />
      <span
        title={r.desc}
        className="text-[12px] font-medium text-content truncate flex-1 min-w-[88px]"
      >
        {r.desc}
      </span>
      <div className="flex items-center gap-[14px]">
        <span
          className="text-[12px] font-semibold text-content flex-shrink-0 pl-2.5 text-right"
          style={{ width: 64 }}
        >
          {isQty ? formatBigNumber(r.qty, 0) : formatCurrency2(r.tw)}
        </span>
        <span
          className={`text-[12px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 whitespace-nowrap ${
            r.hasLW
              ? comparisonPillClass(rowVsLWPct, lwComplete, threshold)
              : "bg-fill_muted text-brand_slate"
          }`}
          title={
            r.hasLW && !lwComplete
              ? `Last week covers ${coverage.lwDayCount} of ${coverage.dayCount} days, so it isn't used to grade.`
              : undefined
          }
          style={{ minWidth: PCT_COL_W }}
        >
          {r.hasLW ? formatPct(rowVsLWPct) : "—"}
        </span>
        <span
          className={`perf_narrow:hidden text-[12px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 whitespace-nowrap ${
            r.hasLY
              ? comparisonPillClass(rowVsLYPct, lyComplete, threshold)
              : "bg-fill_muted text-brand_slate"
          }`}
          title={
            r.hasLY && !lyComplete
              ? `Last year covers ${coverage.lyDayCount} of ${coverage.dayCount} days, so it isn't used to grade.`
              : undefined
          }
          style={{ minWidth: PCT_COL_W }}
        >
          {r.hasLY ? formatPct(rowVsLYPct) : "—"}
        </span>
      </div>
    </button>
  );
};

export default SubDeptSignalRow;
