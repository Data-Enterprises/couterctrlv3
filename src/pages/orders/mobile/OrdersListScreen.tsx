import { ArrowLeftIcon } from "@heroicons/react/20/solid";
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
  onSelectOrderId: (id: number) => void;
}

const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${m}/${d}/${y}`;
};

const chipStyle = {
  background: "rgba(30,42,74,0.06)",
  boxShadow: "inset 0 1px 2px rgba(30,42,74,0.08)",
};

const OrdersListScreen = ({ orders, loading, selectedKey, assignedStores, onBack, onSelectOrderId }: Props) => {
  const storeName = selectedKey
    ? (assignedStores.find((s) => s.storeid === selectedKey.storeid)?.store_name ?? `Store ${selectedKey.storeid}`)
    : "";

  const filteredOrders = selectedKey
    ? orders.filter((o) => o.order_type === selectedKey.order_type)
    : orders;

  const uniqueOrderIds = Array.from(new Set(filteredOrders.map((o) => o.order_id))).sort((a, b) => a - b);
  const totalExtRetail = filteredOrders.reduce((s, o) => s + (o.e_ret ?? 0), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-[#1e2a4a] px-4 py-2.5 flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={onBack}
            className="w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors flex-shrink-0"
            aria-label="Back to available orders"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
          </button>
          <span className="text-white/60 text-[10px]">Available orders</span>
        </div>
        <div className="text-white font-medium text-[13px]">
          {storeName} — {selectedKey?.order_type}
        </div>
        <div className="text-white/60 text-[10px] mt-0.5">
          {selectedKey ? fmtDate(selectedKey.order_date) : ""}
        </div>
      </div>

      {/* Sub-header chips */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-white flex-shrink-0">
        <span className="text-[9px] font-bold uppercase tracking-wide text-content/60">Orders</span>
        <div className="flex items-center gap-1.5">
          <div className="flex items-baseline gap-1 rounded px-1.5 py-0.5" style={chipStyle}>
            <span className="text-[8.5px] text-content/60">Orders</span>
            <span className="text-[10px] font-semibold text-content">{uniqueOrderIds.length}</span>
          </div>
          <div className="flex items-baseline gap-1 rounded px-1.5 py-0.5" style={chipStyle}>
            <span className="text-[8.5px] text-content/60">Items</span>
            <span className="text-[10px] font-semibold text-content">{filteredOrders.length}</span>
          </div>
          <div className="flex items-baseline gap-1 rounded px-1.5 py-0.5" style={chipStyle}>
            <span className="text-[8.5px] text-content/60">Retail</span>
            <span className="text-[10px] font-semibold text-content">{formatCurrency2(totalExtRetail)}</span>
          </div>
        </div>
      </div>

      {/* Order list */}
      <div className="flex-1 overflow-y-auto thin-scrollbar">
        {loading && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/70">Loading orders…</div>
        )}
        {!loading && uniqueOrderIds.map((orderId) => {
          const items = filteredOrders.filter((o) => o.order_id === orderId);
          const eRet = items.reduce((s, o) => s + (o.e_ret ?? 0), 0);
          const status = items[0]?.status ?? "";
          return (
            <button
              key={orderId}
              onClick={() => onSelectOrderId(orderId)}
              className="w-full flex items-center justify-between px-4 py-3.5 border-b border-gray-100 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div>
                <div className="text-[13px] font-semibold text-[#1e2a4a]">Order #{orderId}</div>
                <div className="text-[11px] text-content/70 mt-0.5">
                  {items.length} items{status ? ` · ${status}` : ""}
                </div>
              </div>
              <div className="text-[10px] text-content/65">{formatCurrency2(eRet)} retail</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OrdersListScreen;
