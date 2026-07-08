import { useMemo, useState } from "react";
import { ArrowDownTrayIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { computeMargin } from "../lookupMetrics";
import type { DayBucket } from "../lookupMetrics";
import type { QueueItem } from "./useLookupQueue";

interface LookupExportModalProps {
  queue: QueueItem[];
  selectedDescription: string;
  buckets: DayBucket[];
  onClose: () => void;
}

type ModalMode = "presets" | "custom";
type Preset = "batch" | "daily";
type BatchColKey = "upc" | "description" | "marginPct" | "avgSoldAt" | "listPrice" | "caseCost" | "totalQty" | "daysSold";
type DailyColKey = "date" | "qty" | "revenue" | "cost" | "caseCost" | "listPrice" | "marginPct";

const BATCH_COLS: { key: BatchColKey; label: string; defaultOn: boolean }[] = [
  { key: "upc", label: "UPC", defaultOn: true },
  { key: "description", label: "Description", defaultOn: true },
  { key: "marginPct", label: "Margin %", defaultOn: true },
  { key: "avgSoldAt", label: "Avg sold at", defaultOn: false },
  { key: "listPrice", label: "List price", defaultOn: false },
  { key: "caseCost", label: "Case cost", defaultOn: false },
  { key: "totalQty", label: "Total units", defaultOn: false },
  { key: "daysSold", label: "Days sold", defaultOn: false },
];

const DAILY_COLS: { key: DailyColKey; label: string; defaultOn: boolean }[] = [
  { key: "date", label: "Date", defaultOn: true },
  { key: "qty", label: "Qty", defaultOn: true },
  { key: "revenue", label: "Revenue", defaultOn: true },
  { key: "cost", label: "Cost", defaultOn: false },
  { key: "caseCost", label: "Case cost", defaultOn: false },
  { key: "listPrice", label: "List price", defaultOn: false },
  { key: "marginPct", label: "Margin %", defaultOn: true },
];

const PREVIEW_ROWS = 5;

const escCsv = (val: string | number | null | undefined) => {
  const s = String(val ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
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

interface BatchRow {
  upc: string;
  description: string;
  marginPct: number | null;
  avgSoldAt: number;
  listPrice: number;
  caseCost: number;
  totalQty: number;
  daysSold: number;
}

const buildBatchRows = (queue: QueueItem[]): BatchRow[] =>
  queue
    .filter((q) => q.status === "loaded" && q.history)
    .map((q) => {
      const margin = computeMargin(q.history!, q.totalSales ?? 0, q.totalQty ?? 0);
      return {
        upc: q.upc,
        description: q.description ?? "",
        marginPct: margin.marginPct,
        avgSoldAt: margin.avgSoldAt,
        listPrice: margin.listPrice,
        caseCost: margin.caseCost,
        totalQty: q.totalQty ?? 0,
        daysSold: q.daysSold ?? 0,
      };
    });

const batchCell = (row: BatchRow, key: BatchColKey): string | number => {
  switch (key) {
    case "upc": return row.upc;
    case "description": return row.description;
    case "marginPct": return row.marginPct !== null ? row.marginPct.toFixed(2) : "";
    case "avgSoldAt": return row.avgSoldAt.toFixed(2);
    case "listPrice": return row.listPrice.toFixed(2);
    case "caseCost": return row.caseCost.toFixed(2);
    case "totalQty": return row.totalQty;
    case "daysSold": return row.daysSold;
  }
};

const dailyMarginPct = (b: DayBucket): number | null =>
  b.hasSale && b.revenue > 0 ? ((b.revenue - b.cost) / b.revenue) * 100 : null;

const dailyCell = (b: DayBucket, key: DailyColKey): string | number => {
  if (!b.hasSale && key !== "date") return "";
  switch (key) {
    case "date": return b.label;
    case "qty": return b.qty;
    case "revenue": return b.revenue.toFixed(2);
    case "cost": return b.cost.toFixed(2);
    case "caseCost": return (b.cost / b.qty).toFixed(2);
    case "listPrice": return b.listPrice.toFixed(2);
    case "marginPct": {
      const pct = dailyMarginPct(b);
      return pct !== null ? pct.toFixed(2) : "";
    }
  }
};

const LookupExportModal = ({ queue, selectedDescription, buckets, onClose }: LookupExportModalProps) => {
  const [mode, setMode] = useState<ModalMode>("presets");
  const [preset, setPreset] = useState<Preset>("batch");
  const [source, setSource] = useState<Preset>("batch");
  const [batchCols, setBatchCols] = useState<Set<BatchColKey>>(
    new Set(BATCH_COLS.filter((c) => c.defaultOn).map((c) => c.key)),
  );
  const [dailyCols, setDailyCols] = useState<Set<DailyColKey>>(
    new Set(DAILY_COLS.filter((c) => c.defaultOn).map((c) => c.key)),
  );

  const batchRows = useMemo(() => buildBatchRows(queue), [queue]);
  const hasSelectedItem = buckets.length > 0;

  const toggleBatchCol = (key: BatchColKey) => {
    setBatchCols((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleDailyCol = (key: DailyColKey) => {
    setDailyCols((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const activeCols = source === "batch" ? BATCH_COLS.filter((c) => batchCols.has(c.key)) : DAILY_COLS.filter((c) => dailyCols.has(c.key));

  const handleDownload = () => {
    if (mode === "presets") {
      if (preset === "batch") {
        const cols = BATCH_COLS;
        downloadCsv(
          rowsToCsv(cols.map((c) => c.label), batchRows.map((r) => cols.map((c) => batchCell(r, c.key)))),
          "item-lookup-batch-summary.csv",
        );
      } else {
        downloadCsv(
          rowsToCsv(DAILY_COLS.map((c) => c.label), buckets.map((b) => DAILY_COLS.map((c) => dailyCell(b, c.key)))),
          "item-lookup-daily-breakdown.csv",
        );
      }
    } else {
      if (source === "batch") {
        const cols = BATCH_COLS.filter((c) => batchCols.has(c.key));
        downloadCsv(
          rowsToCsv(cols.map((c) => c.label), batchRows.map((r) => cols.map((c) => batchCell(r, c.key)))),
          "item-lookup-batch-summary.csv",
        );
      } else {
        const cols = DAILY_COLS.filter((c) => dailyCols.has(c.key));
        downloadCsv(
          rowsToCsv(cols.map((c) => c.label), buckets.map((b) => cols.map((c) => dailyCell(b, c.key)))),
          "item-lookup-daily-breakdown.csv",
        );
      }
    }
    onClose();
  };

  const canDownload = mode === "presets" ? (preset === "batch" ? batchRows.length > 0 : hasSelectedItem) : activeCols.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className={`bg-white rounded-xl shadow-xl w-full overflow-hidden transition-all duration-200 ${mode === "custom" ? "max-w-2xl" : "max-w-sm"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-[#1e2a4a]">
          <div className="flex items-center gap-3">
            <p className="text-white text-[13px] font-semibold">Export CSV</p>
            <div className="flex items-center gap-0.5 bg-white/10 rounded-md p-0.5">
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

        {mode === "presets" ? (
          <div className="p-4">
            <p className="text-[11px] text-content/50 uppercase tracking-wide font-medium mb-2">Select data to include</p>
            <label className="flex items-start gap-2.5 py-2.5 border-b border-gray-100 cursor-pointer">
              <input type="radio" checked={preset === "batch"} onChange={() => setPreset("batch")} className="mt-0.5" />
              <div>
                <p className="text-[13px] font-medium text-content">All items — batch summary</p>
                <p className="text-[11px] text-content/50 mt-0.5">One row per loaded item ({batchRows.length})</p>
              </div>
            </label>
            <label className={`flex items-start gap-2.5 py-2.5 cursor-pointer ${!hasSelectedItem ? "opacity-40" : ""}`}>
              <input
                type="radio"
                checked={preset === "daily"}
                onChange={() => setPreset("daily")}
                disabled={!hasSelectedItem}
                className="mt-0.5"
              />
              <div>
                <p className="text-[13px] font-medium text-content">Current item — daily breakdown</p>
                <p className="text-[11px] text-content/50 mt-0.5">
                  {hasSelectedItem ? `${selectedDescription} · one row per day` : "Select an item first"}
                </p>
              </div>
            </label>
            <button
              onClick={handleDownload}
              disabled={!canDownload}
              className="w-full mt-3 flex items-center justify-center gap-1.5 bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-40 text-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
            >
              <ArrowDownTrayIcon className="w-3.5 h-3.5" />
              Download CSV
            </button>
          </div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: "200px 1fr" }}>
            <div className="p-3.5 border-r border-gray-100">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-content/45 mb-2">Data source</p>
              <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer">
                <input type="radio" checked={source === "batch"} onChange={() => setSource("batch")} />
                <span className="text-[11.5px] text-content">Batch summary</span>
              </label>
              <label className={`flex items-center gap-1.5 mb-3.5 cursor-pointer ${!hasSelectedItem ? "opacity-40" : ""}`}>
                <input type="radio" checked={source === "daily"} onChange={() => setSource("daily")} disabled={!hasSelectedItem} />
                <span className="text-[11.5px] text-content">Current item (daily)</span>
              </label>

              <p className="text-[10px] font-semibold uppercase tracking-wide text-content/45 mb-2">Columns</p>
              {source === "batch"
                ? BATCH_COLS.map((c) => (
                    <label key={c.key} className="flex items-center gap-1.5 mb-1.5 cursor-pointer">
                      <input type="checkbox" checked={batchCols.has(c.key)} onChange={() => toggleBatchCol(c.key)} />
                      <span className="text-[11.5px] text-content">{c.label}</span>
                    </label>
                  ))
                : DAILY_COLS.map((c) => (
                    <label key={c.key} className="flex items-center gap-1.5 mb-1.5 cursor-pointer">
                      <input type="checkbox" checked={dailyCols.has(c.key)} onChange={() => toggleDailyCol(c.key)} />
                      <span className="text-[11.5px] text-content">{c.label}</span>
                    </label>
                  ))}
            </div>

            <div className="p-3.5 flex flex-col">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-content/45 mb-2">Preview</p>
              <div className="border border-gray-100 rounded-md overflow-hidden">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {activeCols.map((c) => (
                        <th key={c.key} className="text-left px-2.5 py-1.5 text-content/55 font-semibold whitespace-nowrap">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {source === "batch"
                      ? batchRows.slice(0, PREVIEW_ROWS).map((r) => (
                          <tr key={r.upc} className="border-b border-gray-50">
                            {activeCols.map((c) => (
                              <td key={c.key} className="px-2.5 py-1 text-content/80 whitespace-nowrap">
                                {batchCell(r, c.key as BatchColKey)}
                              </td>
                            ))}
                          </tr>
                        ))
                      : buckets.slice(0, PREVIEW_ROWS).map((b) => (
                          <tr key={b.date} className="border-b border-gray-50">
                            {activeCols.map((c) => (
                              <td key={c.key} className="px-2.5 py-1 text-content/80 whitespace-nowrap">
                                {dailyCell(b, c.key as DailyColKey)}
                              </td>
                            ))}
                          </tr>
                        ))}
                    {(source === "batch" ? batchRows.length : buckets.length) > PREVIEW_ROWS && (
                      <tr>
                        <td colSpan={activeCols.length} className="px-2.5 py-1.5 text-[10px] text-content/35 italic">
                          +{(source === "batch" ? batchRows.length : buckets.length) - PREVIEW_ROWS} more rows in download…
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex-1" />
              <div className="flex items-center justify-between mt-3.5">
                <button onClick={onClose} className="text-[12px] text-content/50 hover:text-content transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!canDownload}
                  className="flex items-center gap-1.5 bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-40 text-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
                >
                  <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                  Download CSV
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LookupExportModal;
