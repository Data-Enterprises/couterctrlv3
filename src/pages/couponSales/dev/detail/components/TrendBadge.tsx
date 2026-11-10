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

export default TrendBadge;
