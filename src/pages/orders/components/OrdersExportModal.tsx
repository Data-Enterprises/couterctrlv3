import { useState, useMemo } from "react";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import type { AllOrder } from "../../../interfaces";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrdersExportModalProps {
  onClose: () => void;
  storeName: string;
  orderType: string;
  orderDate: string;
  allOrders: AllOrder[];        // full set for selected store+date+type
  selectedOrderItems: AllOrder[]; // line items for selected order (empty if none)
  selectedOrderId: number | null;
}

type ModalMode = "presets" | "custom";
type ExportDataset = "all" | "selected";
type AggFn = "sum" | "avg" | "min" | "max" | "count";

interface DimDef   { key: string; label: string }
interface MetricDef { key: string; label: string }
interface MetricSelection { fn: AggFn; enabled: boolean }

type AggRow = Record<string, string | number | null>;

// ─── Formatting ───────────────────────────────────────────────────────────────

const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${m}/${d}/${y}`;
};

const fmtNum = (v: number, dp = 2) => v.toFixed(dp);

const escCsv = (val: string | number | null | undefined) => {
  const s = String(val ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"` : s;
};

const rowsToCsv = (headers: string[], rows: (string | number | null)[][]): string => {
  const lines = [headers.map(escCsv).join(",")];
  for (const row of rows) lines.push(row.map(escCsv).join(","));
  return lines.join("\n");
};

const downloadCsv = (content: string, filename: string) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── Preset builders ──────────────────────────────────────────────────────────

const buildOrdersCsv = (orders: AllOrder[], label: string) => {
  const headers = [
    "Order #", "Line #", "UPC", "Description", "Sub Dept", "Vendor",
    "Status", "Qty", "Case Size", "Unit Cost", "Net Cost",
    "Retail Price", "Ext Retail", "COGS", "Revenue",
  ];
  const rows = orders.map((o) => [
    o.order_id, o.line_number, o.product_code, o.description,
    o.sub_department_description, o.vendor_name, o.status,
    o.qty, o.casesize,
    o.casesize > 0 ? fmtNum(o.base_cost / o.casesize) : "—",
    fmtNum(o.net_cost), fmtNum(o.active_retail_price),
    fmtNum(o.e_ret), fmtNum(o.cogs), fmtNum(o.rev),
  ]);
  return `${label}\n${rowsToCsv(headers, rows)}`;
};

// ─── Aggregation engine ───────────────────────────────────────────────────────

function applyAgg(values: number[], fn: AggFn): number {
  if (!values.length) return 0;
  switch (fn) {
    case "sum":   return values.reduce((a, b) => a + b, 0);
    case "avg":   return values.reduce((a, b) => a + b, 0) / values.length;
    case "min":   return Math.min(...values);
    case "max":   return Math.max(...values);
    case "count": return values.length;
  }
}

