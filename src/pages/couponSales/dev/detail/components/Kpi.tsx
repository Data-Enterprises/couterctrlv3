// Components
import TrendBadge from "./TrendBadge";

interface KpiProps {
  label: string;
  value: string;
  baselineValue?: string;
  trendPct?: number | null;
}

/** Mirrors LP's StripCell: label, the baseline figure, then the value with its
 *  trend badge beside it. */
const Kpi = ({ label, value, baselineValue, trendPct }: KpiProps) => (
  <div className="px-4 pt-2.5 pb-2 text-center">
    <div className="text-[10px] font-bold uppercase tracking-wide text-content">
      {label}
    </div>
    {baselineValue !== undefined && (
      <div
        className="text-[10px] font-bold text-content mb-0.5"
        title="Same figure over the prior 2 weeks"
      >
        Baseline {baselineValue}
      </div>
    )}
    <div className="flex items-baseline justify-center gap-2">
      <span className="text-[14px] font-bold text-content">{value}</span>
      <TrendBadge pct={trendPct ?? null} />
    </div>
  </div>
);

export default Kpi;
