import { useMemo } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import type { ReceiverListItem } from "../../../../interfaces";

interface Props {
  list: ReceiverListItem[];
  storeName: string;
  dateRangeLabel: string;
  onSelect: (vendorId: string) => void;
  onSearch: () => void;
}

const RcvVendorList = ({ list, storeName, dateRangeLabel, onSelect, onSearch }: Props) => {
  const totalReceivers = list.length;
  const totalItems = list.reduce((s, r) => s + r.items, 0);
  const uniqueVendors = new Set(list.map((r) => r.vendorid)).size;
  const uniqueOperators = new Set(list.map((r) => r.cashier_number)).size;

  const vendors = useMemo(() => {
    const map = new Map<string, { name: string; receiverCount: number; items: number }>();
    list.forEach((r) => {
      const cur = map.get(r.vendorid) ?? { name: r.vendor_name, receiverCount: 0, items: 0 };
      map.set(r.vendorid, {
        name: cur.name,
        receiverCount: cur.receiverCount + 1,
        items: cur.items + r.items,
      });
    });
    return Array.from(map.entries())
      .map(([vendorid, data]) => ({ vendorid, ...data }))
      .sort((a, b) => b.items - a.items);
  }, [list]);

  return (
    <div className="flex flex-col h-[calc(100dvh-3rem)] overflow-hidden">
      <div className="flex-shrink-0 px-3 pt-2 pb-2.5" style={{ background: "#1e2a4a" }}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-custom-white truncate">{storeName}</div>
            <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
              {dateRangeLabel}
            </div>
          </div>
          <button
            onClick={onSearch}
            className="w-[28px] h-[28px] flex items-center justify-center rounded border border-white/20 text-custom-white/85 flex-shrink-0"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-shrink-0 grid grid-cols-4 bg-custom-white border-b border-gray-100">
        {[
          { label: "Receivers", value: String(totalReceivers) },
          { label: "Items", value: String(totalItems) },
          { label: "Vendors", value: String(uniqueVendors) },
          { label: "Operators", value: String(uniqueOperators) },
        ].map(({ label, value }) => (
          <div key={label} className="px-2.5 py-1.5 border-r border-gray-100 last:border-r-0">
            <div className="text-[7px] font-semibold uppercase tracking-wide text-content-70">{label}</div>
            <div className="text-[12px] font-bold text-content mt-0.5 tabular-nums">{value}</div>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50">
        {vendors.map(({ vendorid, name, receiverCount, items }) => (
          <button
            key={vendorid}
            onClick={() => onSelect(vendorid)}
            className="w-full flex items-center px-3 py-2.5 bg-custom-white border-b border-gray-100 text-left active:bg-gray-50 gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-content truncate">{name}</div>
              <div className="text-[9px] text-content-70 mt-0.5">
                {vendorid} · {receiverCount} recv
              </div>
            </div>
            <div className="text-[10px] text-content-70 flex-shrink-0 tabular-nums">{items} items</div>
            <svg
              className="w-4 h-4 text-content/85 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RcvVendorList;
