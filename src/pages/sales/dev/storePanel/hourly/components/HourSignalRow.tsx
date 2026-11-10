// Hooks
import { useAppDispatch } from "../../../../../../hooks";
import { useSalesCtx } from "../../../hooks";

// Redux
import { setSelectedHour } from "../../../../../../features/dev/devSalesLedgerSlice";

// Utils
import { formatCurrency2, formatBigNumber } from "../../../../../../utils";
import { comparisonPillClass, isCompleteCoverage, type Coverage } from "../../../utils/ledgerUtils";
import { formatPct, severityDotClass, PCT_COL_W } from "../../../utils/index";
import { formatHourRange, hourSeverity } from "../utils";

// Interfaces
import type { HourRow } from "../interfaces";

interface HourSignalRowProps {
  row: HourRow;
  coverage: Coverage;
  threshold: number;
}

/** One hour in the left list; a click opens it, a second closes it. */
const HourSignalRow = ({ row: r, coverage, threshold }: HourSignalRowProps) => {
  const dispatch = useAppDispatch();
  const { gradingMetric, selectedHour } = useSalesCtx();
  const isQty = gradingMetric === "qty";
  const sev = hourSeverity(r, coverage, threshold, gradingMetric);
  const lwComplete = isCompleteCoverage(coverage.lwDayCount, coverage.dayCount);
  const lyComplete = isCompleteCoverage(coverage.lyDayCount, coverage.dayCount);
  const rowVsLWPct = isQty ? r.vsLWQtyPct : r.vsLWPct;
  const rowVsLYPct = isQty ? r.vsLYQtyPct : r.vsLYPct;
  const isSel = selectedHour === r.hour;

  return (
    <button
      onClick={() => dispatch(setSelectedHour(isSel ? null : r.hour))}
      className={`w-full flex items-center gap-2.5 p-3 text-left transition-colors border-l-2 border-b border-b-brand_navy/15 ${
        isSel
          ? "bg-row_selected border-row_selected_border"
          : "border-transparent hover:bg-gray-50"
      }`}
    >
      <span
        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${sev ? severityDotClass[sev] : "bg-gray-400"}`}
      />
      <span className="text-[12px] font-medium text-content truncate flex-1">
        {formatHourRange(r.hour)}
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
              : "bg-gray-100 text-brand_slate"
          }`}
          style={{ minWidth: PCT_COL_W }}
        >
          {r.hasLW ? formatPct(rowVsLWPct) : "—"}
        </span>
        <span
          className={`text-[12px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 whitespace-nowrap ${
            r.hasLY
              ? comparisonPillClass(rowVsLYPct, lyComplete, threshold)
              : "bg-gray-100 text-brand_slate"
          }`}
          style={{ minWidth: PCT_COL_W }}
        >
          {r.hasLY ? formatPct(rowVsLYPct) : "—"}
        </span>
      </div>
    </button>
  );
};

export default HourSignalRow;
