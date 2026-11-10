// Utils
import { kpiStrip } from "../utils";

// Interfaces
import type { ReceiverDetailsItem, ReceiverDetailsTotals } from "../../../../../../interfaces";

interface SheetKpiStripProps {
  details: ReceiverDetailsItem[];
  totals?: ReceiverDetailsTotals | null;
}

/** The four-figure KPI strip at the top of the phone receiver sheet, built from its line items and totals. */
const SheetKpiStrip = ({ details, totals }: SheetKpiStripProps) => {
  return (
    <div className="grid grid-cols-4 border-b border-gray-100">
      {kpiStrip(details, totals).map(({ label, value }) => (
        <div
          key={label}
          className="px-2.5 py-1.5 border-r border-gray-100 last:border-r-0"
        >
          <div className="text-[10px] font-semibold uppercase tracking-wide text-content/95">
            {label}
          </div>
          <div className="text-[11px] font-bold text-content mt-0.5 tabular-nums">
            {value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SheetKpiStrip;
