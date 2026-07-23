import { useState, useMemo } from "react";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import type {
  ReceiverDetailsItem,
  ReceiverDetailsTotals,
} from "../../interfaces";
import {
  fmtNum,
  rowsToCsv,
  downloadCsv,
  aggregateRows,
} from "../../utils/csvExport";
import type { AggFn, AggRow } from "../../utils/csvExport";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReceiversExportModalProps {
  onClose: () => void;
  vendorName: string;
  invoiceId: number;
  referenceNumber: string;
  details: ReceiverDetailsItem[];
  totals: ReceiverDetailsTotals | null;
}

type ModalMode = "presets" | "custom";

interface DimDef {
  key: string;
  label: string;
}
interface MetricDef {
  key: string;
  label: string;
}
interface MetricSelection {
  fn: AggFn;
  enabled: boolean;
}

// ─── Preset builder ───────────────────────────────────────────────────────────

const buildDetailsCsv = (
  details: ReceiverDetailsItem[],
  label: string,
  totals: ReceiverDetailsTotals | null,
) => {
  const headers = [
    "Line #",
    "UPC",
    "Description",
    "Cases",
    "Units",
    "U Cost",
    "Ext Cost",
    "Retail",
    "Ext Retail",
    "GM",
    "Free",
    "Return",
  ];
  const rows = details.map((d) => [
    d.line_number,
    d.product_code,
    d.product_description,
    d.cases,
    d.units,
    fmtNum(d.ucost),
    fmtNum(d.ext_cost),
    fmtNum(d.retail),
    fmtNum(d.ext_retail),
    fmtNum(d.gm),
    d.free,
    d.return,
  ]);
  if (totals) {
    rows.push([]);
    rows.push([
      "",
      "",
      "TOTALS",
      totals.cases,
      totals.units,
      fmtNum(totals.ucost),
      fmtNum(totals.ext_cost),
      fmtNum(totals.retail),
      fmtNum(totals.ext_retail),
      "",
      "",
      "",
    ]);
  }
  return `${label}\n${rowsToCsv(headers, rows)}`;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const DIMS: DimDef[] = [
  { key: "product_code", label: "UPC" },
  { key: "product_description", label: "Description" },
];

const METRICS: MetricDef[] = [
  { key: "cases", label: "Cases" },
  { key: "units", label: "Units" },
  { key: "ucost", label: "U Cost" },
  { key: "ext_cost", label: "Ext Cost" },
  { key: "retail", label: "Retail" },
  { key: "ext_retail", label: "Ext Retail" },
  { key: "gm", label: "GM" },
];

const AGG_OPTIONS: { value: AggFn; label: string }[] = [
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Avg" },
  { value: "min", label: "Min" },
  { value: "max", label: "Max" },
  { value: "count", label: "Count" },
];

const PREVIEW_ROWS = 5;

// ─── Component ────────────────────────────────────────────────────────────────

const ReceiversExportModal = ({
  onClose,
  vendorName,
  invoiceId,
  referenceNumber,
  details,
  totals,
}: ReceiversExportModalProps) => {
  const [mode, setMode] = useState<ModalMode>("presets");

  // Custom builder state — no default selections
  const [groupBy, setGroupBy] = useState<Set<string>>(new Set());
  const [metrics, setMetrics] = useState<Map<string, MetricSelection>>(
    new Map([
      ["cases", { fn: "sum", enabled: false }],
      ["units", { fn: "sum", enabled: false }],
      ["ucost", { fn: "avg", enabled: false }],
      ["ext_cost", { fn: "sum", enabled: false }],
      ["retail", { fn: "avg", enabled: false }],
      ["ext_retail", { fn: "sum", enabled: false }],
      ["gm", { fn: "avg", enabled: false }],
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

  const flatRows = useMemo<AggRow[]>(
    () => details.map((d) => ({ ...d }) as unknown as AggRow),
    [details],
  );

  const { aggRows, columns } = useMemo(() => {
    const activeDims = DIMS.filter((d) => groupBy.has(d.key));
    const activeMetrics = METRICS.map((m) => ({
      ...m,
      sel: metrics.get(m.key),
    }))
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

  const handlePresetDownload = () => {
    const label = `${vendorName} — Invoice ${invoiceId} (Ref #${referenceNumber})`;
    const safeName = vendorName.replace(/[^a-z0-9]/gi, "_");
    downloadCsv(
      buildDetailsCsv(details, label, totals),
      `${safeName}_${invoiceId}.csv`,
    );
    onClose();
  };

  const handleCustomDownload = () => {
    if (!columns.length || !aggRows.length) return;
    const headers = columns.map((c) => c.label);
    const rows = aggRows.map((r) => columns.map((c) => r[c.key] ?? ""));
    const safeName = vendorName.replace(/[^a-z0-9]/gi, "_");
    downloadCsv(
      rowsToCsv(headers, rows),
      `${safeName}_${invoiceId}_custom.csv`,
    );
    onClose();
  };

  const canCustomDownload = columns.length > 0 && aggRows.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-custom-white rounded-xl shadow-xl w-full overflow-hidden transition-all duration-200 ${mode === "custom" ? "max-w-2xl" : "max-w-lg"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-[#1e2a4a]">
          <div>
            <p className="text-custom-white text-[13px] font-semibold">
              Export CSV
            </p>
            <p className="text-custom-white/55 text-[10px] mt-0.5">
              {vendorName} — Ref #{referenceNumber}
            </p>
          </div>
          <div className="flex items-center gap-0.5 bg-custom-white/10 rounded-md p-0.5">
            {(["presets", "custom"] as ModalMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  mode === m
                    ? "bg-custom-white text-[#1e2a4a]"
                    : "text-custom-white/70 hover:text-custom-white"
                }`}
              >
                {m === "presets" ? "Presets" : "Custom"}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="text-custom-white/60 hover:text-custom-white transition-colors justify-self-end"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* ── PRESETS MODE ── */}
        {mode === "presets" && (
          <>
            <div className="px-4 pt-4 pb-2 space-y-3">
              <p className="text-[11px] text-content/50 uppercase tracking-wide font-medium">
                Select data to include
              </p>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked
                  readOnly
                  className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#1e2a4a] cursor-pointer flex-shrink-0"
                />
                <div>
                  <p className="text-[13px] font-medium text-content group-hover:text-[#1e2a4a] transition-colors">
                    Line Items
                  </p>
                  <p className="text-[11px] text-content/50 mt-0.5">
                    {details.length} line items for {vendorName} — Invoice{" "}
                    {invoiceId}
                    {totals &&
                      ` · Cases ${totals.cases} · Units ${totals.units}`}
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-2">
              <button
                onClick={onClose}
                className="text-[12px] text-content/50 hover:text-content transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePresetDownload}
                disabled={details.length === 0}
                className="flex items-center gap-1.5 bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
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
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-content/45 mb-2">
                    Group By
                  </p>
                  <div className="space-y-1.5">
                    {DIMS.map((d) => (
                      <label
                        key={d.key}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={groupBy.has(d.key)}
                          onChange={() => toggleGroupBy(d.key)}
                          className="accent-[#1e2a4a] h-3.5 w-3.5 rounded flex-shrink-0"
                        />
                        <span className="text-[12px] text-content">
                          {d.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-content/45 mb-2">
                    Metrics
                  </p>
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
                          <span
                            className={`text-[12px] flex-1 ${sel.enabled ? "text-content" : "text-content/40"}`}
                          >
                            {m.label}
                          </span>
                          <select
                            value={sel.fn}
                            disabled={!sel.enabled}
                            onChange={(e) =>
                              setMetricFn(m.key, e.target.value as AggFn)
                            }
                            className="text-[10px] border border-gray-200 rounded px-1 py-0.5 text-content disabled:opacity-30 bg-custom-white outline-none"
                            style={{ minWidth: 52 }}
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

                <p className="text-[10px] text-content/35 italic leading-relaxed">
                  Working on {details.length} line items for {vendorName}{" "}
                  Invoice {invoiceId}.
                </p>
              </div>

              {/* Right: preview */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
                  <p className="text-[11px] font-semibold text-content/60 uppercase tracking-wide">
                    Preview
                  </p>
                  <span className="text-[10px] text-content/40">
                    {aggRows.length === 0
                      ? "No data — select at least one group or metric"
                      : `Showing ${Math.min(PREVIEW_ROWS, aggRows.length)} of ${aggRows.length} rows`}
                  </span>
                </div>

                {columns.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center p-6 text-center">
                    <p className="text-[12px] text-content/40 leading-relaxed">
                      Select at least one group-by dimension
                      <br />
                      or metric to see a preview.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto thin-scrollbar">
                    <table className="min-w-full text-[11px] border-collapse">
                      <thead className="sticky top-0 bg-gray-50 z-10">
                        <tr>
                          {columns.map((c) => (
                            <th
                              key={c.key}
                              className="text-left px-3 py-2 text-content/55 font-semibold border-b border-gray-100 whitespace-nowrap"
                            >
                              {c.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {aggRows.slice(0, PREVIEW_ROWS).map((row, i) => (
                          <tr
                            key={i}
                            className={
                              i % 2 === 0 ? "bg-custom-white" : "bg-gray-50/50"
                            }
                          >
                            {columns.map((c) => (
                              <td
                                key={c.key}
                                className="px-3 py-1.5 text-content/80 whitespace-nowrap border-b border-gray-50"
                              >
                                {row[c.key] ?? "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                        {aggRows.length > PREVIEW_ROWS && (
                          <tr>
                            <td
                              colSpan={columns.length}
                              className="px-3 py-2 text-[10px] text-content/35 italic"
                            >
                              + {aggRows.length - PREVIEW_ROWS} more rows in
                              download…
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
              <button
                onClick={onClose}
                className="text-[12px] text-content/50 hover:text-content transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomDownload}
                disabled={!canCustomDownload}
                className="flex items-center gap-1.5 bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
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

export default ReceiversExportModal;
