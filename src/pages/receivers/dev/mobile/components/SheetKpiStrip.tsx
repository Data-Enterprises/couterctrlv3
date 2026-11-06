// Utils
import { kpiStrip } from "./utils";

// Interfaces
import type { ReceiverDetailsItem, ReceiverDetailsTotals } from "@/interfaces";

interface Props {
  details: ReceiverDetailsItem[];
  totals?: ReceiverDetailsTotals;
}

const SheetKpiStrip = ({ details, totals }: Props) => {
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
