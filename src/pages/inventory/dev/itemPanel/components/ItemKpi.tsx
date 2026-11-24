// Interfaces
import type { ReactNode } from "react";

interface ItemKpiProps {
  label: string;
  children: ReactNode;
  /** The figure's own colour, when it carries a meaning. */
  valueClass?: string;
  /** A line under the figure, such as where it came from. */
  note?: string;
}

/** One figure in the item's strip. */
const ItemKpi = ({
  label,
  children,
  valueClass = "text-content",
  note,
}: ItemKpiProps) => (
  <div className="px-3 pt-2.5 pb-1.5 text-center">
    <div className="text-[11px] cc-caps-strong">{label}</div>
    <div className={`text-[15px] font-bold tabular-nums mt-0.5 ${valueClass}`}>
      {children}
    </div>
    {note !== undefined && (
      <div className="text-[11px] text-content/95 leading-tight mt-0.5">
        {note}
      </div>
    )}
  </div>
);

export default ItemKpi;
