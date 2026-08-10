import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import type { AllOrder } from "../../../interfaces";
import type { SelectedOrderKey, SelectedOrder } from "../../../features/ordersSlice";
import type { Store } from "../../../interfaces";
import { formatCurrency2, resolveStoreName } from "../../../utils";

interface Props {
  orders: AllOrder[];
  selectedKey: SelectedOrderKey;
  /** The full identity — id alone doesn't identify an order across stores. */
  selectedOrder: NonNullable<SelectedOrder>;
  assignedStores: Store[];
  groupStores: Store[];
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

const OrdersLineItemsScreen = ({ orders, selectedKey, selectedOrder, assignedStores, groupStores, onExport }: Props) => {
  // The order's own store, not selectedKey.storeids[0] — with "select all
  // stores" a selected order can belong to any store in the selection.
  const storeName = resolveStoreName(
    assignedStores,
    groupStores,
    selectedOrder.storeid,
  );

  // Scoped to the order's store *and* location, matching OrderReportPanel's
  // orderItems. Filtering on order_id alone pulled in every other store's
  // lines that happened to share the number, inflating both totals below.
  const items = [
    ...orders.filter(
      (o) =>
        o.order_id === selectedOrder.orderId &&
        o.storeid === selectedOrder.storeid &&
        o.storenumber === selectedOrder.storenumber,
    ),
  ].sort((a, b) => a.line_number - b.line_number);

  const orderDate = items[0]?.order_date ?? selectedKey?.order_date ?? "";
  const totalExtRetail = items.reduce((s, o) => s + (o.e_ret ?? 0), 0);
  const totalCost = items.reduce((s, o) => s + (o.cogs ?? 0), 0);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-1 pb-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <div className="text-[13px] font-medium text-[#1e2a4a]">{storeName}</div>
            {/* The order's own date, not selectedKey.order_date — that's the
                start of the fetched range, and "select all stores" with no
                date filter spans the whole search window. */}
            <div className="text-[11px] text-content mt-0.5">
              #{selectedOrder.orderId}
              {orderDate ? ` · ${fmtDate(orderDate)}` : ""}
            </div>
          </div>
          <button
            onClick={onExport}
            className="flex items-center gap-1 px-2 py-1 rounded border border-gray-200 text-content hover:border-gray-300 transition-colors flex-shrink-0"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium">Export</span>
          </button>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <div className="flex items-baseline gap-1 rounded px-1.5 py-0.5" style={chipStyle}>
            <span className="text-[10px] text-content">Items</span>
            <span className="text-[11px] font-semibold text-content">{items.length}</span>
          </div>
          <div className="flex items-baseline gap-1 rounded px-1.5 py-0.5" style={chipStyle}>
            <span className="text-[10px] text-content">Retail</span>
            <span className="text-[11px] font-semibold text-content">{formatCurrency2(totalExtRetail)}</span>
          </div>
          <div className="flex items-baseline gap-1 rounded px-1.5 py-0.5" style={chipStyle}>
            <span className="text-[10px] text-content">Cost</span>
            <span className="text-[11px] font-semibold text-content">{formatCurrency2(totalCost)}</span>
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="flex-1 overflow-y-auto thin-scrollbar divide-y divide-gray-100">
        {items.map((o) => (
          <div key={o.line_number} className="flex items-start justify-between px-4 py-3 gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-content mb-0.5">
                #{o.line_number} · {o.product_code}
              </div>
              <div className="text-[12px] font-medium text-content truncate">{o.description}</div>
              <div className="text-[10px] text-content mt-0.5">
                {o.sub_department_description}
                {o.vendor_name ? ` · ${o.vendor_name}` : ""}
                {` · qty ${o.qty}`}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-[10px] text-content">{formatCurrency2(o.e_ret)} retail</div>
              <div className="text-[10px] text-content mt-0.5">{formatCurrency2(o.cogs)} cost</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersLineItemsScreen;
