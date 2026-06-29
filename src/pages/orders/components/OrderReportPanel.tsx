import { useState, useMemo } from "react";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import EmptyPrompt from "../../../components/EmptyPrompt";
import SelectFilter from "../../../components/filters/SelectFilter";
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import type { AllOrder } from "../../../interfaces";
import type { SelectedOrderKey } from "../../../features/ordersSlice";
import type { Store } from "../../../interfaces";
import { formatCurrency2 } from "../../../utils";
import OrdersExportModal from "./OrdersExportModal";

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

const Chip = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline gap-1 rounded px-1.5 py-0.5" style={{ background: "rgba(30,42,74,0.06)", boxShadow: "inset 0 1px 2px rgba(30,42,74,0.08)" }}>
    <span className="text-[8.5px] text-content/70 whitespace-nowrap">{label}</span>
    <span className="text-[10px] font-semibold text-content whitespace-nowrap">{value}</span>
  </div>
);

const MAX_CHIPS = 3;

const DescCell = ({ text }: { text: string }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="overflow-hidden text-ellipsis whitespace-nowrap">{text}</div>
      {hovered && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-[#1e2a4a] rounded-lg shadow-lg px-2.5 py-1.5 whitespace-nowrap pointer-events-none">
          <span className="text-[9px] text-white/80">{text}</span>
        </div>
      )}
    </div>
  );
};

