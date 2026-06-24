import { useEffect, useState, useMemo } from "react";
import SelectFilter from "../../../components/filters/SelectFilter";
import { ArrowDownTrayIcon, ArrowLeftIcon } from "@heroicons/react/20/solid";
import type { AllOrder } from "../../../interfaces";
import type { SelectedOrderKey } from "../../../features/ordersSlice";
import type { Store } from "../../../interfaces";
import { formatCurrency2 } from "../../../utils";

interface Props {
  orders: AllOrder[];
  loading: boolean;
  selectedKey: SelectedOrderKey;
  selectedOrderId: number | null;
  assignedStores: Store[];
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

const Chip = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline gap-1 rounded px-1.5 py-0.5" style={chipStyle}>
    <span className="text-[8.5px] text-content/50 whitespace-nowrap">{label}</span>
    <span className="text-[10px] font-semibold text-content whitespace-nowrap">{value}</span>
  </div>
);

const OrderReportPanel = ({
  orders,
  loading,
  selectedKey,
  selectedOrderId,
  assignedStores,
  onSelectOrderId,
  onExport,
}: Props) => {
  const [subDeptFilter, setSubDeptFilter] = useState<string>("");

  const storeName = selectedKey
    ? (assignedStores.find((s) => s.storeid === selectedKey.storeid)?.store_name ?? `Store ${selectedKey.storeid}`)
    : null;

  // Filter to only the orders matching the selected order type
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

  const orderItems = selectedOrderId !== null
    ? [...filteredOrders.filter((o) => o.order_id === selectedOrderId)].sort((a, b) => a.line_number - b.line_number)
    : [];

  const totalExtRetail = subFilteredOrders.reduce((s, o) => s + (o.e_ret ?? 0), 0);
  const totalCost = subFilteredOrders.reduce((s, o) => s + (o.cogs ?? 0), 0);

  const selectedExtRetail = orderItems.reduce((s, o) => s + (o.e_ret ?? 0), 0);
  const selectedCost = orderItems.reduce((s, o) => s + (o.cogs ?? 0), 0);

  // Auto-select when there's exactly one order
  useEffect(() => {
    if (!loading && selectedOrderId === null && uniqueOrderIds.length === 1 && !subDeptFilter) {
      onSelectOrderId(uniqueOrderIds[0]);
    }
  }, [uniqueOrderIds, loading]);

  return (
    <div className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white" style={{ flex: 1, minWidth: 0 }}>

      {/* Header */}
      <div className="bg-[#1e2a4a] px-4 py-2.5 flex-shrink-0">
        {selectedKey ? (
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              {selectedOrderId !== null && (
                <button
                  onClick={() => { onSelectOrderId(null); setSubDeptFilter(""); }}
                  className="w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors flex-shrink-0"
                  aria-label="Back to orders"
                >
                  <ArrowLeftIcon className="w-3.5 h-3.5" />
                </button>
              )}
              <div>
                <div className="text-white font-medium text-[13px]">
                  {storeName} — {selectedKey.order_type}
                  {selectedOrderId !== null && (
                    <span className="text-white/50 font-normal"> · #{selectedOrderId}</span>
                  )}
                </div>
                <div className="text-white/55 text-[10px] mt-0.5">{fmtDate(selectedKey.order_date)}</div>
              </div>
            </div>
            {selectedOrderId !== null && (
              <button
                onClick={onExport}
                className="flex items-center gap-1.5 text-[10px] font-semibold bg-white/10 border border-white/20 text-white rounded-md px-2.5 py-1.5 hover:bg-white/20 transition-colors flex-shrink-0"
              >
                <ArrowDownTrayIcon className="w-3 h-3" />
                CSV
              </button>
            )}
          </div>
        ) : (
          <div className="text-white/55 text-[12px]">Select a store to view its orders</div>
        )}
      </div>

      {/* Empty state */}
      {!selectedKey && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <svg className="w-8 h-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-[11px] text-content/60">No order selected</span>
          </div>
        </div>
      )}

      {/* Loading */}
      {selectedKey && loading && (
        <div className="flex-1 flex items-center justify-center text-[12px] text-content/60">
          Loading orders…
        </div>
      )}

      {/* Stage 1: Order list */}
      {selectedKey && !loading && selectedOrderId === null && uniqueOrderIds.length > 0 && (
        <div className="flex-1 overflow-y-auto thin-scrollbar flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-[9px] font-bold uppercase tracking-wide text-content/50 flex-shrink-0">Orders</span>
              {allSubDepts.length > 0 && (
                <SelectFilter
                  options={allSubDepts.map((sd) => ({ value: sd, label: sd }))}
                  value={subDeptFilter}
                  onChange={setSubDeptFilter}
                  placeholder="All sub depts"
                  className="w-[140px]"
                />
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Chip label="Orders" value={String(uniqueOrderIds.length)} />
              <Chip label="Items" value={String(filteredOrders.length)} />
              <Chip label="Ext retail" value={formatCurrency2(totalExtRetail)} />
              <Chip label="Cost" value={formatCurrency2(totalCost)} />
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {uniqueOrderIds.map((orderId) => {
              const items = subFilteredOrders.filter((o) => o.order_id === orderId);
              const eRet = items.reduce((s, o) => s + (o.e_ret ?? 0), 0);
              const status = items[0]?.status ?? "";
              const subDepts = Array.from(new Set(items.map((o) => o.sub_department_description).filter(Boolean)));
              return (
                <button
                  key={orderId}
                  onClick={() => onSelectOrderId(orderId)}
                  className="w-full flex items-start justify-between px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="text-[12px] font-semibold text-[#1e2a4a]">
                      Order #{orderId}{status ? <span className="text-content/50 font-normal"> · {status}</span> : ""}
                    </div>
                    {subDepts.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {subDepts.map((sd) => (
                          <span key={sd} className="text-[9px] text-content/60 bg-gray-100 rounded px-1.5 py-0.5">
                            {sd}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-baseline gap-1 justify-end">
                      <span className="text-[9px] text-content/50">Ext retail</span>
                      <span className="text-[12px] font-semibold text-content">{formatCurrency2(eRet)}</span>
                    </div>
                    <div className="text-[10px] text-content/50 mt-0.5">{items.length} items</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stage 2: Line items */}
      {selectedKey && !loading && selectedOrderId !== null && (
        <div className="flex-1 overflow-auto thin-scrollbar flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 flex-shrink-0">
            <span className="text-[9px] font-bold uppercase tracking-wide text-content/50">Line items</span>
            <div className="flex items-center gap-1.5">
              <Chip label="Items" value={String(orderItems.length)} />
              <Chip label="Ext retail" value={formatCurrency2(selectedExtRetail)} />
              <Chip label="Cost" value={formatCurrency2(selectedCost)} />
            </div>
          </div>
          <div className="flex-1 overflow-auto thin-scrollbar">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="sticky top-0 bg-white border-b border-gray-100 z-10">
                  <th className="text-right px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/60">#</th>
                  <th className="text-left px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/60 whitespace-nowrap">UPC</th>
                  <th className="text-left px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/60 whitespace-nowrap">Description</th>
                  <th className="text-left px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/60 whitespace-nowrap">Sub dept</th>
                  <th className="text-left px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/60 whitespace-nowrap">Vendor</th>
                  <th className="text-right px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/60">Qty</th>
                  <th className="text-right px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/60 whitespace-nowrap">Unit cost</th>
                  <th className="text-right px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/60">Retail</th>
                  <th className="text-right px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/60 whitespace-nowrap">Ext retail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orderItems.map((o) => (
                  <tr key={o.line_number} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-1.5 text-right tabular-nums text-content/50">{o.line_number}</td>
                    <td className="px-3 py-1.5 tabular-nums text-content/75 whitespace-nowrap">{o.product_code}</td>
                    <td className="px-3 py-1.5 font-medium text-content whitespace-nowrap">{o.description}</td>
                    <td className="px-3 py-1.5 text-content/75 whitespace-nowrap">{o.sub_department_description}</td>
                    <td className="px-3 py-1.5 text-content/75 whitespace-nowrap">{o.vendor_name}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-content">{o.qty}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-content/75">
                      {o.casesize > 0 ? formatCurrency2(o.base_cost / o.casesize) : "—"}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-content/75">{formatCurrency2(o.active_retail_price)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums font-medium text-content">{formatCurrency2(o.e_ret)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderReportPanel;
