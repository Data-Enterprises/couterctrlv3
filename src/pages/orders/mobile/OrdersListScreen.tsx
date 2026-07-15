import { useState, useMemo } from "react";
import { ChevronLeftIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import SelectFilter from "../../../components/filters/SelectFilter";
import type { AllOrder } from "../../../interfaces";
import type { SelectedOrderKey } from "../../../features/ordersSlice";
import type { Store } from "../../../interfaces";
import { formatCurrency2 } from "../../../utils";

interface Props {
  orders: AllOrder[];
  loading: boolean;
  selectedKey: SelectedOrderKey;
  assignedStores: Store[];
  onBack: () => void;
  onSelectOrderId: (id: number | null) => void;
  onExport: () => void;
}

const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${m}/${d}/${y}`;
};

const chipStyle = {
  background: "rgba(30,42,74,0.06)",
  boxShadow: "inset 0 1px 2px rgba(30,42,74,0.08)",
};

const MAX_CHIPS = 3;

const SubDeptChips = ({ subDepts }: { subDepts: string[] }) => {
  const visible = subDepts.slice(0, MAX_CHIPS);
  const overflow = subDepts.slice(MAX_CHIPS);
  return (
    <div className="flex flex-wrap gap-1 items-center mt-1.5">
      {visible.map((sd) => (
        <span key={sd} className="text-[10px] bg-gray-100 text-content rounded px-1.5 py-0.5">{sd}</span>
      ))}
      {overflow.length > 0 && (
        <span className="text-[10px] font-semibold bg-[#1e2a4a]/[0.07] text-content rounded px-1.5 py-0.5">
          +{overflow.length} more
        </span>
      )}
    </div>
  );
};

const OrdersListScreen = ({ orders, loading, selectedKey, assignedStores, onBack, onSelectOrderId, onExport }: Props) => {
  const [subDeptFilter, setSubDeptFilter] = useState("");

  const storeName = selectedKey
    ? (assignedStores.find((s) => s.storeid === selectedKey.storeids[0])?.store_name ?? `Store ${selectedKey.storeids[0]}`)
    : "";

  const filteredOrders = selectedKey
    ? orders.filter((o) => o.order_type === selectedKey.order_type)
    : orders;

  const allSubDepts = useMemo(() =>
    Array.from(new Set(filteredOrders.map((o) => o.sub_department_description).filter(Boolean))).sort(),
  [filteredOrders]);

  const subFilteredOrders = subDeptFilter
    ? filteredOrders.filter((o) => o.sub_department_description === subDeptFilter)
    : filteredOrders;

  const uniqueOrderIds = Array.from(new Set(subFilteredOrders.map((o) => o.order_id))).sort((a, b) => a - b);
  const totalExtRetail = subFilteredOrders.reduce((s, o) => s + (o.e_ret ?? 0), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header — matches Sales/LP mobile */}
      <div className="bg-[#1e2a4a] px-4 pt-3 pb-4 flex items-start gap-3 flex-shrink-0">
        <button onClick={onBack} className="text-custom-white/85 mt-0.5 flex-shrink-0">
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-custom-white font-semibold text-[13px] truncate">
            {storeName} <span className="text-custom-white font-normal text-[12px]">— {selectedKey?.order_type}</span>
          </div>
          <div className="text-custom-white text-[11px] mt-0.5">
            {selectedKey ? fmtDate(selectedKey.order_date) : ""}
          </div>
        </div>
        <button
          onClick={onExport}
          className="w-[28px] h-[28px] flex items-center justify-center rounded border border-custom-white/25 text-custom-white/85 hover:text-custom-white hover:border-custom-white/45 transition-colors flex-shrink-0"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Sub-header chips + sub dept filter */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-custom-white flex-shrink-0 gap-2">
        {allSubDepts.length > 0 && (
          <SelectFilter
            options={allSubDepts.map((sd) => ({ value: sd, label: sd }))}
            value={subDeptFilter}
            onChange={(v) => { setSubDeptFilter(v); onSelectOrderId(null); }}
            placeholder="All sub depts"
            className="flex-1 min-w-0"
          />
        )}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="flex items-baseline gap-1 rounded px-1.5 py-0.5" style={chipStyle}>
            <span className="text-[10px] text-content">Orders</span>
            <span className="text-[10px] font-semibold text-content">{uniqueOrderIds.length}</span>
          </div>
          <div className="flex items-baseline gap-1 rounded px-1.5 py-0.5" style={chipStyle}>
            <span className="text-[10px] text-content">Items</span>
            <span className="text-[10px] font-semibold text-content">{subFilteredOrders.length}</span>
          </div>
          <div className="flex items-baseline gap-1 rounded px-1.5 py-0.5" style={chipStyle}>
            <span className="text-[10px] text-content">Retail</span>
            <span className="text-[10px] font-semibold text-content">{formatCurrency2(totalExtRetail)}</span>
          </div>
        </div>
      </div>

      {/* Order list */}
      <div className="flex-1 overflow-y-auto thin-scrollbar">
        {loading && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content">Loading orders…</div>
        )}
        {!loading && uniqueOrderIds.map((orderId) => {
          const items = subFilteredOrders.filter((o) => o.order_id === orderId);
          const eRet = items.reduce((s, o) => s + (o.e_ret ?? 0), 0);
          const status = items[0]?.status ?? "";
          const subDepts = Array.from(new Set(items.map((o) => o.sub_department_description).filter(Boolean))).sort();
          return (
            <button
              key={orderId}
              onClick={() => onSelectOrderId(orderId)}
              className="w-full px-4 py-3 border-b border-gray-100 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] font-semibold text-[#1e2a4a]">#{orderId}</span>
                {status && <span className="text-[10px] text-content flex-shrink-0">{status}</span>}
              </div>
              <div className="flex items-baseline justify-between gap-2 mt-0.5">
                <span className="text-[11px] font-semibold text-[#1e2a4a]">{formatCurrency2(eRet)}</span>
                <span className="text-[10px] text-content flex-shrink-0">{items.length} items</span>
              </div>
              <SubDeptChips subDepts={subDepts} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OrdersListScreen;