function aggregateRows(rows: AggRow[], dims: string[], metrics: { key: string; fn: AggFn }[]): AggRow[] {
  if (!dims.length && !metrics.length) return rows.slice(0, 100);
  const groups = new Map<string, AggRow[]>();
  for (const row of rows) {
    const key = dims.map((d) => String(row[d] ?? "")).join("|||");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  return Array.from(groups.values()).map((group) => {
    const result: AggRow = {};
    for (const d of dims) result[d] = group[0][d];
    for (const { key, fn } of metrics) {
      const vals = group.map((r) => Number(r[key]) || 0);
      result[`${fn}__${key}`] = applyAgg(vals, fn);
    }
    return result;
  });
}

// ─── Config ───────────────────────────────────────────────────────────────────

const DIMS: DimDef[] = [
  { key: "order_id",                  label: "Order #" },
  { key: "sub_department_description", label: "Sub Dept" },
  { key: "vendor_name",               label: "Vendor" },
  { key: "status",                    label: "Status" },
  { key: "description",               label: "Description" },
];

const METRICS: MetricDef[] = [
  { key: "qty",                label: "Qty" },
  { key: "e_ret",              label: "Ext Retail" },
  { key: "cogs",               label: "COGS" },
  { key: "rev",                label: "Revenue" },
  { key: "active_retail_price", label: "Retail Price" },
  { key: "net_cost",           label: "Net Cost" },
];

const AGG_OPTIONS: { value: AggFn; label: string }[] = [
  { value: "sum",   label: "Sum" },
  { value: "avg",   label: "Avg" },
  { value: "min",   label: "Min" },
  { value: "max",   label: "Max" },
  { value: "count", label: "Count" },
];

const PREVIEW_ROWS = 5;

// ─── Component ────────────────────────────────────────────────────────────────

const OrdersExportModal = ({
  onClose,
  storeName,
  orderType,
  orderDate,
  allOrders,
  selectedOrderItems,
  selectedOrderId,
}: OrdersExportModalProps) => {

  // ── Preset state ──
  const [mode, setMode] = useState<ModalMode>("presets");
  const [selected, setSelected] = useState<Set<ExportDataset>>(() => {
    const init: Set<ExportDataset> = new Set(["all"]);
    if (selectedOrderId !== null) init.add("selected");
    return init;
  });

  // ── Custom builder state ──
  const [groupBy, setGroupBy] = useState<Set<string>>(
    new Set(["sub_department_description", "vendor_name"])
  );
  const [metrics, setMetrics] = useState<Map<string, MetricSelection>>(
    new Map([
      ["qty",                 { fn: "sum", enabled: true }],
      ["e_ret",               { fn: "sum", enabled: true }],
      ["cogs",                { fn: "sum", enabled: false }],
      ["rev",                 { fn: "sum", enabled: false }],
      ["active_retail_price", { fn: "avg", enabled: false }],
      ["net_cost",            { fn: "sum", enabled: false }],
    ])
  );

  const toggleGroupBy = (key: string) =>
    setGroupBy((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const toggleMetric = (key: string) =>
    setMetrics((prev) => { const n = new Map(prev); const c = n.get(key)!; n.set(key, { ...c, enabled: !c.enabled }); return n; });

  const setMetricFn = (key: string, fn: AggFn) =>
    setMetrics((prev) => { const n = new Map(prev); const c = n.get(key)!; n.set(key, { ...c, fn }); return n; });

  // ── Flat rows for custom builder ──
  const flatRows = useMemo<AggRow[]>(() => allOrders.map((o) => ({ ...o } as unknown as AggRow)), [allOrders]);

  // ── Aggregated result ──
  const { aggRows, columns } = useMemo(() => {
    const activeDims = DIMS.filter((d) => groupBy.has(d.key));
    const activeMetrics = METRICS
      .map((m) => ({ ...m, sel: metrics.get(m.key) }))
      .filter((m) => m.sel?.enabled)
      .map((m) => ({ key: m.key, fn: m.sel!.fn, label: m.label }));

    const aggRows = aggregateRows(
      flatRows,
      activeDims.map((d) => d.key),
      activeMetrics.map((m) => ({ key: m.key, fn: m.fn })),
    );

    const display = aggRows.map((row) => {
      const out: Record<string, string> = {};
      for (const d of activeDims) out[d.key] = String(row[d.key] ?? "");
      for (const m of activeMetrics) {
        const colKey = `${m.fn}__${m.key}`;
        const val = Number(row[colKey]);
        out[colKey] = m.fn === "count" ? String(Math.round(val)) : fmtNum(val);
      }
      return out;
    });

    const columns = [
      ...activeDims.map((d) => ({ key: d.key, label: d.label })),
      ...activeMetrics.map((m) => ({
        key: `${m.fn}__${m.key}`,
        label: `${m.fn.charAt(0).toUpperCase() + m.fn.slice(1)} ${m.label}`,
      })),
    ];

    return { aggRows: display, columns };
  }, [flatRows, groupBy, metrics]);

  // ── Preset download ──
  const handlePresetDownload = () => {
    const sections: string[] = [];
    if (selected.has("all"))      sections.push(buildOrdersCsv(allOrders, `All Orders — ${storeName} ${orderType} ${fmtDate(orderDate)}`));
    if (selected.has("selected") && selectedOrderItems.length) sections.push(buildOrdersCsv(selectedOrderItems, `Order #${selectedOrderId}`));
    if (!sections.length) return;
    const safeName = `${storeName}_${orderType}`.replace(/[^a-z0-9]/gi, "_");
    downloadCsv(sections.join("\n\n"), `${safeName}_${fmtDate(orderDate)}.csv`);
    onClose();
  };

  // ── Custom download ──
  const handleCustomDownload = () => {
    if (!columns.length || !aggRows.length) return;
    const headers = columns.map((c) => c.label);
    const rows = aggRows.map((r) => columns.map((c) => r[c.key] ?? ""));
    const safeName = `${storeName}_${orderType}`.replace(/[^a-z0-9]/gi, "_");
    downloadCsv(rowsToCsv(headers, rows), `${safeName}_custom_${fmtDate(orderDate)}.csv`);
    onClose();
  };

  const hasSelected = selectedOrderId !== null && selectedOrderItems.length > 0;
  const canCustomDownload = columns.length > 0 && aggRows.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-xl shadow-xl w-full overflow-hidden transition-all duration-200 ${mode === "custom" ? "max-w-2xl" : "max-w-sm"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1e2a4a]">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-white text-[13px] font-semibold">Export CSV</p>
              <p className="text-white/55 text-[10px] mt-0.5">{storeName} — {orderType}</p>
            </div>
            <div className="flex items-center gap-0.5 bg-white/10 rounded-md p-0.5 ml-2">
              {(["presets", "custom"] as ModalMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    mode === m ? "bg-white text-[#1e2a4a]" : "text-white/70 hover:text-white"
                  }`}
                >
                  {m === "presets" ? "Presets" : "Custom"}
                </button>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* ── PRESETS MODE ── */}
        {mode === "presets" && (
          <>
            <div className="px-4 pt-4 pb-2 space-y-3">
              <p className="text-[11px] text-content/50 uppercase tracking-wide font-medium">Select data to include</p>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selected.has("all")}
                  onChange={() => setSelected((p) => { const n = new Set(p); n.has("all") ? n.delete("all") : n.add("all"); return n; })}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#1e2a4a] cursor-pointer flex-shrink-0"
                />
                <div>
                  <p className="text-[13px] font-medium text-content group-hover:text-[#1e2a4a] transition-colors">All Orders</p>
                  <p className="text-[11px] text-content/50 mt-0.5">
                    All {allOrders.length} line items for {storeName} — {orderType} on {fmtDate(orderDate)}
                  </p>
                </div>
              </label>

              <label className={`flex items-start gap-3 ${hasSelected ? "cursor-pointer" : "opacity-40 cursor-not-allowed"} group`}>
                <input
                  type="checkbox"
                  checked={selected.has("selected")}
                  disabled={!hasSelected}
                  onChange={() => setSelected((p) => { const n = new Set(p); n.has("selected") ? n.delete("selected") : n.add("selected"); return n; })}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#1e2a4a] cursor-pointer flex-shrink-0"
                />
                <div>
                  <p className="text-[13px] font-medium text-content group-hover:text-[#1e2a4a] transition-colors">
                    Selected Order {selectedOrderId ? `#${selectedOrderId}` : ""}
                  </p>
                  <p className="text-[11px] text-content/50 mt-0.5">
                    {hasSelected ? `${selectedOrderItems.length} line items for order #${selectedOrderId}` : "Select an order from the list to enable"}
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-2">
              <button onClick={onClose} className="text-[12px] text-content/50 hover:text-content transition-colors">Cancel</button>
              <button
                onClick={handlePresetDownload}
                disabled={selected.size === 0}
                className="flex items-center gap-1.5 bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-40 text-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                Download CSV
              </button>
            </div>
          </>
        )}

        {/* ── CUSTOM MODE ── */}
        {mode === "custom" && (
          <>
            <div className="grid grid-cols-[200px_1fr] divide-x divide-gray-100 min-h-[360px] max-h-[calc(100vh-220px)]">

              {/* Left: config */}
              <div className="overflow-y-auto no-scrollbar p-4 space-y-5">

                {/* Group by */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-content/45 mb-2">Group By</p>
                  <div className="space-y-1.5">
                    {DIMS.map((d) => (
                      <label key={d.key} className="flex items-center gap-2 cursor-pointer">
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

                {/* Metrics */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-content/45 mb-2">Metrics</p>
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
                          <span className={`text-[12px] flex-1 ${sel.enabled ? "text-content" : "text-content/40"}`}>{m.label}</span>
                          <select
                            value={sel.fn}
                            disabled={!sel.enabled}
                            onChange={(e) => setMetricFn(m.key, e.target.value as AggFn)}
                            className="text-[10px] border border-gray-200 rounded px-1 py-0.5 text-content disabled:opacity-30 bg-white outline-none"
                            style={{ minWidth: 52 }}
                          >
                            {AGG_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <p className="text-[10px] text-content/35 italic leading-relaxed">
                  Working on all {allOrders.length} line items for {orderType} on {fmtDate(orderDate)}.
                </p>
              </div>

              {/* Right: preview */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
                  <p className="text-[11px] font-semibold text-content/60 uppercase tracking-wide">Preview</p>
                  <span className="text-[10px] text-content/40">
                    {aggRows.length === 0
                      ? "No data — select at least one group or metric"
                      : `Showing ${Math.min(PREVIEW_ROWS, aggRows.length)} of ${aggRows.length} rows`}
                  </span>
                </div>

                {columns.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center p-6 text-center">
                    <p className="text-[12px] text-content/40 leading-relaxed">
                      Select at least one group-by dimension<br />or metric to see a preview.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto thin-scrollbar">
                    <table className="min-w-full text-[11px] border-collapse">
                      <thead className="sticky top-0 bg-gray-50 z-10">
                        <tr>
                          {columns.map((c) => (
                            <th key={c.key} className="text-left px-3 py-2 text-content/55 font-semibold border-b border-gray-100 whitespace-nowrap">
                              {c.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {aggRows.slice(0, PREVIEW_ROWS).map((row, i) => (
                          <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                            {columns.map((c) => (
                              <td key={c.key} className="px-3 py-1.5 text-content/80 whitespace-nowrap border-b border-gray-50">
                                {row[c.key] ?? "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                        {aggRows.length > PREVIEW_ROWS && (
                          <tr>
                            <td colSpan={columns.length} className="px-3 py-2 text-[10px] text-content/35 italic">
                              + {aggRows.length - PREVIEW_ROWS} more rows in download…
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <button onClick={onClose} className="text-[12px] text-content/50 hover:text-content transition-colors">Cancel</button>
              <button
                onClick={handleCustomDownload}
                disabled={!canCustomDownload}
                className="flex items-center gap-1.5 bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-40 text-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                Download CSV
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrdersExportModal;