const SubDeptChips = ({ subDepts }: { subDepts: string[] }) => {
  const [hovered, setHovered] = useState(false);
  const visible = subDepts.slice(0, MAX_CHIPS);
  const overflow = subDepts.slice(MAX_CHIPS);
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {visible.map((sd) => (
        <span key={sd} className="text-[8px] bg-gray-100 text-content/70 rounded px-1.5 py-0.5">{sd}</span>
      ))}
      {overflow.length > 0 && (
        <div className="relative inline-flex" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
          <span className="text-[8px] font-semibold bg-[#1e2a4a]/[0.07] text-content/70 rounded px-1.5 py-0.5 cursor-default">
            +{overflow.length} more
          </span>
          {hovered && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-[#1e2a4a] rounded-lg shadow-lg px-2.5 py-2 flex flex-col gap-0.5" style={{ minWidth: 100 }}>
              {overflow.map((sd) => (
                <span key={sd} className="text-[9px] text-white/75 leading-relaxed whitespace-nowrap">{sd}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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
  const [exportOpen, setExportOpen] = useState(false);

  const storeName = selectedKey
    ? (assignedStores.find((s) => s.storeid === selectedKey.storeid)?.store_name ?? `Store ${selectedKey.storeid}`)
    : null;

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
  const totalItems = subFilteredOrders.length;

  const selectedExtRetail = orderItems.reduce((s, o) => s + (o.e_ret ?? 0), 0);
  const selectedCost = orderItems.reduce((s, o) => s + (o.cogs ?? 0), 0);

  return (
    <div className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white" style={{ flex: 1, minWidth: 0 }}>

      {exportOpen && selectedKey && (
        <OrdersExportModal
          onClose={() => setExportOpen(false)}
          storeName={storeName ?? ""}
          orderType={selectedKey.order_type}
          orderDate={selectedKey.order_date}
          allOrders={filteredOrders}
          selectedOrderItems={orderItems}
          selectedOrderId={selectedOrderId}
        />
      )}

      {/* Header */}
      <div className="bg-[#1e2a4a] px-3 pt-1 pb-2 flex-shrink-0 flex flex-col gap-0">
        {/* Row 1 */}
        <div className="flex items-end gap-3 min-h-[26px]">
          {selectedKey ? (
            <>
              <span className="text-white font-medium text-[13px] flex-shrink-0">{storeName} — {selectedKey.order_type}</span>
              <span className="text-white/45 text-[10px] flex-shrink-0">{fmtDate(selectedKey.order_date)}</span>
            </>
          ) : (
            <span className="text-white font-medium text-[13px]">Order Report</span>
          )}
          <div className="flex-1" />
          {selectedKey && !loading && filteredOrders.length > 0 && (
            <button
              onClick={() => setExportOpen(true)}
              title="Export CSV"
              className="text-white/60 hover:text-white transition-colors flex-shrink-0"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
            </button>
          )}
          {selectedKey && !loading && (
            <>
              <div className="flex items-baseline gap-1 flex-shrink-0">
                <span className="text-[10px] uppercase tracking-wide text-white/45">Orders</span>
                <span className="text-[13px] font-medium text-white">{uniqueOrderIds.length}</span>
              </div>
              <div className="w-px h-4 bg-white/15 flex-shrink-0" />
              <div className="flex items-baseline gap-1 flex-shrink-0">
                <span className="text-[10px] uppercase tracking-wide text-white/45">Items</span>
                <span className="text-[13px] font-medium text-white">{totalItems}</span>
              </div>
              <div className="w-px h-4 bg-white/15 flex-shrink-0" />
              <div className="flex items-baseline gap-1 flex-shrink-0">
                <span className="text-[10px] uppercase tracking-wide text-white/45">Ext retail</span>
                <span className="text-[13px] font-medium text-white">{formatCurrency2(totalExtRetail)}</span>
              </div>
              <div className="w-px h-4 bg-white/15 flex-shrink-0" />
              <div className="flex items-baseline gap-1 flex-shrink-0">
                <span className="text-[10px] uppercase tracking-wide text-white/45">Cost</span>
                <span className="text-[13px] font-medium text-white">{formatCurrency2(totalCost)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Empty — no store selected */}
      {!selectedKey && (
        <EmptyPrompt title="No order selected" description="Select a store from the list to view its orders" />
      )}

      {/* Loading */}
      {selectedKey && loading && <div className="flex-1 relative"><LoadingIndicator message="Loading orders" /></div>}

      {/* Split pane */}
      {selectedKey && !loading && (
        <div className="flex flex-1 min-h-0">

          {/* Left: order list */}
          <div className="flex flex-col border-r border-gray-100 flex-shrink-0" style={{ width: "20%" }}>
            <div className="flex items-center gap-2 px-2.5 py-1.5 border-b border-gray-100 flex-shrink-0">
              <span className="text-[9px] font-bold uppercase tracking-wide text-content/70 flex-shrink-0">Orders</span>
              {allSubDepts.length > 0 && (
                <SelectFilter
                  options={allSubDepts.map((sd) => ({ value: sd, label: sd }))}
                  value={subDeptFilter}
                  onChange={(v) => { setSubDeptFilter(v); onSelectOrderId(null); }}
                  placeholder="All sub depts"
                  className="flex-1 min-w-0"
                />
              )}
            </div>
            <div className="flex-1 overflow-y-auto thin-scrollbar">
              {uniqueOrderIds.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-[11px] text-content/70">No orders found</div>
              ) : (
                uniqueOrderIds.map((orderId) => {
                  const items = subFilteredOrders.filter((o) => o.order_id === orderId);
                  const allItems = filteredOrders.filter((o) => o.order_id === orderId);
                  const eRet = items.reduce((s, o) => s + (o.e_ret ?? 0), 0);
                  const subDepts = Array.from(new Set(allItems.map((o) => o.sub_department_description).filter(Boolean)));
                  const isSel = selectedOrderId === orderId;
                  return (
                    <button
                      key={orderId}
                      onClick={() => onSelectOrderId(orderId)}
                      className={`w-full flex gap-2 items-start px-2.5 py-2 border-b border-gray-100 text-left transition-colors ${isSel ? "bg-white" : "hover:bg-gray-50"}`}
                      style={isSel ? { boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)" } : undefined}
                    >
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[11px] font-semibold text-[#1e2a4a]">#{orderId}</span>
                          {items[0]?.status && <span className="text-[9px] italic text-content/55 flex-shrink-0">{items[0].status}</span>}
                        </div>
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[10px] font-semibold text-[#1e2a4a]">{formatCurrency2(eRet)}</span>
                          <span className="text-[9px] text-content/70 flex-shrink-0">{items.length} items</span>
                        </div>
                        <SubDeptChips subDepts={subDepts} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: line items */}
          <div className="flex flex-col flex-1 min-w-0 min-h-0">
            {selectedOrderId === null ? (
              <EmptyPrompt title="No order selected" description="Select an order from the list to view its line items" />
            ) : (
              <>
                <div className="flex items-center gap-2 px-2.5 py-1.5 border-b border-gray-100 flex-shrink-0">
                  <span className="text-[9px] font-bold uppercase tracking-wide text-content/70">Line items — #{selectedOrderId}</span>
                  <div className="flex-1" />
                  <Chip label="Items" value={String(orderItems.length)} />
                  <Chip label="Ext retail" value={formatCurrency2(selectedExtRetail)} />
                  <Chip label="Cost" value={formatCurrency2(selectedCost)} />
                </div>
                <div className="flex-1 overflow-auto thin-scrollbar">
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
                        <th className="text-right px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70">#</th>
                        <th className="text-left px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70 whitespace-nowrap">UPC</th>
                        <th className="text-left px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70" style={{ width: "18%" }}>Description</th>
                        <th className="text-left px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70 whitespace-nowrap">Sub dept</th>
                        <th className="text-left px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70" style={{ width: "12%" }}>Vendor</th>
                        <th className="text-right px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70">Qty</th>
                        <th className="text-right px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70 whitespace-nowrap">Unit cost</th>
                        <th className="text-right px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70">Retail</th>
                        <th className="text-right px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70 whitespace-nowrap">Ext retail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {orderItems.map((o) => (
                        <tr key={o.line_number} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-1.5 text-right tabular-nums text-content/70">{o.line_number}</td>
                          <td className="px-3 py-1.5 tabular-nums text-content/70 whitespace-nowrap">{o.product_code}</td>
                          <td className="px-3 py-1.5 font-medium text-content max-w-0 cursor-default"><DescCell text={o.description} /></td>
                          <td className="px-3 py-1.5 text-content/70 whitespace-nowrap">{o.sub_department_description}</td>
                          <td className="px-3 py-1.5 text-content/70 max-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{o.vendor_name}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-content">{o.qty}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-content/70">
                            {o.casesize > 0 ? formatCurrency2(o.base_cost / o.casesize) : "—"}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-content/70">{formatCurrency2(o.active_retail_price)}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-content">{formatCurrency2(o.e_ret)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default OrderReportPanel;
