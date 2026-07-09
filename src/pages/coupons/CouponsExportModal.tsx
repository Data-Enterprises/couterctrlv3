import { useState, useMemo } from "react";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import type { CouponItem } from "../../interfaces";

interface CouponsExportModalProps {
  onClose: () => void;
  title: string;
  subtitle: string;
  rows: CouponItem[];
}

type ModalMode = "presets" | "custom";
type AggFn = "sum" | "avg" | "min" | "max" | "count";

interface MetricSelection { fn: AggFn; enabled: boolean }
type AggRow = Record<string, string | number | null>;

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
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const buildPresetCsv = (rows: CouponItem[], label: string) => {
  const headers = ["Store #", "Store", "Date", "Trans", "Cpn Type", "Cpn Amt", "UPC", "Description", "Cashier #", "Cashier", "Customer ID", "Sub Dept"];
  const data = rows.map((r) => [
    r.store_number,
    r.store_name,
    r.sale_date.split("T")[0],
    r.sale_id,
    r.coupon_type,
    fmtNum(r.coupon_amount),
    r.product_code ? String(Math.round(Number(r.product_code))) : "",
    r.product_description,
    r.cashier_number,
    r.cashier_name,
    r.customer_id,
    r.sub_department_description,
  ]);
  return `${label}\n${rowsToCsv(headers, data)}`;
};

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
    for (const { key, fn } of metrics)
      result[`${fn}__${key}`] = applyAgg(group.map((r) => Number(r[key]) || 0), fn);
    return result;
  });
}

const DIMS = [
  { key: "store_name",                 label: "Store" },
  { key: "sub_department_description", label: "Sub Dept" },
  { key: "coupon_type",                label: "Cpn Type" },
  { key: "cashier_name",               label: "Cashier" },
  { key: "product_description",        label: "Description" },
  { key: "customer_id",                label: "Customer ID" },
];

const METRICS = [
  { key: "coupon_amount", label: "Cpn Amt" },
  { key: "qty",           label: "Qty" },
];

const AGG_OPTIONS: { value: AggFn; label: string }[] = [
  { value: "sum", label: "Sum" }, { value: "avg", label: "Avg" },
  { value: "min", label: "Min" }, { value: "max", label: "Max" },
  { value: "count", label: "Count" },
];

const PREVIEW_ROWS = 5;

