// Utils
import { formatPct, pillClass } from "../../../../../utils/severity";
import { DELTA_THRESHOLD, fmtUnits } from "../utils";

interface KpiProps {
  label: string;
  dates: string;
  units: number | null;
  pct?: number | null;
}

/** One period cell, matching the KPI strip on Sales: label, the dates it
 *  covers, then the figure — with the comparison pill inline on the two
 *  baselines. */
const Kpi = ({ label, dates, units, pct }: KpiProps) => (
  <div className="px-4 pt-2.5 pb-1.5 text-center">
    <div className="text-[10px] font-bold uppercase tracking-wide text-content">
      {label}
    </div>
    <div className="text-[10px] font-bold text-content mb-0.5">{dates}</div>
    <div className="flex items-baseline justify-center gap-2">
      <span className="text-[14px] font-bold text-content tabular-nums">
        {fmtUnits(units)}
      </span>
      {pct !== undefined && (
        <span
          className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${pillClass(pct ?? null, DELTA_THRESHOLD)}`}
        >
          {pct === null || pct === undefined ? "—" : formatPct(pct)}
        </span>
      )}
    </div>
  </div>
);

export default Kpi;
