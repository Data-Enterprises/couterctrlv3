import { useState, useMemo } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import SelectFilter from "../../../components/filters/SelectFilter";
import MobilePerfHeader from "../../../components/mobile/MobilePerfHeader";
import HeaderIconButton from "../../../components/HeaderIconButton";
import { ORDERS_INFO } from "../ordersInfo";
import type { AllOrder } from "../../../interfaces";
import type { SelectedOrderKey } from "../../../features/ordersSlice";
import type { Store } from "../../../interfaces";
import { formatCurrency2, resolveStoreName } from "../../../utils";

export type OrderSelection = {
  storeid: number;
  storenumber: string;
  orderId: number;
};

interface Props {
  orders: AllOrder[];
  loading: boolean;
  selectedKey: SelectedOrderKey;
  assignedStores: Store[];
  groupStores: Store[];
  onBack: () => void;
  onSelectOrder: (sel: OrderSelection | null) => void;
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

const OrdersListScreen = ({ orders, loading, selectedKey, assignedStores, groupStores, onBack, onSelectOrder, onExport }: Props) => {
  const [subDeptFilter, setSubDeptFilter] = useState("");

  // "Select all stores" spans the whole selection, so naming only storeids[0]
  // labelled the screen with one arbitrary store. Desktop says "N stores".
  const storeLabel = !selectedKey
    ? ""
    : selectedKey.storeids.length > 1
      ? `${selectedKey.storeids.length} stores`
      : resolveStoreName(assignedStores, groupStores, selectedKey.storeids[0]);

  // The range, not just the start date — "select all stores" with no date
  // filter fetches the whole search window, and showing one day of it in the
  // header misreported what the list below covers.
  const dateLabel = !selectedKey
    ? ""
    : selectedKey.order_date === selectedKey.order_date_end
      ? fmtDate(selectedKey.order_date)
      : `${fmtDate(selectedKey.order_date)} – ${fmtDate(selectedKey.order_date_end)}`;

  const filteredOrders = selectedKey
    ? orders.filter((o) => o.order_type === selectedKey.order_type)
    : orders;

  const allSubDepts = useMemo(() =>
    Array.from(new Set(filteredOrders.map((o) => o.sub_department_description).filter(Boolean))).sort(),
  [filteredOrders]);

  const subFilteredOrders = subDeptFilter
    ? filteredOrders.filter((o) => o.sub_department_description === subDeptFilter)
    : filteredOrders;

  // Keyed on storeid + storenumber + order_id, matching OrderReportPanel's
  // uniqueOrderKeys. Grouping by order_id alone merged two stores' identically
  // numbered orders into one row with both their totals behind it.
  const orderKeys = useMemo(() => {
    const map = new Map<string, OrderSelection>();
    subFilteredOrders.forEach((o) => {
      const key = `${o.storeid}__${o.storenumber}:${o.order_id}`;
      if (!map.has(key))
        map.set(key, { storeid: o.storeid, storenumber: o.storenumber, orderId: o.order_id });
    });
    return Array.from(map.values()).sort(
      (a, b) =>
        a.orderId - b.orderId ||
        a.storeid - b.storeid ||
        a.storenumber.localeCompare(b.storenumber),
    );
  }, [subFilteredOrders]);

  const totalExtRetail = subFilteredOrders.reduce((s, o) => s + (o.e_ret ?? 0), 0);

  return (
    <div className="flex flex-col h-full">
      <MobilePerfHeader
        pageName={`Orders · ${selectedKey?.order_type ?? ""}`}
        storeName={storeLabel}
        dateRange={dateLabel}
        onBack={onBack}
        info={ORDERS_INFO}
        actions={
          <HeaderIconButton onClick={onExport} title="Export CSV">
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
          </HeaderIconButton>
        }
      />

      {/* Sub-header chips + sub dept filter */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-custom-white flex-shrink-0 gap-2">
        {allSubDepts.length > 0 && (
          <SelectFilter
            options={allSubDepts.map((sd) => ({ value: sd, label: sd }))}
            value={subDeptFilter}
            onChange={(v) => { setSubDeptFilter(v); onSelectOrder(null); }}
            placeholder="All sub depts"
            className="flex-1 min-w-0"
          />
        )}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="flex items-baseline gap-1 rounded px-1.5 py-0.5" style={chipStyle}>
            <span className="text-[10px] text-content">Orders</span>
            <span className="text-[10px] font-semibold text-content">{orderKeys.length}</span>
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

      {/* Order list — pb-14 clears the fixed bottom tab bar. */}
      <div className="flex-1 overflow-y-auto thin-scrollbar pb-14">
        {loading && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content">Loading orders…</div>
        )}
        {!loading && orderKeys.map((sel) => {
          const sameOrder = (o: AllOrder) =>
            o.order_id === sel.orderId &&
            o.storeid === sel.storeid &&
            o.storenumber === sel.storenumber;
          const items = subFilteredOrders.filter(sameOrder);
          const eRet = items.reduce((s, o) => s + (o.e_ret ?? 0), 0);
          const eCost = items.reduce((s, o) => s + (o.cogs ?? 0), 0);
          const status = items[0]?.status ?? "";
          // Chips come from the order's full line set, not the sub-dept
          // filtered one — desktop does the same, so the card keeps telling
          // you what else is in the order while you're filtered down to one.
          const subDepts = Array.from(
            new Set(filteredOrders.filter(sameOrder).map((o) => o.sub_department_description).filter(Boolean)),
          ).sort();
          return (
            <button
              key={`${sel.storeid}__${sel.storenumber}-${sel.orderId}`}
              onClick={() => onSelectOrder(sel)}
              className="w-full px-4 py-3 border-b border-gray-100 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] font-semibold text-[#1e2a4a]">#{sel.orderId}</span>
                {status && <span className="text-[10px] text-content flex-shrink-0">{status}</span>}
              </div>
              {/* Which store this order belongs to only matters — and only
                  fits — when the selection spans more than one. */}
              {selectedKey && selectedKey.storeids.length > 1 && (
                <div className="text-[11px] font-medium text-content truncate mt-0.5">
                  {resolveStoreName(assignedStores, groupStores, sel.storeid)}
                </div>
              )}
              <div className="flex items-baseline justify-between gap-2 mt-0.5">
                <span className="text-[11px] font-semibold text-[#1e2a4a]">{formatCurrency2(eRet)}</span>
                <span className="text-[10px] text-content flex-shrink-0">
                  {formatCurrency2(eCost)} cost · {items.length} items
                </span>
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
