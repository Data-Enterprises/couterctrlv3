import { useState, useMemo } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import BottomSheet from "../../../components/BottomSheet";
import type { AllOrder } from "../../../interfaces";
import type { SelectedOrder } from "../../../features/ordersSlice";
import { fmtNum, rowsToCsv, downloadCsv, aggregateRows } from "../../../utils/csvExport";
import type { AggFn, AggRow } from "../../../utils/csvExport";
import { buildOrdersCsv, DIMS, METRICS, AGG_OPTIONS } from "../components/ordersExportShared";

interface OrdersExportSheetProps {
  onClose: () => void;
  storeNames: string[];
  orderType: string;
  dateLabel: string;
  allOrders: AllOrder[];
  selectedOrderItems: AllOrder[];
  selectedOrder: SelectedOrder;
}

type ModalMode = "presets" | "custom";
type ExportDataset = "all" | "selected" | "subDepts";

interface MetricSelection {
  fn: AggFn;
  enabled: boolean;
}

const OrdersExportSheet = ({
  onClose,
  storeNames,
  orderType,
  dateLabel,
  allOrders,
  selectedOrderItems,
  selectedOrder,
}: OrdersExportSheetProps) => {
  const isMultiStore = storeNames.length > 1;
  const storeLabel = isMultiStore ? `${storeNames.length} stores` : (storeNames[0] ?? "");

  const [mode, setMode] = useState<ModalMode>("presets");
  const [selected, setSelected] = useState<Set<ExportDataset>>(() => new Set());

  const uniqueSubDepts = useMemo(() => {
    const map = new Map<string, { id: string; count: number }>();
    allOrders.forEach((o) => {
      const key = o.sub_department_description ?? "null";
      const existing = map.get(key);
      if (existing) existing.count += 1;
      else map.set(key, { id: key, count: 1 });
    });
    return Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id));
  }, [allOrders]);

  const isMultiSubDept = uniqueSubDepts.length > 1;

  const [customSubDepts, setCustomSubDepts] = useState<Set<string>>(() => new Set());

  const toggleCustomSubDept = (id: string) =>
    setCustomSubDepts((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const allSubDeptsSelected = customSubDepts.size === uniqueSubDepts.length;
  const noSubDeptsSelected = customSubDepts.size === 0;

  const customFilteredOrders = useMemo(
    () => allOrders.filter((o) => !isMultiSubDept || customSubDepts.has(o.sub_department_description ?? "null")),
    [allOrders, customSubDepts, isMultiSubDept],
  );

  const [presetSubDepts, setPresetSubDepts] = useState<Set<string>>(() => new Set());

  const applyPresetSubDepts = (next: Set<string>) => {
    setPresetSubDepts(next);
    setSelected((prev) => {
      const n = new Set(prev);
      if (next.size > 0) n.add("subDepts");
      else n.delete("subDepts");
      return n;
    });
  };

  const togglePresetSubDept = (id: string) => {
    const next = new Set(presetSubDepts);
    next.has(id) ? next.delete(id) : next.add(id);
    applyPresetSubDepts(next);
  };

  const allPresetSubDeptsSelected = presetSubDepts.size === uniqueSubDepts.length;
  const noPresetSubDeptsSelected = presetSubDepts.size === 0;

  const presetSubDeptFilteredOrders = useMemo(
    () => allOrders.filter((o) => presetSubDepts.has(o.sub_department_description ?? "null")),
    [allOrders, presetSubDepts],
  );

  const [groupBy, setGroupBy] = useState<Set<string>>(new Set());
  const [metrics, setMetrics] = useState<Map<string, MetricSelection>>(
    new Map([
      ["qty", { fn: "sum", enabled: false }],
      ["e_ret", { fn: "sum", enabled: false }],
      ["cogs", { fn: "sum", enabled: false }],
      ["rev", { fn: "sum", enabled: false }],
      ["active_retail_price", { fn: "avg", enabled: false }],
      ["net_cost", { fn: "sum", enabled: false }],
    ]),
  );

  const toggleGroupBy = (key: string) =>
    setGroupBy((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });

  const toggleMetric = (key: string) =>
    setMetrics((prev) => {
      const n = new Map(prev);
      const c = n.get(key)!;
      n.set(key, { ...c, enabled: !c.enabled });
      return n;
    });

  const setMetricFn = (key: string, fn: AggFn) =>
    setMetrics((prev) => {
      const n = new Map(prev);
      const c = n.get(key)!;
      n.set(key, { ...c, fn });
      return n;
    });

  const flatRows = useMemo<AggRow[]>(() => customFilteredOrders.map((o) => ({ ...o }) as unknown as AggRow), [customFilteredOrders]);

  const { aggRows, columns } = useMemo(() => {
    const activeDims = DIMS.filter((d) => groupBy.has(d.key));
    const activeMetrics = METRICS
      .map((m) => ({ ...m, sel: metrics.get(m.key) }))
      .filter((m) => m.sel?.enabled)
      .map((m) => ({ key: m.key, fn: m.sel!.fn, label: m.label }));

    const agg = aggregateRows(
      flatRows,
      activeDims.map((d) => d.key),
      activeMetrics.map((m) => ({ key: m.key, fn: m.fn })),
    );

    const display = agg.map((row) => {
      const out: Record<string, string> = {};
      for (const d of activeDims) out[d.key] = String(row[d.key] ?? "");
      for (const m of activeMetrics) {
        const colKey = `${m.fn}__${m.key}`;
        const val = Number(row[colKey]);
        out[colKey] = m.fn === "count" ? String(Math.round(val)) : fmtNum(val);
      }
      return out;
    });

    const cols = [
      ...activeDims.map((d) => ({ key: d.key, label: d.label })),
      ...activeMetrics.map((m) => ({
        key: `${m.fn}__${m.key}`,
        label: `${m.fn.charAt(0).toUpperCase() + m.fn.slice(1)} ${m.label}`,
      })),
    ];

    return { aggRows: display, columns: cols };
  }, [flatRows, groupBy, metrics]);

  const handlePresetDownload = () => {
    const sections: string[] = [];
    if (selected.has("all")) sections.push(buildOrdersCsv(allOrders, `All Orders — ${storeLabel} ${orderType} ${dateLabel}`));
    if (selected.has("selected") && selectedOrderItems.length) sections.push(buildOrdersCsv(selectedOrderItems, `Order #${selectedOrder?.orderId}`));
    if (selected.has("subDepts") && presetSubDeptFilteredOrders.length) {
      sections.push(
        buildOrdersCsv(presetSubDeptFilteredOrders, `By Sub Depts (${presetSubDepts.size} of ${uniqueSubDepts.length}) — ${storeLabel} ${orderType} ${dateLabel}`),
      );
    }
    if (!sections.length) return;
    const safeName = (isMultiStore ? orderType : `${storeLabel}_${orderType}`).replace(/[^a-z0-9]/gi, "_");
    const safeDateLabel = dateLabel.replace(/[^a-z0-9]/gi, "_");
    downloadCsv(sections.join("\n\n"), `${safeName}_${safeDateLabel}.csv`);
    onClose();
  };

  const handleCustomDownload = () => {
    if (!columns.length || !aggRows.length) return;
    const headers = columns.map((c) => c.label);
    const rows = aggRows.map((r) => columns.map((c) => r[c.key] ?? ""));
    const safeName = (isMultiStore ? orderType : `${storeLabel}_${orderType}`).replace(/[^a-z0-9]/gi, "_");
    const safeDateLabel = dateLabel.replace(/[^a-z0-9]/gi, "_");
    downloadCsv(rowsToCsv(headers, rows), `${safeName}_custom_${safeDateLabel}.csv`);
    onClose();
  };

  const hasSelected = selectedOrder !== null && selectedOrderItems.length > 0;
  const canCustomDownload = columns.length > 0 && aggRows.length > 0;

  return (
    <BottomSheet onClose={onClose}>
      <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100">
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-content">Export CSV</div>
          <div className="text-[10px] text-content/85 mt-0.5 truncate">
            {storeLabel} — {orderType}
          </div>
        </div>
        <div className="flex items-center gap-0.5 bg-content/5 rounded-md p-0.5 flex-shrink-0">
          {(["presets", "custom"] as ModalMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                mode === m ? "bg-[#1e2a4a] text-custom-white" : "text-content/85"
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
              onChange={() => setSelected((p) => { const n = new Set(p); n.has("all") ? n.delete("all") : n.add("all"); return n; })}
              className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#1e2a4a] flex-shrink-0"
            />
            <div>
              <div className="text-[13px] font-medium text-content">All Orders</div>
              <div className="text-[11px] text-content/85 mt-0.5">
                All {allOrders.length} line items for {storeLabel} — {orderType} on {dateLabel}
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={selected.has("selected")}
              disabled={!hasSelected}
              onChange={() => setSelected((p) => { const n = new Set(p); n.has("selected") ? n.delete("selected") : n.add("selected"); return n; })}
              className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#1e2a4a] flex-shrink-0"
            />
            <div>
              <div className="text-[13px] font-medium text-content">
                Selected Order {selectedOrder ? `#${selectedOrder.orderId}` : ""}
              </div>
              <div className="text-[11px] text-content/85 mt-0.5">
                {hasSelected ? `${selectedOrderItems.length} line items for order #${selectedOrder?.orderId}` : "Select an order from the list to enable"}
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
                    if (noPresetSubDeptsSelected) setPresetSubDepts(new Set(uniqueSubDepts.map((s) => s.id)));
                  } else {
                    setPresetSubDepts(new Set());
                  }
                  setSelected((p) => { const n = new Set(p); checking ? n.add("subDepts") : n.delete("subDepts"); return n; });
                }}
                className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#1e2a4a] flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-medium text-content">By Sub Depts</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.preventDefault(); applyPresetSubDepts(new Set(uniqueSubDepts.map((s) => s.id))); }}
                      disabled={allPresetSubDeptsSelected}
                      className="text-[10px] text-[#1e2a4a] disabled:text-content/40 transition-colors"
                    >
                      All
                    </button>
                    <span className="text-[10px] text-content/40">·</span>
                    <button
                      onClick={(e) => { e.preventDefault(); applyPresetSubDepts(new Set()); }}
                      disabled={noPresetSubDeptsSelected}
                      className="text-[10px] text-[#1e2a4a] disabled:text-content/40 transition-colors"
                    >
                      None
                    </button>
                  </div>
                </div>
                <div className="text-[11px] text-content/85 mt-0.5">
                  {presetSubDeptFilteredOrders.length} line items across {presetSubDepts.size} of {uniqueSubDepts.length} sub depts
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {uniqueSubDepts.map((s) => (
                    <button
                      key={s.id}
                      onClick={(e) => { e.preventDefault(); togglePresetSubDept(s.id); }}
                      className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                        presetSubDepts.has(s.id)
                          ? "bg-[#1e2a4a] text-custom-white border-[#1e2a4a]"
                          : "bg-custom-white text-content border-gray-200"
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
                <div className="text-[10px] font-semibold uppercase tracking-wide text-content/85">Sub Depts</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCustomSubDepts(new Set(uniqueSubDepts.map((s) => s.id)))}
                    disabled={allSubDeptsSelected}
                    className="text-[10px] text-[#1e2a4a] disabled:text-content/40 transition-colors"
                  >
                    All
                  </button>
                  <span className="text-[10px] text-content/40">·</span>
                  <button
                    onClick={() => setCustomSubDepts(new Set())}
                    disabled={noSubDeptsSelected}
                    className="text-[10px] text-[#1e2a4a] disabled:text-content/40 transition-colors"
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
                      className="accent-[#1e2a4a] h-3.5 w-3.5 rounded flex-shrink-0"
                    />
                    <span className="text-[12px] text-content truncate flex-1">{s.id}</span>
                    <span className="text-[10px] text-content/85 flex-shrink-0">{s.count} ln</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-content/85 mb-2">Group By</div>
            <div className="space-y-2">
              {DIMS.map((d) => (
                <label key={d.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={groupBy.has(d.key)}
                    onChange={() => toggleGroupBy(d.key)}
                    className="accent-[#1e2a4a] h-3.5 w-3.5 rounded flex-shrink-0"
                  />
                  <span className="text-[12px] text-content">{d.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-content/85 mb-2">Metrics</div>
            <div className="space-y-2">
              {METRICS.map((m) => {
                const sel = metrics.get(m.key)!;
                return (
                  <div key={m.key} className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={sel.enabled}
                      onChange={() => toggleMetric(m.key)}
                      className="accent-[#1e2a4a] h-3.5 w-3.5 rounded flex-shrink-0"
                    />
                    <span className={`text-[12px] flex-1 ${sel.enabled ? "text-content" : "text-content/85"}`}>{m.label}</span>
                    <select
                      value={sel.fn}
                      disabled={!sel.enabled}
                      onChange={(e) => setMetricFn(m.key, e.target.value as AggFn)}
                      className="text-[10px] border border-gray-200 rounded px-1 py-1 text-content disabled:opacity-40 bg-custom-white outline-none"
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

          <div className="text-[10px] text-content/85">
            Working on {customFilteredOrders.length} of {allOrders.length} line items
            {isMultiSubDept ? ` · ${customSubDepts.size} of ${uniqueSubDepts.length} sub depts` : ""} for {orderType} on {dateLabel}.
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <button onClick={onClose} className="text-[12px] text-content/85">
          Cancel
        </button>
        <button
          onClick={mode === "presets" ? handlePresetDownload : handleCustomDownload}
          disabled={mode === "presets" ? selected.size === 0 : !canCustomDownload}
          className="flex items-center gap-1.5 bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
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
