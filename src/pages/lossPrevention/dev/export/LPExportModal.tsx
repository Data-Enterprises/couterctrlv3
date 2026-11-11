// Hooks
import { useState, useMemo } from "react";

// Utils
import {
  fmtNum,
  rowsToCsv,
  downloadCsv,
  aggregateRows,
  type AggFn,
  type AggRow,
} from "../../../../utils/csvExport";
import {
  AGG_OPTIONS,
  buildCashiersCsv,
  buildTransactionsCsv,
  CASHIER_DIMS,
  CASHIER_METRICS,
  fmtDate,
  PREVIEW_ROWS,
  TRANS_DIMS,
  TRANS_METRICS,
} from "./utils";

// Interfaces
import type { TransactionOverview } from "../../../../interfaces";
import type { CashierGrade, CashierSeverity } from "../interfaces";
import type {
  CustomSource,
  ExportDataset,
  MetricSelection,
  ModalMode,
} from "./interfaces";

// Components
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import ResizableModalShell from "../../../../components-dev/modals/ResizableModalShell";

interface LPExportModalProps {
  onClose: () => void;
  storeName: string;
  saleType: string;
  dateRange: string;
  transactions: TransactionOverview[];  // filtered list currently in view
  cashierGrades: CashierGrade[];
}

/** The Loss Prevention export pop-up: Presets (the transaction list, and a cashier summary
 *  by severity) or Custom (group by and metrics over transactions or cashiers, with a
 *  preview), downloaded as one CSV. */
