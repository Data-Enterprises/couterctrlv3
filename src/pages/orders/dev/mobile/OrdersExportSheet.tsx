// Hooks
import { useOrdersExportSheet } from "./hooks/exportSheet";

// Utils
import { DIMS, METRICS, AGG_OPTIONS } from "./utils";

// Interfaces
import type { AggFn } from "../../../../utils/csvExport";
import type { AllOrder } from "../../../../interfaces";
import type { SelectedOrder } from "../../../../features/dev/devOrdersSlice";
import type { ModalMode } from "./interfaces";

// Components
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import BottomSheet from "../../../../components-dev/BottomSheet";

interface OrdersExportSheetProps {
  onClose: () => void;
  storeNames: string[];
  orderType: string;
  dateLabel: string;
  allOrders: AllOrder[];
  selectedOrderItems: AllOrder[];
  selectedOrder: SelectedOrder;
}

/** The phone Orders export sheet. Presets picks All Orders, the selected order, or chosen sub depts; Custom groups
 *  by chosen fields with sum/avg metrics over the chosen sub depts. */
const OrdersExportSheet = ({
  onClose,
  storeNames,
  orderType,
  dateLabel,
  allOrders,
  selectedOrderItems,
  selectedOrder,
}: OrdersExportSheetProps) => {
  const {
    storeLabel,
    mode,
    setMode,
    selected,
    setSelected,
    uniqueSubDepts,
    isMultiSubDept,
    customSubDepts,
    setCustomSubDepts,
    toggleCustomSubDept,
    allSubDeptsSelected,
    noSubDeptsSelected,
    customFilteredOrders,
    presetSubDepts,
    setPresetSubDepts,
    applyPresetSubDepts,
    togglePresetSubDept,
    allPresetSubDeptsSelected,
    noPresetSubDeptsSelected,
    presetSubDeptFilteredOrders,
    groupBy,
    toggleGroupBy,
    metrics,
    toggleMetric,
    setMetricFn,
    handlePresetDownload,
    handleCustomDownload,
    hasSelected,
    canCustomDownload,
  } = useOrdersExportSheet({
    onClose,
    storeNames,
    orderType,
    dateLabel,
    allOrders,
    selectedOrderItems,
    selectedOrder,
  });

  return (
    <BottomSheet onClose={onClose}>
      <div className="flex items-center justify-between px-4 pb-3 border-b border-line_hair">
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-content">Export CSV</div>
          <div className="text-[10px] text-content/95 mt-0.5 truncate">
            {storeLabel} — {orderType}
          </div>
        </div>
        <div className="flex items-center gap-0.5 bg-content/5 rounded-md p-0.5 flex-shrink-0">
          {(["presets", "custom"] as ModalMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`cc-chip-btn text-[11px] ${
                mode === m
                  ? "bg-brand_navy text-custom-white"
                  : "text-content/95"
              }`}
            >
              {m === "presets" ? "Presets" : "Custom"}
            </button>
          ))}
        </div>
      </div>

      {mode === "presets" ? (
        <div className="px-4 py-4 space-y-4 max-h-[55vh] overflow-y-auto thin-scrollbar">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={selected.has("all")}
              onChange={() =>
                setSelected((p) => {
                  const n = new Set(p);
                  n.has("all") ? n.delete("all") : n.add("all");
                  return n;
                })
              }
              className="mt-0.5 cc-checkbox border-line_strong flex-shrink-0"
            />
            <div>
              <div className="text-[13px] font-medium text-content">
                All Orders
              </div>
              <div className="text-[11px] text-content/95 mt-0.5">
                All {allOrders.length} line items for {storeLabel} — {orderType}{" "}
                on {dateLabel}
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={selected.has("selected")}
              disabled={!hasSelected}
              onChange={() =>
                setSelected((p) => {
                  const n = new Set(p);
                  n.has("selected") ? n.delete("selected") : n.add("selected");
                  return n;
                })
              }
              className="mt-0.5 cc-checkbox border-line_strong flex-shrink-0"
            />
            <div>
              <div className="text-[13px] font-medium text-content">
                Selected Order{" "}
                {selectedOrder ? `#${selectedOrder.orderId}` : ""}
              </div>
              <div className="text-[11px] text-content/95 mt-0.5">
                {hasSelected
                  ? `${selectedOrderItems.length} line items for order #${selectedOrder?.orderId}`
                  : "Select an order from the list to enable"}
              </div>
            </div>
          </label>

          {isMultiSubDept && (
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selected.has("subDepts")}
                onChange={() => {
                  const checking = !selected.has("subDepts");
                  if (checking) {
                    if (noPresetSubDeptsSelected)
                      setPresetSubDepts(
                        new Set(uniqueSubDepts.map((s) => s.id)),
                      );
                  } else {
                    setPresetSubDepts(new Set());
                  }
                  setSelected((p) => {
                    const n = new Set(p);
                    checking ? n.add("subDepts") : n.delete("subDepts");
                    return n;
                  });
                }}
                className="mt-0.5 cc-checkbox border-line_strong flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-medium text-content">
                    By Sub Depts
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        applyPresetSubDepts(
                          new Set(uniqueSubDepts.map((s) => s.id)),
                        );
                      }}
                      disabled={allPresetSubDeptsSelected}
                      className="text-[10px] text-brand_navy disabled:text-content/40 transition-colors"
                    >
                      All
                    </button>
                    <span className="text-[10px] text-content/95">·</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        applyPresetSubDepts(new Set());
                      }}
                      disabled={noPresetSubDeptsSelected}
                      className="text-[10px] text-brand_navy disabled:text-content/40 transition-colors"
                    >
                      None
                    </button>
                  </div>
                </div>
                <div className="text-[11px] text-content/95 mt-0.5">
                  {presetSubDeptFilteredOrders.length} line items across{" "}
                  {presetSubDepts.size} of {uniqueSubDepts.length} sub depts
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {uniqueSubDepts.map((s) => (
                    <button
                      key={s.id}
                      onClick={(e) => {
                        e.preventDefault();
                        togglePresetSubDept(s.id);
                      }}
                      className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                        presetSubDepts.has(s.id)
                          ? "bg-brand_navy text-custom-white border-brand_navy"
                          : "bg-custom-white text-content border-line_field"
                      }`}
                    >
                      {s.id}
                    </button>
                  ))}
                </div>
              </div>
            </label>
          )}
        </div>
      ) : (
        <div className="px-4 py-4 space-y-5 max-h-[55vh] overflow-y-auto thin-scrollbar">
          {isMultiSubDept && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] cc-caps">Sub Depts</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCustomSubDepts(
                        new Set(uniqueSubDepts.map((s) => s.id)),
                      )
                    }
                    disabled={allSubDeptsSelected}
                    className="text-[10px] text-brand_navy disabled:text-content/40 transition-colors"
                  >
                    All
                  </button>
                  <span className="text-[10px] text-content/95">·</span>
                  <button
                    onClick={() => setCustomSubDepts(new Set())}
                    disabled={noSubDeptsSelected}
                    className="text-[10px] text-brand_navy disabled:text-content/40 transition-colors"
                  >
                    None
                  </button>
                </div>
              </div>
              <div className="space-y-2.5 max-h-36 overflow-y-auto thin-scrollbar pr-1">
                {uniqueSubDepts.map((s) => (
                  <label key={s.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={customSubDepts.has(s.id)}
                      onChange={() => toggleCustomSubDept(s.id)}
                      className="cc-checkbox flex-shrink-0"
                    />
                    <span className="text-[12px] text-content truncate flex-1">
                      {s.id}
                    </span>
                    <span className="text-[10px] text-content/95 flex-shrink-0">
                      {s.count} ln
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-[10px] cc-caps mb-2">Group By</div>
            <div className="space-y-2">
              {DIMS.map((d) => (
                <label key={d.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={groupBy.has(d.key)}
                    onChange={() => toggleGroupBy(d.key)}
                    className="cc-checkbox flex-shrink-0"
                  />
                  <span className="text-[12px] text-content">{d.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] cc-caps mb-2">Metrics</div>
            <div className="space-y-2">
              {METRICS.map((m) => {
                const sel = metrics.get(m.key)!;
                return (
                  <div key={m.key} className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={sel.enabled}
                      onChange={() => toggleMetric(m.key)}
                      className="cc-checkbox flex-shrink-0"
                    />
                    <span
                      className={`text-[12px] flex-1 ${sel.enabled ? "text-content" : "text-content/95"}`}
                    >
                      {m.label}
                    </span>
                    <select
                      value={sel.fn}
                      disabled={!sel.enabled}
                      onChange={(e) =>
                        setMetricFn(m.key, e.target.value as AggFn)
                      }
                      className="text-[10px] border border-line_field rounded px-1 py-1 text-content disabled:opacity-40 bg-custom-white outline-none"
                    >
                      {AGG_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[10px] text-content/95">
            Working on {customFilteredOrders.length} of {allOrders.length} line
            items
            {isMultiSubDept
              ? ` · ${customSubDepts.size} of ${uniqueSubDepts.length} sub depts`
              : ""}{" "}
            for {orderType} on {dateLabel}.
          </div>
        </div>
      )}

      <div className="cc-bar-footer">
        <button onClick={onClose} className="text-[12px] text-content/95">
          Cancel
        </button>
        <button
          onClick={
            mode === "presets" ? handlePresetDownload : handleCustomDownload
          }
          disabled={
            mode === "presets" ? selected.size === 0 : !canCustomDownload
          }
          className="flex items-center gap-1.5 cc-btn-primary text-[12px]"
        >
          <ArrowDownTrayIcon className="w-3.5 h-3.5" />
          Download CSV
        </button>
      </div>
      <div className="h-4 flex-shrink-0" />
    </BottomSheet>
  );
};

export default OrdersExportSheet;
