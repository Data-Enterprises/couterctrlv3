import { useState, useMemo } from "react";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import type { TransactionOverview } from "../../../interfaces";
import type { CashierGrade } from "../gradingUtils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LPExportModalProps {
  onClose: () => void;
  storeName: string;
  saleType: string;
  dateRange: string;
  transactions: TransactionOverview[];  // filtered list currently in view
  cashierGrades: CashierGrade[];
}

type ModalMode = "presets" | "custom";
type ExportDataset = "transactions" | "cashiers";
type CustomSource = "transactions" | "cashiers";
type AggFn = "sum" | "avg" | "min" | "max" | "count";

interface DimDef    { key: string; label: string }
interface MetricDef { key: string; label: string }
interface MetricSelection { fn: AggFn; enabled: boolean }

type AggRow = Record<string, string | number | null>;

// ─── Formatting ───────────────────────────────────────────────────────────────

const fmtDate = (iso: string) => {
  const d = iso.split("T")[0].split("-");
  return `${d[1]}/${d[2]}/${d[0]}`;
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

const buildTransactionsCsv = (rows: TransactionOverview[]) => {
  const headers = ["Trans ID", "Date", "Cashier #", "Cashier Name", "Store #", "Sale Type", "Items", "Total Sales"];
  const data = rows.map((o) => [
    o.transaction_id,
    fmtDate(o.sale_date),
    o.cashier_number,
    o.cashier_name,
    o.store_number,
    o.sale_type,
    o.qty,
    fmtNum(o.total_sales),
  ]);
  return rowsToCsv(headers, data);
};

const buildCashiersCsv = (grades: CashierGrade[]) => {
  const headers = ["Cashier #", "Cashier Name", "Store #", "Severity", "Transactions", "Items", "Total Sales", "Avg Ticket"];
  const data = grades.map((g) => [
    g.cashier_number,
    g.cashier_name,
    g.store_number,
    g.severity,
    g.trans.value,
    g.qty.value,
    fmtNum(g.sales.value),
    fmtNum(g.avgTicket.value),
  ]);
  return rowsToCsv(headers, data);
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

const TRANS_DIMS: DimDef[] = [
  { key: "cashier_name",  label: "Cashier Name" },
  { key: "cashier_number", label: "Cashier #" },
  { key: "sale_date",     label: "Date" },
  { key: "sale_type",     label: "Sale Type" },
  { key: "store_number",  label: "Store #" },
];

const TRANS_METRICS: MetricDef[] = [
  { key: "qty",         label: "Items" },
  { key: "total_sales", label: "Total Sales" },
];

const CASHIER_DIMS: DimDef[] = [
  { key: "cashier_name",  label: "Cashier Name" },
  { key: "severity",      label: "Severity" },
  { key: "store_number",  label: "Store #" },
];

const CASHIER_METRICS: MetricDef[] = [
  { key: "trans_value",      label: "Transactions" },
  { key: "qty_value",        label: "Items" },
  { key: "sales_value",      label: "Total Sales" },
  { key: "avgTicket_value",  label: "Avg Ticket" },
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

const LPExportModal = ({
  onClose,
  storeName,
  saleType,
  dateRange,
  transactions,
  cashierGrades,
}: LPExportModalProps) => {

  // ── Preset state ──
  const [mode, setMode] = useState<ModalMode>("presets");
  const [selected, setSelected] = useState<Set<ExportDataset>>(new Set(["transactions", "cashiers"]));

  // ── Custom builder state ──
  const [source, setSource] = useState<CustomSource>("transactions");
  const [groupBy, setGroupBy] = useState<Set<string>>(new Set(["cashier_name", "sale_date"]));
  const [metrics, setMetrics] = useState<Map<string, MetricSelection>>(
    new Map([
      ["qty",         { fn: "sum", enabled: true }],
      ["total_sales", { fn: "sum", enabled: true }],
    ])
  );

  const dims  = source === "transactions" ? TRANS_DIMS  : CASHIER_DIMS;
  const mDefs = source === "transactions" ? TRANS_METRICS : CASHIER_METRICS;

  const switchSource = (s: CustomSource) => {
    setSource(s);
    if (s === "transactions") {
      setGroupBy(new Set(["cashier_name", "sale_date"]));
      setMetrics(new Map([
        ["qty",         { fn: "sum", enabled: true }],
        ["total_sales", { fn: "sum", enabled: true }],
      ]));
    } else {
      setGroupBy(new Set(["cashier_name", "severity"]));
      setMetrics(new Map([
        ["trans_value",     { fn: "sum", enabled: true }],
        ["qty_value",       { fn: "sum", enabled: false }],
        ["sales_value",     { fn: "sum", enabled: true }],
        ["avgTicket_value", { fn: "avg", enabled: false }],
      ]));
    }
  };

  const toggleGroupBy = (key: string) =>
    setGroupBy((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const toggleMetric = (key: string) =>
    setMetrics((prev) => { const n = new Map(prev); const c = n.get(key)!; n.set(key, { ...c, enabled: !c.enabled }); return n; });

  const setMetricFn = (key: string, fn: AggFn) =>
    setMetrics((prev) => { const n = new Map(prev); const c = n.get(key)!; n.set(key, { ...c, fn }); return n; });

  // ── Flat rows ──
  const flatRows = useMemo<AggRow[]>(() => {
    if (source === "transactions") {
      return transactions.map((o) => ({
        transaction_id: o.transaction_id,
        cashier_name:   o.cashier_name,
        cashier_number: o.cashier_number,
        sale_date:      o.sale_date.split("T")[0],
        sale_type:      o.sale_type,
        store_number:   o.store_number,
        qty:            o.qty,
        total_sales:    o.total_sales,
      }));
    }
    // Flatten CashierGrade nested metrics into flat row
    return cashierGrades.map((g) => ({
      cashier_name:    g.cashier_name,
      cashier_number:  g.cashier_number,
      store_number:    g.store_number,
      severity:        g.severity,
      trans_value:     g.trans.value,
      qty_value:       g.qty.value,
      sales_value:     g.sales.value,
      avgTicket_value: g.avgTicket.value,
    }));
  }, [source, transactions, cashierGrades]);

  // ── Aggregated result ──
  const { aggRows, columns } = useMemo(() => {
    const activeDims = dims.filter((d) => groupBy.has(d.key));
    const activeMetrics = mDefs
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
      for (const d of activeDims) {
        const raw = row[d.key];
        out[d.key] = d.key === "sale_date" ? fmtDate(String(raw)) : String(raw ?? "");
      }
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
  }, [flatRows, groupBy, metrics, dims, mDefs]);

  // ── Preset download ──
  const handlePresetDownload = () => {
    const sections: string[] = [];
    if (selected.has("transactions")) sections.push(`Transaction List\n${buildTransactionsCsv(transactions)}`);
    if (selected.has("cashiers"))     sections.push(`Cashier Summary\n${buildCashiersCsv(cashierGrades)}`);
    if (!sections.length) return;
    const safeName = `${storeName}_${saleType}`.replace(/[^a-z0-9]/gi, "_");
    downloadCsv(sections.join("\n\n"), `${safeName}_${dateRange}.csv`);
    onClose();
  };

  // ── Custom download ──
  const handleCustomDownload = () => {
    if (!columns.length || !aggRows.length) return;
    const headers = columns.map((c) => c.label);
    const rows = aggRows.map((r) => columns.map((c) => r[c.key] ?? ""));
    const safeName = `${storeName}_${saleType}`.replace(/[^a-z0-9]/gi, "_");
    downloadCsv(rowsToCsv(headers, rows), `${safeName}_custom_${dateRange}.csv`);
    onClose();
  };

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
              <p className="text-white/55 text-[10px] mt-0.5">{storeName} — {saleType}</p>
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

              {([
                { id: "transactions" as ExportDataset, label: "Transaction List",  description: `${transactions.length} transactions currently in view (filters applied)` },
                { id: "cashiers"     as ExportDataset, label: "Cashier Summary",   description: `${cashierGrades.length} cashiers with severity, totals, and avg ticket` },
              ]).map(({ id, label, description }) => (
                <label key={id} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selected.has(id)}
                    onChange={() => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; })}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#1e2a4a] cursor-pointer flex-shrink-0"
                  />
                  <div>
                    <p className="text-[13px] font-medium text-content group-hover:text-[#1e2a4a] transition-colors">{label}</p>
                    <p className="text-[11px] text-content/50 mt-0.5">{description}</p>
                  </div>
                </label>
              ))}
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

                {/* Source */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-content/45 mb-2">Data Source</p>
                  <div className="flex flex-col gap-1.5">
                    {(["transactions", "cashiers"] as CustomSource[]).map((s) => (
                      <label key={s} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={source === s}
                          onChange={() => switchSource(s)}
                          className="accent-[#1e2a4a] h-3.5 w-3.5"
                        />
                        <span className="text-[12px] text-content capitalize">{s === "transactions" ? "Transaction List" : "Cashier Summary"}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Group by */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-content/45 mb-2">Group By</p>
                  <div className="space-y-1.5">
                    {dims.map((d) => (
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
                    {mDefs.map((m) => {
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

export default LPExportModal;
