import { trendPillClass } from "../../gradingUtils";

interface TrendBadgeProps {
  pct: number;
  suffix?: string;
}

const TrendBadge = ({ pct, suffix }: TrendBadgeProps) => (
  <span
    className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 ${trendPillClass(pct)}`}
  >
    {pct > 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%{suffix ? ` ${suffix}` : ""}
  </span>
);

export default TrendBadge;
