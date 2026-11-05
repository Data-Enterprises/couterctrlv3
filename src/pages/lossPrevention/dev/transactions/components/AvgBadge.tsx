

/** A cashier's figure against the peer average, as a change. */
const AvgBadge = ({
  pct,
  avg,
  textSize = "text-[11px]",
}: {
  pct: number;
  avg: number;
  textSize?: string;
}) => {
  if (avg === 0) return null;
  const isUp = pct > 0;
  return (
    <span
      className={`${textSize} font-bold px-1.5 py-0.5 rounded ${
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
