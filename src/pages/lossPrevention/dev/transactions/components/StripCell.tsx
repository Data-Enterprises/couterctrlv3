// Interfaces
import type { ReactNode } from "react";

interface StripCellProps {
  label: string;
  value: string;
  baselineValue?: string;
  badge: ReactNode;
  className?: string;
  valueClassName?: string;
}

/** One figure in a strip: its label, its baseline, the value and a badge. */
const StripCell = ({
  label,
  value,
  baselineValue,
  badge,
  className = "px-4 pt-2.5 text-center",
  valueClassName = "text-[14px] font-bold text-content",
}: StripCellProps) => (
  <div className={className}>
    <div className="text-[10px] cc-caps-strong">
      {label}
    </div>
    {baselineValue !== undefined && (
      <div
        className="text-[10px] font-bold text-content mb-0.5"
        title="Avg per week over the prior 2 weeks"
      >
        Baseline {baselineValue}
      </div>
    )}
    <div className="flex items-baseline justify-center gap-2">
      <span className={valueClassName}>{value}</span>
      {badge}
    </div>
  </div>
);

export default StripCell;
