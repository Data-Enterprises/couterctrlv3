// Interfaces
import type { ReactNode } from "react";

interface ListTotalsRowProps {
  dateRange: string;
  /** The store's week total, already formatted; absent when nothing loaded. */
  total: string | null;
  /** The LW and LY pills. */
  children: ReactNode;
}

/** The list header's first row: the week, and the store's total with how it
 *  moved against last week and last year. */
const ListTotalsRow = ({ dateRange, total, children }: ListTotalsRowProps) => (
  <div className="flex items-center gap-2 min-h-[26px]">
    <span className="cc-navy-title text-[13px] flex-shrink-0">{dateRange}</span>
    <div className="flex-1" />
    {total !== null && (
      <>
        <span className="text-[14px] cc-navy-title">{total}</span>
        {children}
      </>
    )}
  </div>
);

export default ListTotalsRow;
