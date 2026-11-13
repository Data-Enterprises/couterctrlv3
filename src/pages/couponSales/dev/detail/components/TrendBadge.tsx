interface TrendBadgeProps {
  pct: number | null;
}

/** Percentage move against the baseline, styled like LP's TrendBadge. Up is
 *  the bad direction here — coupons growing past the store's own norm. */
const TrendBadge = ({ pct }: TrendBadgeProps) => {
  if (pct === null) return null;
  const isUp = pct > 0;
  return (
    <span
      className={`text-[11px] cc-tag ${
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
