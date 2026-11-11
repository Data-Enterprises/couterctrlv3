// Hooks
import { useState, useMemo } from "react";

// Utils
import {
  rowsToCsv,
  downloadCsv,
  aggregateRows,
  type AggFn,
} from "../../../../utils/csvExport";
import {
  AGG_OPTIONS,
  buildLinesCsv,
  buildSignalsCsv,
  buildTransactionsCsv,
  DIMS,
  groupSignalByTransaction,
  LENS_LABEL,
  METRICS,
  PREVIEW_ROWS,
  toAggRows,
} from "../utils";

// Interfaces
import type { Dataset, ModalMode, Signal } from "../interfaces";
import type { TransactionListItem } from "../../../../interfaces";
import type { ExplorerLens } from "../../../../features/dev/devCashiersSlice";

// Components
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import ResizableModalShell from "../../../../components-dev/modals/ResizableModalShell";

interface CashiersExportModalProps {
  onClose: () => void;
  scopeLabel: string;
  exception: string;
  dateRange: string;
  lens: ExplorerLens;
  /** The signal rows currently listed, after the text filter. */
  signals: Signal[];
  /** Every exception line in the loaded window. */
  exceptionRows: TransactionListItem[];
  /** sale_id -> total lines on that transaction, for basket position. */
  transactionLengths: Record<string, number>;
}

/** The Cashiers Export CSV modal, in Presets and Custom modes. Presets export the signals list, transactions or
 *  exception lines; Custom aggregates the exception lines (the only granular dataset, since signals and
 *  transactions are already roll-ups) by chosen group-by dimensions and metrics. */
