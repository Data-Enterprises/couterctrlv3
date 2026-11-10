// Utils
import { comparisonPillClass, formatPct } from "../../../../utils/severity";

interface KpiProps {
  title: string;
  dateLabel: string;
  value: string;
  pct?: number | null;
  threshold: number;
  /** False when the comparison is missing days: grey, and it doesn't grade. */
  complete?: boolean;
  /** "3 of 7 days matched", shown under a partial comparison. */
  coverageNote?: string;
}

/** One KPI cell, matching the Sales strip. The date line is load-bearing: the
 *  figure means something different once a day is selected. */
const Kpi = ({ title, dateLabel, value, pct, threshold, complete = true, coverageNote }: KpiProps) => (
  <div className="px-4 pt-2.5 pb-2 text-center">
    <div className="text-[10px] font-bold uppercase tracking-wide text-content">
      {title}
    </div>
    <div className="text-[10px] font-bold text-content mb-0.5">{dateLabel}</div>
    {pct === undefined ? (
      <div className="text-[14px] font-bold text-content">{value}</div>
    ) : (
      <div className="flex items-baseline justify-center gap-2">
        <span className="text-[14px] font-bold text-content">{value}</span>
        {pct !== null && (
          <span
            className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${comparisonPillClass(pct, complete, threshold)}`}
          >
            {formatPct(pct)}
          </span>
        )}
      </div>
    )}
    {coverageNote && (
      <div className="text-[10px] font-semibold text-content pt-0.5">{coverageNote}</div>
    )}
  </div>
);

export default Kpi;
