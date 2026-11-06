/** Percentage move against the baseline, styled like LP's TrendBadge. Up is
 *  the bad direction here — coupons growing past the store's own norm. */
const TrendBadge = ({ pct }: { pct: number | null }) => {
  if (pct === null) return null;
  const isUp = pct > 0;
  return (
    <span
      className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
        isUp
          ? "bg-severity_critical_bg text-severity_critical_text"
          : "bg-severity_healthy_bg text-severity_healthy_text"
      }`}
    >
      {pct !== 0 && (isUp ? "▲" : "▼")} {Math.abs(pct).toFixed(2)}%
    </span>
  );
};

/** Mirrors LP's StripCell: label, the baseline figure, then the value with its
 *  trend badge beside it. */
const Kpi = ({
  label,
  value,
  baselineValue,
  trendPct,
}: {
  label: string;
  value: string;
  baselineValue?: string;
  trendPct?: number | null;
}) => (
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