const LPExportModal = ({
  onClose,
  storeName,
  saleType,
  dateRange,
  transactions,
  cashierGrades,
}: LPExportModalProps) => {

  // ── Preset state — no default selections ──
  const [mode, setMode] = useState<ModalMode>("presets");
  const [selected, setSelected] = useState<Set<ExportDataset>>(new Set());
  const [cashierSevs, setCashierSevs] = useState<Set<CashierSeverity>>(new Set());

  // Selecting a severity chip activates the "Cashier Summary" preset (and
  // clearing them all back out deactivates it), so the two stay in sync.
  const toggleCashierSev = (sev: CashierSeverity) => {
    const next = new Set(cashierSevs);
    next.has(sev) ? next.delete(sev) : next.add(sev);
    setCashierSevs(next);
    setSelected((prev) => {
      const n = new Set(prev);
      if (next.size > 0) n.add("cashiers"); else n.delete("cashiers");
      return n;
    });
  };

  // ── Custom builder state — no default selections ──
  const [source, setSource] = useState<CustomSource>("transactions");
  const [groupBy, setGroupBy] = useState<Set<string>>(new Set());
  const [metrics, setMetrics] = useState<Map<string, MetricSelection>>(
    new Map([
      ["qty",         { fn: "sum", enabled: false }],
      ["total_sales", { fn: "sum", enabled: false }],
    ])
  );

  const dims  = source === "transactions" ? TRANS_DIMS  : CASHIER_DIMS;
  const mDefs = source === "transactions" ? TRANS_METRICS : CASHIER_METRICS;

  const switchSource = (s: CustomSource) => {
    setSource(s);
    setGroupBy(new Set());
    if (s === "transactions") {
      setMetrics(new Map([
        ["qty",         { fn: "sum", enabled: false }],
        ["total_sales", { fn: "sum", enabled: false }],
      ]));
    } else {
      setMetrics(new Map([
        ["trans_value",     { fn: "sum", enabled: false }],
        ["qty_value",       { fn: "sum", enabled: false }],
        ["sales_value",     { fn: "sum", enabled: false }],
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
    if (selected.has("cashiers") && cashierSevs.size > 0) {
      sections.push(`Cashier Summary\n${buildCashiersCsv(cashierGrades, cashierSevs)}`);
    }
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
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:lp:v2"
      defaultWidth={1140}
      defaultHeight={960}
    >
        {/* Header */}
        <div className="cc-phone-header">
          <div>
            <p className="cc-navy-title text-[13px]">Export CSV</p>
            <p className="text-custom-white/95 text-[10px] mt-0.5">{storeName} — {saleType}</p>
          </div>
          <div className="cc-segment-navy">
            {(["presets", "custom"] as ModalMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`cc-chip-btn text-[11px] ${
                  mode === m ? "bg-custom-white text-brand_navy" : "text-custom-white/95 hover:text-custom-white"
                }`}
              >
                {m === "presets" ? "Presets" : "Custom"}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="cc-navy-link justify-self-end">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* ── PRESETS MODE ── */}
        {mode === "presets" && (
          <>
            <div className="px-4 pt-4 pb-2 space-y-3">
              <p className="text-[11px] text-content/95 uppercase tracking-wide font-medium">Select data to include</p>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selected.has("transactions")}
                  onChange={() => setSelected((p) => { const n = new Set(p); n.has("transactions") ? n.delete("transactions") : n.add("transactions"); return n; })}
                  className="mt-0.5 cc-checkbox border-line_strong cursor-pointer flex-shrink-0"
                />
                <div>
                  <p className="text-[13px] cc-row-title">Transaction List</p>
                  <p className="text-[11px] text-content/95 mt-0.5">{transactions.length} transactions currently in view (filters applied)</p>
                </div>
              </label>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.has("cashiers")}
                  onChange={() => {
                    const checking = !selected.has("cashiers");
                    if (checking) {
                      if (cashierSevs.size === 0) setCashierSevs(new Set(["critical", "watch", "ok", "ungraded"]));
                    } else {
                      setCashierSevs(new Set());
                    }
                    setSelected((p) => { const n = new Set(p); checking ? n.add("cashiers") : n.delete("cashiers"); return n; });
                  }}
                  className="mt-0.5 cc-checkbox border-line_strong cursor-pointer flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-content">Cashier Summary</p>
                  <p className="text-[11px] text-content/95 mt-0.5 mb-1.5">{cashierGrades.length} cashiers with severity, totals, and avg ticket</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {(
                      [
                        { sev: "critical" as CashierSeverity, label: "Critical", activeClass: "bg-red-600 border-red-600 text-custom-white" },
                        { sev: "watch"    as CashierSeverity, label: "Watch",    activeClass: "bg-amber-500 border-amber-500 text-custom-white" },
                        { sev: "ok"       as CashierSeverity, label: "OK",       activeClass: "bg-emerald-600 border-emerald-600 text-custom-white" },
                        { sev: "ungraded" as CashierSeverity, label: "Ungraded", activeClass: "bg-gray-400 border-gray-400 text-custom-white" },
                      ]
                    ).map(({ sev, label, activeClass }) => (
                      <button
                        key={sev}
                        onClick={() => toggleCashierSev(sev)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                          cashierSevs.has(sev) ? activeClass : "bg-custom-white border-line_field text-content/95"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="cc-bar-footer mt-2">
              <button onClick={onClose} className="text-[12px] cc-muted-link">Cancel</button>
              <button
                onClick={handlePresetDownload}
                disabled={selected.size === 0}
                className="flex items-center gap-1.5 cc-btn-primary hover:bg-brand_navy/85 text-[12px]"
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
            <div className="grid grid-cols-[200px_1fr] divide-x divide-line_hair min-h-[360px] max-h-[calc(100vh-220px)]">

              {/* Left: config */}
              <div className="overflow-y-auto no-scrollbar p-4 space-y-5">

                {/* Source */}
                <div>
                  <p className="text-[10px] cc-caps mb-2">Data Source</p>
                  <div className="flex flex-col gap-1.5">
                    {(["transactions", "cashiers"] as CustomSource[]).map((s) => (
                      <label key={s} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={source === s}
                          onChange={() => switchSource(s)}
                          className="accent-brand_navy h-3.5 w-3.5"
                        />
                        <span className="text-[12px] text-content capitalize">{s === "transactions" ? "Transaction List" : "Cashier Summary"}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Group by */}
                <div>
                  <p className="text-[10px] cc-caps mb-2">Group By</p>
                  <div className="space-y-1.5">
                    {dims.map((d) => (
                      <label key={d.key} className="flex items-center gap-2 cursor-pointer">
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

                {/* Metrics */}
                <div>
                  <p className="text-[10px] cc-caps mb-2">Metrics</p>
                  <div className="space-y-2">
                    {mDefs.map((m) => {
                      const sel = metrics.get(m.key)!;
                      return (
                        <div key={m.key} className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={sel.enabled}
                            onChange={() => toggleMetric(m.key)}
                            className="cc-checkbox flex-shrink-0"
                          />
                          <span className={`text-[12px] flex-1 ${sel.enabled ? "text-content" : "text-content/95"}`}>{m.label}</span>
                          <select
                            value={sel.fn}
                            disabled={!sel.enabled}
                            onChange={(e) => setMetricFn(m.key, e.target.value as AggFn)}
                            className="text-[10px] cc-field-sm disabled:opacity-30"
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
                <div className="cc-bar-header flex-shrink-0">
                  <p className="text-[11px] cc-caps">Preview</p>
                  <span className="text-[10px] text-content/95">
                    {aggRows.length === 0
                      ? "No data — select at least one group or metric"
                      : `Showing ${Math.min(PREVIEW_ROWS, aggRows.length)} of ${aggRows.length} rows`}
                  </span>
                </div>

                {columns.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center p-6 text-center">
                    <p className="text-[12px] text-content/95 leading-relaxed">
                      Select at least one group-by dimension<br />or metric to see a preview.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto thin-scrollbar">
                    <table className="min-w-full text-[11px] border-collapse">
                      <thead className="sticky top-0 bg-fill_soft z-10">
                        <tr>
                          {columns.map((c) => (
                            <th key={c.key} className="cc-th text-content/95">
                              {c.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {aggRows.slice(0, PREVIEW_ROWS).map((row, i) => (
                          <tr key={i} className={i % 2 === 0 ? "bg-custom-white" : "bg-fill_soft/50"}>
                            {columns.map((c) => (
                              <td key={c.key} className="px-3 py-1.5 text-content/95 whitespace-nowrap border-b border-line_faint">
                                {row[c.key] ?? "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                        {aggRows.length > PREVIEW_ROWS && (
                          <tr>
                            <td colSpan={columns.length} className="px-3 py-2 text-[10px] text-content/95 italic">
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

            <div className="cc-bar-footer">
              <button onClick={onClose} className="text-[12px] cc-muted-link">Cancel</button>
              <button
                onClick={handleCustomDownload}
                disabled={!canCustomDownload}
                className="flex items-center gap-1.5 cc-btn-primary hover:bg-brand_navy/85 text-[12px]"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                Download CSV
              </button>
            </div>
          </>
        )}
    </ResizableModalShell>
  );
};

export default LPExportModal;
