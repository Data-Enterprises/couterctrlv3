

interface AvgBadgeProps {
  pct: number;
  avg: number;
  textSize?: string;
}

/** A cashier's figure against the peer average, as a change. */
const AvgBadge = ({ pct, avg, textSize = "text-[11px]" }: AvgBadgeProps) => {
  if (avg === 0) return null;
  const isUp = pct > 0;
  return (
    <span
      className={`${textSize} cc-tag ${
        isUp
          ? "bg-severity_critical_bg text-severity_critical_text"
          : "bg-severity_healthy_bg text-severity_healthy_text"
      }`}
    >
      {pct !== 0 && (isUp ? "▲" : "▼")} {Math.abs(pct).toFixed(2)}%
    </span>
  );
};

export default AvgBadge;
