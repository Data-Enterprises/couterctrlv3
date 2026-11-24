// Interfaces
import type { ReactNode } from "react";

interface KpiCellProps {
  label: string;
  /** The value's colour class, if not the body text. */
  valueClass?: string;
  children: ReactNode;
}

/** One figure in the report's KPI strip: a caption over a bold value. */
const KpiCell = ({
  label,
  valueClass = "text-content",
  children,
}: KpiCellProps) => (
  <div className="px-4 pt-2.5 text-center">
    <div className="text-[10px] cc-caps-strong">{label}</div>
    <div className={`text-[14px] font-bold tabular-nums mt-0.5 ${valueClass}`}>
      {children}
    </div>
  </div>
);

export default KpiCell;
