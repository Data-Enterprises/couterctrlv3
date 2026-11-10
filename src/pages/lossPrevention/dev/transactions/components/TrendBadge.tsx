

interface TrendBadgeProps {
  current: number;
  trend: number;
  useAbs?: boolean;
}

/** The store figure against its baseline, as a change. Up is red: on this
 *  page more exceptions is worse. */
const TrendBadge = ({ current, trend, useAbs = false }: TrendBadgeProps) => {
  if (trend === 0) return null;
  const c = useAbs ? Math.abs(current) : current;
  const t = useAbs ? Math.abs(trend) : trend;
  const pct = ((c - t) / t) * 100;
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

export default TrendBadge;