const CashiersExportModal = ({
  onClose,
  scopeLabel,
  exception,
  dateRange,
  lens,
  signals,
  exceptionRows,
  transactionLengths,
}: CashiersExportModalProps) => {
  const [mode, setMode] = useState<ModalMode>("presets");
  const [selected, setSelected] = useState<Set<Dataset>>(new Set(["signals"]));

  const [groupBy, setGroupBy] = useState<Set<string>>(new Set(["store"]));
  const [metrics, setMetrics] = useState<Map<string, { fn: AggFn; enabled: boolean }>>(
    () =>
      new Map(
        METRICS.map((m) => [
          m.key,
          { fn: m.key === "lines" ? "count" : "sum", enabled: m.key !== "lineNumber" },
        ]),
      ),
  );

  const toggleDataset = (d: Dataset) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(d) ? next.delete(d) : next.add(d);
      return next;
    });

  const toggleGroupBy = (key: string) =>
    setGroupBy((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const toggleMetric = (key: string) =>
    setMetrics((prev) => {
      const next = new Map(prev);
      const cur = next.get(key)!;
      next.set(key, { ...cur, enabled: !cur.enabled });
      return next;
    });

  const setMetricFn = (key: string, fn: AggFn) =>
    setMetrics((prev) => {
      const next = new Map(prev);
      next.set(key, { ...next.get(key)!, fn });
      return next;
    });

  const transactionCount = useMemo(
    () =>
      signals.reduce(
        (acc, s) => acc + groupSignalByTransaction(s, transactionLengths).length,
        0,
      ),
    [signals, transactionLengths],
  );

  const aggRows = useMemo(() => {
    const dims = [...groupBy];
    const mets = METRICS.filter((m) => metrics.get(m.key)?.enabled).map((m) => ({
      key: m.key,
      fn: metrics.get(m.key)!.fn,
    }));
    if (!dims.length && !mets.length) return [];
    return aggregateRows(toAggRows(exceptionRows), dims, mets);
  }, [exceptionRows, groupBy, metrics]);

  const columns = useMemo(() => {
    const cols: { key: string; label: string }[] = [];
    for (const d of DIMS) if (groupBy.has(d.key)) cols.push({ key: d.key, label: d.label });
    for (const m of METRICS) {
      const sel = metrics.get(m.key)!;
      if (sel.enabled)
        cols.push({
          key: `${sel.fn}__${m.key}`,
          label: `${sel.fn.toUpperCase()} ${m.label}`,
        });
    }
    return cols;
  }, [groupBy, metrics]);

  const fileStem = `cashiers_${exception.replace(/\s+/g, "-").toLowerCase()}`;

  const handlePresetDownload = () => {
    const sections: string[] = [];
    if (selected.has("signals"))
      sections.push(`${LENS_LABEL[lens]} Summary\n${buildSignalsCsv(signals, lens)}`);
    if (selected.has("transactions"))
      sections.push(
        `Transactions\n${buildTransactionsCsv(signals, transactionLengths, lens)}`,
      );
    if (selected.has("lines"))
      sections.push(`Exception Lines\n${buildLinesCsv(exceptionRows)}`);
    if (!sections.length) return;
    downloadCsv(sections.join("\n\n"), `${fileStem}.csv`);
    onClose();
  };

  const handleCustomDownload = () => {
    if (!columns.length) return;
    const data = aggRows.map((r) => columns.map((c) => r[c.key] ?? ""));
    downloadCsv(
      rowsToCsv(columns.map((c) => c.label), data),
      `${fileStem}_custom.csv`,
    );
    onClose();
  };

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:cashiers:v2"
      defaultWidth={1140}
      defaultHeight={960}
    >
        {/* Header */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-brand_navy">
          <div className="min-w-0">
            <p className="text-custom-white text-[13px] font-semibold">Export CSV</p>
            <p className="text-custom-white/95 text-[11px] mt-0.5 truncate">
              {scopeLabel} — {exception} · {dateRange}
            </p>
          </div>
          <div className="flex items-center gap-0.5 bg-custom-white/10 rounded-md p-0.5">
            {(["presets", "custom"] as ModalMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  mode === m
                    ? "bg-custom-white text-brand_navy"
                    : "text-custom-white/95 hover:text-custom-white"
                }`}
              >
                {m === "presets" ? "Presets" : "Custom"}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="text-custom-white/95 hover:text-custom-white transition-colors justify-self-end"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* ── PRESETS MODE ── */}
        {mode === "presets" && (
          <>
            <div className="px-4 pt-4 pb-2 space-y-3">
              <p className="text-[11px] text-content/95 uppercase tracking-wide font-medium">
                Select data to include
              </p>

              {(
                [
                  {
                    key: "signals" as Dataset,
                    title: `${LENS_LABEL[lens]} Summary`,
                    sub: `${signals.length} rows as listed — totals, cashier spread, and top item`,
                  },
                  {
                    key: "transactions" as Dataset,
                    title: "Transactions",
                    sub: `${transactionCount} transactions with basket position and time`,
                  },
                  {
                    key: "lines" as Dataset,
                    title: "Exception Lines",
                    sub: `${exceptionRows.length} raw lines — every field behind the views above`,
                  },
                ]
              ).map(({ key, title, sub }) => (
                <label key={key} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selected.has(key)}
                    onChange={() => toggleDataset(key)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-line_strong accent-brand_navy cursor-pointer flex-shrink-0"
                  />
                  <div>
                    <p className="text-[13px] font-medium text-content group-hover:text-brand_navy transition-colors">
                      {title}
                    </p>
                    <p className="text-[11px] text-content/95 mt-0.5">{sub}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-line_hair mt-2">
              <button
                onClick={onClose}
                className="text-[12px] text-content/95 hover:text-content transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePresetDownload}
                disabled={selected.size === 0}
                className="flex items-center gap-1.5 bg-brand_navy hover:bg-brand_navy/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
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
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-content/95 mb-2">
                    Data Source
                  </p>
                  <p className="text-[12px] text-content">Exception Lines</p>
                  <p className="text-[10px] text-content/95 mt-0.5">
                    {exceptionRows.length} rows
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-content/95 mb-2">
                    Group By
                  </p>
                  <div className="space-y-1.5">
                    {DIMS.map((d) => (
                      <label key={d.key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={groupBy.has(d.key)}
                          onChange={() => toggleGroupBy(d.key)}
                          className="accent-brand_navy h-3.5 w-3.5 rounded flex-shrink-0"
                        />
                        <span className="text-[12px] text-content">{d.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-content/95 mb-2">
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
                            className="accent-brand_navy h-3.5 w-3.5 rounded flex-shrink-0"
                          />
                          <span
                            className={`text-[12px] flex-1 ${sel.enabled ? "text-content" : "text-content/95"}`}
                          >
                            {m.label}
                          </span>
                          <select
                            value={sel.fn}
                            disabled={!sel.enabled}
                            onChange={(e) => setMetricFn(m.key, e.target.value as AggFn)}
                            className="text-[10px] border border-line_field rounded px-1 py-0.5 text-content disabled:opacity-30 bg-custom-white outline-none"
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
              </div>

              {/* Right: preview */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-line_hair flex-shrink-0">
                  <p className="text-[11px] font-semibold text-content/95 uppercase tracking-wide">
                    Preview
                  </p>
                  <span className="text-[10px] text-content/95">
                    {aggRows.length === 0
                      ? "No data — select at least one group or metric"
                      : `Showing ${Math.min(PREVIEW_ROWS, aggRows.length)} of ${aggRows.length} rows`}
                  </span>
                </div>

                {columns.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center p-6 text-center">
                    <p className="text-[12px] text-content/95 leading-relaxed">
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
                              className="text-left px-3 py-2 text-content/95 font-semibold border-b border-line_hair whitespace-nowrap"
                            >
                              {c.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {aggRows.slice(0, PREVIEW_ROWS).map((row, i) => (
                          <tr key={i} className={i % 2 === 0 ? "bg-custom-white" : "bg-gray-50/50"}>
                            {columns.map((c) => (
                              <td
                                key={c.key}
                                className="px-3 py-1.5 text-content/95 whitespace-nowrap border-b border-line_faint"
                              >
                                {row[c.key] ?? "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-line_hair">
              <button
                onClick={onClose}
                className="text-[12px] text-content/95 hover:text-content transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomDownload}
                disabled={columns.length === 0}
                className="flex items-center gap-1.5 bg-brand_navy hover:bg-brand_navy/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
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

export default CashiersExportModal;
