import { useState, useMemo, useRef, useEffect } from "react";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import EmptyPrompt from "../../../components/EmptyPrompt";
import SelectFilter from "../../../components/filters/SelectFilter";
import { ArrowDownTrayIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import type { AllOrder } from "../../../interfaces";
import type { SelectedOrderKey, SelectedOrder } from "../../../features/ordersSlice";
import type { Store } from "../../../interfaces";
import { formatCurrency2 } from "../../../utils";
import OrdersExportModal from "./OrdersExportModal";

interface Props {
  orders: AllOrder[];
  loading: boolean;
  selectedKey: SelectedOrderKey;
  selectedOrder: SelectedOrder;
  assignedStores: Store[];
  onSelectOrder: (storeid: number, orderId: number | null) => void;
  onExport: () => void;
}

const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${m}/${d}/${y}`;
};

const MAX_CHIPS = 3;

const colFilterInputStyle: React.CSSProperties = {
  width: "100%",
  fontSize: 11,
  border: "1px solid rgba(30,42,74,0.15)",
  borderRadius: 4,
  padding: "4px 7px",
  outline: "none",
  color: "#1e2a4a",
};

interface ColFilterProps {
  label: string;
  active: boolean;
  appliedDisplay?: string;
  align?: "left" | "right";
  onApply: () => void;
  onClear?: () => void;
  children: React.ReactNode;
}

const ColFilter = ({ label, active, appliedDisplay, align = "left", onApply, onClear, children }: ColFilterProps) => {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const handleApply = () => { onApply(); setOpen(false); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") handleApply(); };
  const labelColor = open || active ? "#1e2a4a" : hovered ? "rgba(30,42,74,0.65)" : "rgba(30,42,74,0.4)";

  return (
    <div ref={wrapRef} className="relative flex items-center gap-1 min-w-0">
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wide transition-colors select-none flex-shrink-0"
        style={{ color: labelColor }}
      >
        {label}
      </button>
      {active && appliedDisplay && (
        <span className="flex items-center gap-0.5 rounded px-1 py-0.5 flex-shrink-0" style={{ background: "rgba(30,42,74,0.08)", maxWidth: 90 }}>
          <span className="text-[8px] font-medium text-[#1e2a4a] truncate">{appliedDisplay}</span>
          {onClear && (
            <button
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="text-[8px] text-[#1e2a4a] leading-none flex-shrink-0 ml-0.5"
            >✕</button>
          )}
        </span>
      )}
      {open && <div className="fixed inset-0 z-[199]" onClick={() => setOpen(false)} />}
      {open && (
        <div
          onKeyDown={handleKeyDown}
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            ...(align === "right" ? { right: 0 } : { left: 0 }),
            zIndex: 200,
            background: "white",
            border: "1px solid rgba(30,42,74,0.12)",
            borderRadius: 6,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            padding: "10px 10px 8px",
            minWidth: 176,
          }}
        >
          {children}
          <button
            onClick={handleApply}
            className="mt-2 w-full flex items-center justify-center gap-1.5 rounded py-1 text-[10px] font-medium"
            style={{ background: "#1e2a4a", color: "white" }}
          >
            <MagnifyingGlassIcon className="w-3 h-3" />
            Apply
          </button>
        </div>
      )}
    </div>
  );
};

const DescCell = ({ text }: { text: string }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="overflow-hidden text-ellipsis whitespace-nowrap">{text}</div>
      {hovered && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-[#1e2a4a] rounded-lg shadow-lg px-2.5 py-1.5 whitespace-nowrap pointer-events-none">
          <span className="text-[9px] text-white">{text}</span>
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
        <span key={sd} className="text-[8px] bg-gray-100 text-content rounded px-1.5 py-0.5">{sd}</span>
      ))}
      {overflow.length > 0 && (
        <div className="relative inline-flex" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
          <span className="text-[8px] font-semibold bg-[#1e2a4a]/[0.07] text-content rounded px-1.5 py-0.5 cursor-default">
            +{overflow.length} more
          </span>
          {hovered && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-[#1e2a4a] rounded-lg shadow-lg px-2.5 py-2 flex flex-col gap-0.5" style={{ minWidth: 100 }}>
              {overflow.map((sd) => (
                <span key={sd} className="text-[9px] text-white leading-relaxed whitespace-nowrap">{sd}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StoreLabel = ({ names }: { names: string[] }) => {
  const [hovered, setHovered] = useState(false);
  if (names.length <= 1) return <>{names[0] ?? ""}</>;
  return (
    <span
      className="relative inline-block cursor-default"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {names.length} stores
      {hovered && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-[#1e2a4a] rounded-lg shadow-lg px-2.5 py-1.5 flex flex-col gap-0.5 whitespace-nowrap">
          {names.map((n) => (
            <span key={n} className="text-[9px] text-white leading-relaxed">{n}</span>
          ))}
        </div>
      )}
    </span>
  );
};

const OrderReportPanel = ({
  orders,
  loading,
  selectedKey,
  selectedOrder,
  assignedStores,
  onSelectOrder,
}: Props) => {
  const [subDeptFilter, setSubDeptFilter] = useState<string>("");
  const [exportOpen, setExportOpen] = useState(false);

  const [draftUpc, setDraftUpc] = useState("");
  const [appliedUpc, setAppliedUpc] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [appliedDesc, setAppliedDesc] = useState("");
  const [appliedSubDept, setAppliedSubDept] = useState("");
  const [appliedVendor, setAppliedVendor] = useState("");
  const [appliedStore, setAppliedStore] = useState("");

  useEffect(() => {
    setDraftUpc(""); setAppliedUpc("");
    setDraftDesc(""); setAppliedDesc("");
    setAppliedSubDept("");
    setAppliedVendor("");
    setAppliedStore("");
  }, [selectedOrder]);

  const storeNames = useMemo(
    () =>
      selectedKey
        ? selectedKey.storeids.map((id) => assignedStores.find((s) => s.storeid === id)?.store_name ?? `Store ${id}`)
        : [],
    [selectedKey, assignedStores],
  );
  const filteredOrders = selectedKey
    ? orders.filter((o) => o.order_type === selectedKey.order_type)
    : orders;

  const allSubDepts = useMemo(() =>
    Array.from(new Set(filteredOrders.map((o) => o.sub_department_description).filter(Boolean))).sort(),
  [filteredOrders]);

  const subFilteredOrders = subDeptFilter
    ? filteredOrders.filter((o) => o.sub_department_description === subDeptFilter)
    : filteredOrders;

  const uniqueOrderKeys = useMemo(() => {
    const map = new Map<string, { storeid: number; orderId: number }>();
    subFilteredOrders.forEach((o) => {
      const key = `${o.storeid}:${o.order_id}`;
      if (!map.has(key)) map.set(key, { storeid: o.storeid, orderId: o.order_id });
    });
    return Array.from(map.values()).sort((a, b) => a.orderId - b.orderId || a.storeid - b.storeid);
  }, [subFilteredOrders]);

  const orderItems = selectedOrder !== null
    ? [...filteredOrders.filter((o) => o.order_id === selectedOrder.orderId && o.storeid === selectedOrder.storeid)].sort((a, b) => a.line_number - b.line_number)
    : [];

  const selectedExtRetail = orderItems.reduce((s, o) => s + (o.e_ret ?? 0), 0);
  const selectedCost = orderItems.reduce((s, o) => s + (o.cogs ?? 0), 0);

  const orderSubDepts = useMemo(
    () => Array.from(new Set(orderItems.map((o) => o.sub_department_description).filter(Boolean))).sort(),
    [orderItems]
  );

  const orderVendors = useMemo(
    () => Array.from(new Set(orderItems.map((o) => o.vendor_name).filter(Boolean))).sort(),
    [orderItems]
  );

  const orderStores = useMemo(() => {
    const map = new Map<number, string>();
    orderItems.forEach((o) => {
      if (!map.has(o.storeid)) {
        map.set(o.storeid, assignedStores.find((s) => s.storeid === o.storeid)?.store_name ?? `Store ${o.storeid}`);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [orderItems, assignedStores]);

  const visibleOrderItems = useMemo(() => {
    return orderItems.filter((o) => {
      if (appliedUpc && !String(o.product_code).toLowerCase().includes(appliedUpc.toLowerCase())) return false;
      if (appliedDesc && !o.description.toLowerCase().includes(appliedDesc.toLowerCase())) return false;
      if (appliedSubDept && o.sub_department_description !== appliedSubDept) return false;
      if (appliedVendor && o.vendor_name !== appliedVendor) return false;
      if (appliedStore && String(o.storeid) !== appliedStore) return false;
      return true;
    });
  }, [orderItems, appliedUpc, appliedDesc, appliedSubDept, appliedVendor, appliedStore]);

  return (
    <div className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white" style={{ flex: 1, minWidth: 0 }}>

      {exportOpen && selectedKey && (
        <OrdersExportModal
          onClose={() => setExportOpen(false)}
          storeNames={storeNames}
          orderType={selectedKey.order_type}
          orderDate={selectedKey.order_date}
          allOrders={filteredOrders}
          selectedOrderItems={orderItems}
          selectedOrder={selectedOrder}
        />
      )}

      {/* Header */}
      <div className="bg-[#1e2a4a] px-3 pt-1 pb-2 flex-shrink-0 flex flex-col gap-0">
        {/* Row 1 */}
        <div className="flex items-end gap-3 min-h-[26px]">
          {selectedKey ? (
            <>
              <span className="text-white font-medium text-[13px] flex-shrink-0">
                <StoreLabel names={storeNames} /> — {selectedKey.order_type}
              </span>
              <span className="text-white text-[10px] flex-shrink-0">{fmtDate(selectedKey.order_date)}</span>
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
              <span className="text-[9px] font-bold uppercase tracking-wide text-content flex-shrink-0">Orders</span>
              {allSubDepts.length > 0 && (
                <SelectFilter
                  options={allSubDepts.map((sd) => ({ value: sd, label: sd }))}
                  value={subDeptFilter}
                  onChange={(v) => { setSubDeptFilter(v); onSelectOrder(0, null); }}
                  placeholder="All sub depts"
                  className="flex-1 min-w-0"
                />
              )}
            </div>
            <div className="flex-1 overflow-y-auto thin-scrollbar">
              {uniqueOrderKeys.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-[11px] text-content">No orders found</div>
              ) : (
                uniqueOrderKeys.map(({ storeid, orderId }) => {
                  const items = subFilteredOrders.filter((o) => o.order_id === orderId && o.storeid === storeid);
                  const allItems = filteredOrders.filter((o) => o.order_id === orderId && o.storeid === storeid);
                  const eRet = items.reduce((s, o) => s + (o.e_ret ?? 0), 0);
                  const subDepts = Array.from(new Set(allItems.map((o) => o.sub_department_description).filter(Boolean)));
                  const isSel = selectedOrder?.orderId === orderId && selectedOrder?.storeid === storeid;
                  return (
                    <button
                      key={`${storeid}-${orderId}`}
                      onClick={() => onSelectOrder(storeid, orderId)}
                      className={`w-full flex gap-2 items-start px-2.5 py-2 border-b border-gray-100 text-left transition-colors ${isSel ? "bg-white" : "hover:bg-gray-50"}`}
                      style={isSel ? { boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)" } : undefined}
                    >
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[11px] font-semibold text-[#1e2a4a]">#{orderId}</span>
                          {items[0]?.status && <span className="text-[9px] italic text-content flex-shrink-0">{items[0].status}</span>}
                        </div>
                        {storeNames.length > 1 && (
                          <span className="text-[9px] text-content truncate">
                            {assignedStores.find((s) => s.storeid === storeid)?.store_name ?? `Store ${storeid}`}
                          </span>
                        )}
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[10px] font-semibold text-[#1e2a4a]">{formatCurrency2(eRet)}</span>
                          <span className="text-[9px] text-content flex-shrink-0">{items.length} items</span>
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
            {selectedOrder === null ? (
              <EmptyPrompt title="No order selected" description="Select an order from the list to view its line items" />
            ) : (
              <>
                <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                  <div className="px-4 py-2.5">
                    <div className="text-[9px] font-medium uppercase tracking-wide text-content">Order</div>
                    <div className="text-[13px] font-semibold text-content">#{selectedOrder?.orderId}</div>
                  </div>
                  <div className="px-4 py-2.5">
                    <div className="text-[9px] font-medium uppercase tracking-wide text-content">Items</div>
                    <div className="text-[13px] font-semibold text-content">{orderItems.length}</div>
                  </div>
                  <div className="px-4 py-2.5">
                    <div className="text-[9px] font-medium uppercase tracking-wide text-content">Ext retail</div>
                    <div className="text-[13px] font-semibold text-content">{formatCurrency2(selectedExtRetail)}</div>
                  </div>
                  <div className="px-4 py-2.5">
                    <div className="text-[9px] font-medium uppercase tracking-wide text-content">Ext cost</div>
                    <div className="text-[13px] font-semibold text-content">{formatCurrency2(selectedCost)}</div>
                  </div>
                </div>
                <div className="flex-1 overflow-auto thin-scrollbar">
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
                        <th className="text-right px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content">#</th>
                        <th className="text-left px-3 py-2" style={{ width: "12%" }}>
                          <ColFilter
                            label="Store"
                            active={!!appliedStore}
                            appliedDisplay={orderStores.find((s) => String(s.id) === appliedStore)?.name}
                            onApply={() => {}}
                            onClear={() => setAppliedStore("")}
                          >
                            <SelectFilter
                              options={orderStores.map((s) => ({ value: String(s.id), label: s.name }))}
                              value={appliedStore}
                              onChange={setAppliedStore}
                              placeholder="All stores"
                              className="w-full"
                            />
                          </ColFilter>
                        </th>
                        <th className="text-left px-3 py-2">
                          <ColFilter
                            label="UPC"
                            active={!!appliedUpc}
                            appliedDisplay={appliedUpc}
                            onApply={() => setAppliedUpc(draftUpc)}
                            onClear={() => { setAppliedUpc(""); setDraftUpc(""); }}
                          >
                            <input autoFocus style={colFilterInputStyle} placeholder="Search UPC…" value={draftUpc} onChange={(e) => setDraftUpc(e.target.value)} />
                          </ColFilter>
                        </th>
                        <th className="text-left px-3 py-2" style={{ width: "18%" }}>
                          <ColFilter
                            label="Description"
                            active={!!appliedDesc}
                            appliedDisplay={appliedDesc}
                            onApply={() => setAppliedDesc(draftDesc)}
                            onClear={() => { setAppliedDesc(""); setDraftDesc(""); }}
                          >
                            <input autoFocus style={colFilterInputStyle} placeholder="Search…" value={draftDesc} onChange={(e) => setDraftDesc(e.target.value)} />
                          </ColFilter>
                        </th>
                        <th className="text-left px-3 py-2 whitespace-nowrap">
                          <ColFilter
                            label="Sub dept"
                            active={!!appliedSubDept}
                            appliedDisplay={appliedSubDept}
                            onApply={() => {}}
                            onClear={() => setAppliedSubDept("")}
                          >
                            <SelectFilter
                              options={orderSubDepts.map((sd) => ({ value: sd, label: sd }))}
                              value={appliedSubDept}
                              onChange={setAppliedSubDept}
                              placeholder="All sub depts"
                              className="w-full"
                            />
                          </ColFilter>
                        </th>
                        <th className="text-left px-3 py-2" style={{ width: "12%" }}>
                          <ColFilter
                            label="Vendor"
                            active={!!appliedVendor}
                            appliedDisplay={appliedVendor}
                            onApply={() => {}}
                            onClear={() => setAppliedVendor("")}
                          >
                            <SelectFilter
                              options={orderVendors.map((v) => ({ value: v, label: v }))}
                              value={appliedVendor}
                              onChange={setAppliedVendor}
                              placeholder="All vendors"
                              className="w-full"
                            />
                          </ColFilter>
                        </th>
                        <th className="text-right px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content">Qty</th>
                        <th className="text-right px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content whitespace-nowrap">Unit cost</th>
                        <th className="text-right px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content">Retail</th>
                        <th className="text-right px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content whitespace-nowrap">Ext retail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {visibleOrderItems.map((o) => (
                        <tr key={`${o.storeid}-${o.line_number}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-1.5 text-right tabular-nums text-content">{o.line_number}</td>
                          <td className="px-3 py-1.5 text-content whitespace-nowrap">
                            {assignedStores.find((s) => s.storeid === o.storeid)?.store_name ?? o.storeid}
                          </td>
                          <td className="px-3 py-1.5 tabular-nums text-content whitespace-nowrap">{o.product_code}</td>
                          <td className="px-3 py-1.5 font-medium text-content max-w-0 cursor-default"><DescCell text={o.description} /></td>
                          <td className="px-3 py-1.5 text-content whitespace-nowrap">{o.sub_department_description}</td>
                          <td className="px-3 py-1.5 text-content max-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{o.vendor_name}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-content">{o.qty}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-content">
                            {o.casesize > 0 ? formatCurrency2(o.base_cost / o.casesize) : "—"}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-content">{formatCurrency2(o.active_retail_price)}</td>
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
