// Utils
import { groupByOptions } from "./utils";

// Interfaces
import type { ReceiverListItem } from "../../../../../interfaces";

interface Props {
  receivers: ReceiverListItem[];
}

const SummaryStrip = ({ receivers }: Props) => {
  const totalItems = receivers.reduce((s, r) => s + r.items, 0);
  const uniqueVendors = new Set(receivers.map((r) => r.vendorid)).size;
  const uniqueOperators = new Set(receivers.map((r) => r.cashier_number)).size;

  return (
    <div className="flex-shrink-0 grid grid-cols-4 bg-custom-white border-b border-gray-100">
      {groupByOptions(
        receivers,
        totalItems,
        uniqueVendors,
        uniqueOperators,
      ).map(({ label, value }) => (
        <div className="px-2.5 py-1.5 border-r border-gray-100 last:border-r-0">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-content/95">
            {label}
          </div>
          <div className="text-[12px] font-bold text-content mt-0.5 tabular-nums">
            {value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryStrip;