const CouponsExportModal = ({ onClose, title, subtitle, rows }: CouponsExportModalProps) => {
  const [mode, setMode] = useState<ModalMode>("presets");

  const [groupBy, setGroupBy] = useState<Set<string>>(new Set(["sub_department_description"]));
  const [metrics, setMetrics] = useState<Map<string, MetricSelection>>(new Map([
    ["coupon_amount", { fn: "sum", enabled: true }],
    ["qty",           { fn: "sum", enabled: false }],
  ]));

  // Unique stores derived from rows
  const uniqueStores = useMemo(() => {
    const map = new Map<string, { name: string; number: string }>();
    rows.forEach((r) => {
      if (!map.has(r.store_number)) map.set(r.store_number, { name: r.store_name ?? r.store_number, number: r.store_number });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const isMultiStore = uniqueStores.length > 1;

  // Selected stores (default = all)
  const [selectedStores, setSelectedStores] = useState<Set<string>>(() => new Set(rows.map((r) => r.store_number)));

  const toggleStore = (num: string) =>
    setSelectedStores((prev) => { const n = new Set(prev); n.has(num) ? n.delete(num) : n.add(num); return n; });

  const allSelected = selectedStores.size === uniqueStores.length;
  const noneSelected = selectedStores.size === 0;

  // Rows filtered by selected stores
  const filteredRows = useMemo(
    () => isMultiStore ? rows.filter((r) => selectedStores.has(r.store_number)) : rows,
    [rows, selectedStores, isMultiStore],
  );

  const toggleGroupBy = (key: string) =>
    setGroupBy((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const toggleMetric = (key: string) =>
    setMetrics((prev) => { const n = new Map(prev); const c = n.get(key)!; n.set(key, { ...c, enabled: !c.enabled }); return n; });

  const setMetricFn = (key: string, fn: AggFn) =>
    setMetrics((prev) => { const n = new Map(prev); const c = n.get(key)!; n.set(key, { ...c, fn }); return n; });

  const flatRows = useMemo<AggRow[]>(() => filteredRows.map((r) => ({ ...r } as unknown as AggRow)), [filteredRows]);

  const { aggRows, columns } = useMemo(() => {
    const activeDims = DIMS.filter((d) => groupBy.has(d.key));
    const activeMetrics = METRICS
      .map((m) => ({ ...m, sel: metrics.get(m.key) }))
      .filter((m) => m.sel?.enabled)
      .map((m) => ({ key: m.key, fn: m.sel!.fn, label: m.label }));

    const agg = aggregateRows(flatRows, activeDims.map((d) => d.key), activeMetrics.map((m) => ({ key: m.key, fn: m.fn })));

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
      ...activeMetrics.map((m) => ({ key: `${m.fn}__${m.key}`, label: `${m.fn.charAt(0).toUpperCase() + m.fn.slice(1)} ${m.label}` })),
    ];

    return { aggRows: display, columns: cols };
  }, [flatRows, groupBy, metrics]);

  const handlePresetDownload = () => {
    const label = `${title} — ${subtitle}`;
    const safeName = title.replace(/[^a-z0-9]/gi, "_");
    downloadCsv(buildPresetCsv(filteredRows, label), `${safeName}.csv`);
    onClose();
  };

  const handleCustomDownload = () => {
    if (!columns.length || !aggRows.length) return;
    const headers = columns.map((c) => c.label);
    const data = aggRows.map((r) => columns.map((c) => r[c.key] ?? ""));
    const safeName = title.replace(/[^a-z0-9]/gi, "_");
    downloadCsv(rowsToCsv(headers, data), `${safeName}_custom.csv`);
    onClose();
  };

  const StoreFilter = () => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-content/45">Stores</p>
        <div className="flex gap-1.5">
          <button onClick={() => setSelectedStores(new Set(uniqueStores.map((s) => s.number)))} disabled={allSelected} className="text-[9px] text-[#1e2a4a]/50 hover:text-[#1e2a4a] disabled:opacity-30 transition-colors">All</button>
          <span className="text-[9px] text-content/30">·</span>
          <button onClick={() => setSelectedStores(new Set())} disabled={noneSelected} className="text-[9px] text-[#1e2a4a]/50 hover:text-[#1e2a4a] disabled:opacity-30 transition-colors">None</button>
        </div>
      </div>
      <div className="space-y-1.5 max-h-36 overflow-y-auto thin-scrollbar pr-1">
        {uniqueStores.map((s) => (
          <label key={s.number} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={selectedStores.has(s.number)} onChange={() => toggleStore(s.number)} className="accent-[#1e2a4a] h-3.5 w-3.5 rounded flex-shrink-0" />
            <span className="text-[12px] text-content truncate">{s.name}</span>
            <span className="text-[10px] text-content/40 flex-shrink-0">#{s.number}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-xl shadow-xl w-full overflow-hidden transition-all duration-200 ${mode === "custom" ? "max-w-2xl" : "max-w-lg"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-[#1e2a4a]">
          <div>
            <p className="text-white text-[13px] font-semibold">Export CSV</p>
            <p className="text-white/55 text-[10px] mt-0.5">{subtitle}</p>
          </div>
          <div className="flex items-center gap-0.5 bg-white/10 rounded-md p-0.5">
            {(["presets", "custom"] as ModalMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${mode === m ? "bg-white text-[#1e2a4a]" : "text-white/70 hover:text-white"}`}
              >
                {m === "presets" ? "Presets" : "Custom"}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors justify-self-end">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* PRESETS */}
        {mode === "presets" && (
          <>
            <div className="px-4 pt-4 pb-2 space-y-4">
              {isMultiStore && <StoreFilter />}
              <div>
                {!isMultiStore && <p className="text-[11px] text-content/50 uppercase tracking-wide font-medium mb-3">Select data to include</p>}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" checked readOnly className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#1e2a4a] flex-shrink-0" />
                  <div>
                    <p className="text-[13px] font-medium text-content group-hover:text-[#1e2a4a] transition-colors">Coupon Records</p>
                    <p className="text-[11px] text-content/50 mt-0.5">
                      {filteredRows.length} rows
                      {isMultiStore && selectedStores.size < uniqueStores.length ? ` · ${selectedStores.size} of ${uniqueStores.length} stores` : ""}
                      {" · "}{title}
                    </p>
                  </div>
                </label>
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-2">
              <button onClick={onClose} className="text-[12px] text-content/50 hover:text-content transition-colors">Cancel</button>
              <button
                onClick={handlePresetDownload}
                disabled={filteredRows.length === 0}
                className="flex items-center gap-1.5 bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-40 text-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                Download CSV
              </button>
            </div>
          </>
        )}

        {/* CUSTOM */}
        {mode === "custom" && (
          <>
            <div className="grid grid-cols-[220px_1fr] divide-x divide-gray-100 min-h-[360px] max-h-[calc(100vh-220px)]">
              {/* Config */}
              <div className="overflow-y-auto no-scrollbar p-4 space-y-5">
                {isMultiStore && <StoreFilter />}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-content/45 mb-2">Group By</p>
                  <div className="space-y-1.5">
                    {DIMS.map((d) => (
                      <label key={d.key} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={groupBy.has(d.key)} onChange={() => toggleGroupBy(d.key)} className="accent-[#1e2a4a] h-3.5 w-3.5 rounded flex-shrink-0" />
                        <span className="text-[12px] text-content">{d.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-content/45 mb-2">Metrics</p>
                  <div className="space-y-2">
                    {METRICS.map((m) => {
                      const sel = metrics.get(m.key)!;
                      return (
                        <div key={m.key} className="flex items-center gap-1.5">
                          <input type="checkbox" checked={sel.enabled} onChange={() => toggleMetric(m.key)} className="accent-[#1e2a4a] h-3.5 w-3.5 rounded flex-shrink-0" />
                          <span className={`text-[12px] flex-1 ${sel.enabled ? "text-content" : "text-content/40"}`}>{m.label}</span>
                          <select value={sel.fn} disabled={!sel.enabled} onChange={(e) => setMetricFn(m.key, e.target.value as AggFn)}
                            className="text-[10px] border border-gray-200 rounded px-1 py-0.5 text-content disabled:opacity-30 bg-white outline-none" style={{ minWidth: 52 }}>
                            {AGG_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <p className="text-[10px] text-content/35 italic leading-relaxed">
                  {filteredRows.length} rows
                  {isMultiStore && selectedStores.size < uniqueStores.length ? ` · ${selectedStores.size}/${uniqueStores.length} stores` : ""}
                </p>
              </div>

              {/* Preview */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
                  <p className="text-[11px] font-semibold text-content/60 uppercase tracking-wide">Preview</p>
                  <span className="text-[10px] text-content/40">
                    {aggRows.length === 0 ? "No data" : `Showing ${Math.min(PREVIEW_ROWS, aggRows.length)} of ${aggRows.length} rows`}
                  </span>
                </div>
                {columns.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center p-6 text-center">
                    <p className="text-[12px] text-content/40 leading-relaxed">Select at least one group-by<br />or metric to see a preview.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto thin-scrollbar">
                    <table className="min-w-full text-[11px] border-collapse">
                      <thead className="sticky top-0 bg-gray-50 z-10">
                        <tr>
                          {columns.map((c) => (
                            <th key={c.key} className="text-left px-3 py-2 text-content/55 font-semibold border-b border-gray-100 whitespace-nowrap">{c.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {aggRows.slice(0, PREVIEW_ROWS).map((row, i) => (
                          <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                            {columns.map((c) => (
                              <td key={c.key} className="px-3 py-1.5 text-content/80 whitespace-nowrap border-b border-gray-50">{row[c.key] ?? "—"}</td>
                            ))}
                          </tr>
                        ))}
                        {aggRows.length > PREVIEW_ROWS && (
                          <tr><td colSpan={columns.length} className="px-3 py-2 text-[10px] text-content/35 italic">+ {aggRows.length - PREVIEW_ROWS} more rows…</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <button onClick={onClose} className="text-[12px] text-content/50 hover:text-content transition-colors">Cancel</button>
              <button onClick={handleCustomDownload} disabled={!columns.length || !aggRows.length}
                className="flex items-center gap-1.5 bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-40 text-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors">
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

export default CouponsExportModal;
