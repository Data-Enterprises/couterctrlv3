// Utils
import { formatCurrency2 } from "../../../../utils";
import { comparisonPillClass, isCompleteCoverage, type Coverage } from "../utils/ledgerUtils";
import { DATE, formatPct, LABEL, UNITS, VALUE } from "../utils/index";

// Interfaces
import type { PeriodRow } from "../interfaces";

interface PeriodKpisProps {
  row: PeriodRow;
  coverage: Coverage;
  threshold: number;
  twDateLabel: string;
  lwDateLabel: string;
  lyDateLabel: string;
}

/** The open row's three figures: this year, vs last week, vs last year. */
const PeriodKpis = ({
  row,
  coverage,
  threshold,
  twDateLabel,
  lwDateLabel,
  lyDateLabel,
}: PeriodKpisProps) => (
  <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50 leading-snug flex-shrink-0">
    <div className="px-4 py-3 text-center">
      <div className={LABEL}>TY Net Sales</div>
      <div className={DATE}>{twDateLabel}</div>
      <div className="flex items-baseline justify-center gap-1 mt-0.5">
        <span className={VALUE}>{formatCurrency2(row.tw)}</span>
        <span className={UNITS}>{row.qty.toLocaleString()} u</span>
      </div>
    </div>
    <div className="px-4 py-3 text-center">
      <div className={LABEL}>vs Last Week</div>
      <div className={DATE}>{lwDateLabel}</div>
      <div className="flex items-baseline justify-center gap-1.5 mt-0.5">
        <span className={VALUE}>{row.hasLW ? formatCurrency2(row.lw) : "—"}</span>
        {row.lwQty > 0 && <span className={UNITS}>{row.lwQty.toLocaleString()} u</span>}
        {row.hasLW && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${comparisonPillClass(row.vsLWPct, isCompleteCoverage(coverage.lwDayCount, coverage.dayCount), threshold)}`}
          >
            {formatPct(row.vsLWPct)}
          </span>
        )}
      </div>
    </div>
    <div className="px-4 py-3 text-center">
      <div className={LABEL}>vs Last Year</div>
      <div className={DATE}>{lyDateLabel}</div>
      <div className="flex items-baseline justify-center gap-1.5 mt-0.5">
        <span className={VALUE}>{row.hasLY ? formatCurrency2(row.ly) : "—"}</span>
        {row.lyQty > 0 && <span className={UNITS}>{row.lyQty.toLocaleString()} u</span>}
        {row.hasLY && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${comparisonPillClass(row.vsLYPct, isCompleteCoverage(coverage.lyDayCount, coverage.dayCount), threshold)}`}
          >
            {formatPct(row.vsLYPct)}
          </span>
        )}
      </div>
    </div>
  </div>
);

export default PeriodKpis;
