import { useState, useMemo } from "react";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import type { SubSale, HourlySale } from "../../../interfaces";
import type { DayDot } from "./LedgerRow";
import type { ExportSubDeptItem } from "../../../features/salesLedgerSlice";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SalesExportModalProps {
  onClose: () => void;
  storeName: string;
  dateLabel: string;
  rawSubs: SubSale[];
  rawLWSubs: SubSale[];
  rawLYSubs: SubSale[];
  rawHourly: HourlySale[];
  rawLWHourly: HourlySale[];
  rawLYHourly: HourlySale[];
  days: DayDot[];
  subDeptItems?: ExportSubDeptItem[];
  subDeptName?: string;
}

type ExportDataset = "subdept" | "hourly" | "summary" | "items";
type ItemSev = "critical" | "watch" | "healthy";
type ModalMode = "presets" | "custom";
type CustomSource = "subdept" | "hourly";
type AggFn = "sum" | "avg" | "min" | "max" | "count";

interface DimDef { key: string; label: string }
interface MetricDef { key: string; label: string }
interface MetricSelection { fn: AggFn; enabled: boolean }

type AggRow = Record<string, string | number>;

// ─── Formatting helpers ────────────────────────────────────────────────────────

const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

const fmtHour = (h: number) => {
  const ampm = h < 12 ? "AM" : "PM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:00 ${ampm}`;
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

// ─── Preset CSV builders ──────────────────────────────────────────────────────

const buildSubDeptCsv = (ty: SubSale[], lw: SubSale[], ly: SubSale[]) => {
  const headers = ["Date", "Sub Dept #", "Sub Dept", "Period", "Net Sales", "Qty", "Transactions", "Total Tax"];
  const toRows = (subs: SubSale[], period: string) =>
    subs.map((s) => [fmtDate(s.sale_date.split("T")[0]), s.sub_department, s.sub_department_description, period, fmtNum(s.net_sales), s.qty, s.transaction_count, fmtNum(s.total_tax)]);
  return rowsToCsv(headers, [...toRows(ty, "This Year"), ...toRows(lw, "Last Week"), ...toRows(ly, "Last Year")]);
};

const buildHourlyCsv = (ty: HourlySale[], lw: HourlySale[], ly: HourlySale[]) => {
  const headers = ["Date", "Hour", "Period", "Net Sales", "Qty", "Transactions", "Basket Size ($)", "Basket Size (Qty)", "Avg Item Price"];
  const toRows = (hourly: HourlySale[], period: string) =>
    hourly.map((h) => [fmtDate(h.sale_date.split("T")[0]), fmtHour(h.hour), period, fmtNum(h.net_sales), h.qty, h.transactions, fmtNum(h.basket_size_sales), fmtNum(h.basket_size_qty), fmtNum(h.avg_item_price)]);
  return rowsToCsv(headers, [...toRows(ty, "This Year"), ...toRows(lw, "Last Week"), ...toRows(ly, "Last Year")]);
};

const buildSummaryCsv = (days: DayDot[]) => {
  const headers = ["Date", "TY Net Sales", "LW Net Sales", "LY Net Sales"];
  const rows = [...days].sort((a, b) => a.sale_date.localeCompare(b.sale_date))
    .map((d) => [fmtDate(d.sale_date.split("T")[0]), fmtNum(d.twNet), fmtNum(d.lwNet), fmtNum(d.lyNet)]);
  return rowsToCsv(headers, rows);
};

const SEV_LABEL: Record<ItemSev, string> = { critical: "Critical", watch: "Watch", healthy: "Healthy" };

const fmtPctRaw = (pct: number | null) => pct === null ? "" : `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;

const buildItemsCsv = (items: ExportSubDeptItem[], sevs: Set<ItemSev>) => {
  const filtered = items.filter((i) => sevs.has(i.sev));
  const headers = ["Product Code", "Description", "Severity", "TY Net", "TY Qty", "LW Net", "LW Qty", "LW vs %", "LY Net", "LY Qty", "LY vs %"];
  const rows = filtered.map((i) => {
    const lwPct = i.lwNet !== null && i.lwNet > 0 ? ((i.tyNet - i.lwNet) / i.lwNet) * 100 : null;
    const lyPct = i.lyNet !== null && i.lyNet > 0 ? ((i.tyNet - i.lyNet) / i.lyNet) * 100 : null;
    return [
      i.productCode,
      i.desc,
      SEV_LABEL[i.sev],
      fmtNum(i.tyNet),
      i.tyQty,
      i.lwNet !== null ? fmtNum(i.lwNet) : "",
      i.lwQty ?? "",
      fmtPctRaw(lwPct),
      i.lyNet !== null ? fmtNum(i.lyNet) : "",
      i.lyQty ?? "",
      fmtPctRaw(lyPct),
    ];
  });
  return rowsToCsv(headers, rows);
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

function aggregateRows(
  rows: AggRow[],
  dims: string[],
  metrics: { key: string; fn: AggFn }[],
): AggRow[] {
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

const SUBDEPT_DIMS: DimDef[] = [
  { key: "sale_date", label: "Date" },
  { key: "period",    label: "Period" },
  { key: "sub_department", label: "Sub Dept #" },
  { key: "sub_department_description", label: "Sub Dept Name" },
];

const SUBDEPT_METRICS: MetricDef[] = [
  { key: "net_sales",         label: "Net Sales" },
  { key: "qty",               label: "Qty" },
  { key: "transaction_count", label: "Transactions" },
  { key: "total_tax",         label: "Total Tax" },
];

const HOURLY_DIMS: DimDef[] = [
  { key: "sale_date", label: "Date" },
  { key: "period",    label: "Period" },
  { key: "hour",      label: "Hour" },
];

const HOURLY_METRICS: MetricDef[] = [
  { key: "net_sales",        label: "Net Sales" },
  { key: "qty",              label: "Qty" },
  { key: "transactions",     label: "Transactions" },
  { key: "basket_size_sales", label: "Basket Size ($)" },
  { key: "avg_item_price",   label: "Avg Item Price" },
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

const SalesExportModal = ({
  onClose,
  storeName,
  dateLabel,
  rawSubs, rawLWSubs, rawLYSubs,
  rawHourly, rawLWHourly, rawLYHourly,
  days,
  subDeptItems,
  subDeptName,
}: SalesExportModalProps) => {

  const hasItems = !!subDeptItems && subDeptItems.length > 0;

  // ── Preset state ──
  const [mode, setMode] = useState<ModalMode>("presets");
  const [selected, setSelected] = useState<Set<ExportDataset>>(new Set(["subdept", "hourly", "summary"]));
  const [itemSevs, setItemSevs] = useState<Set<ItemSev>>(new Set(["critical", "watch", "healthy"]));

  const toggleItemSev = (sev: ItemSev) =>
    setItemSevs((prev) => { const n = new Set(prev); n.has(sev) ? n.delete(sev) : n.add(sev); return n; });

  // ── Custom builder state ──
  const [source, setSource] = useState<CustomSource>("subdept");
  const [groupBy, setGroupBy] = useState<Set<string>>(new Set(["sale_date", "period", "sub_department_description"]));
  const [metrics, setMetrics] = useState<Map<string, MetricSelection>>(
    new Map([
      ["net_sales",         { fn: "sum", enabled: true }],
      ["qty",               { fn: "sum", enabled: false }],
      ["transaction_count", { fn: "sum", enabled: false }],
      ["total_tax",         { fn: "sum", enabled: false }],
    ])
  );

  const dims  = source === "subdept" ? SUBDEPT_DIMS  : HOURLY_DIMS;
  const mDefs = source === "subdept" ? SUBDEPT_METRICS : HOURLY_METRICS;

  // Switch source → reset groupBy & metrics to sensible defaults
  const switchSource = (s: CustomSource) => {
    setSource(s);
    if (s === "subdept") {
      setGroupBy(new Set(["sale_date", "period", "sub_department_description"]));
      setMetrics(new Map([
        ["net_sales",         { fn: "sum", enabled: true }],
        ["qty",               { fn: "sum", enabled: false }],
        ["transaction_count", { fn: "sum", enabled: false }],
        ["total_tax",         { fn: "sum", enabled: false }],
      ]));
    } else {
      setGroupBy(new Set(["sale_date", "period", "hour"]));
      setMetrics(new Map([
        ["net_sales",         { fn: "sum", enabled: true }],
        ["qty",               { fn: "sum", enabled: false }],
        ["transactions",      { fn: "sum", enabled: false }],
        ["basket_size_sales", { fn: "avg", enabled: false }],
        ["avg_item_price",    { fn: "avg", enabled: false }],
      ]));
    }
  };

  const toggleGroupBy = (key: string) => {
    setGroupBy((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleMetric = (key: string) => {
    setMetrics((prev) => {
      const next = new Map(prev);
      const cur = next.get(key)!;
      next.set(key, { ...cur, enabled: !cur.enabled });
      return next;
    });
  };

  const setMetricFn = (key: string, fn: AggFn) => {
    setMetrics((prev) => {
      const next = new Map(prev);
      const cur = next.get(key)!;
      next.set(key, { ...cur, fn });
      return next;
    });
  };

  // ── Build flat rows for aggregation ──
  const flatRows = useMemo<AggRow[]>(() => {
    const tagPeriod = (rows: (SubSale | HourlySale)[], period: string): AggRow[] =>
      rows.map((r) => ({ ...r, period } as AggRow));

    if (source === "subdept") {
      return [
        ...tagPeriod(rawSubs,   "This Year"),
        ...tagPeriod(rawLWSubs, "Last Week"),
        ...tagPeriod(rawLYSubs, "Last Year"),
      ];
    }
    return [
      ...tagPeriod(rawHourly,   "This Year"),
      ...tagPeriod(rawLWHourly, "Last Week"),
      ...tagPeriod(rawLYHourly, "Last Year"),
    ];
  }, [source, rawSubs, rawLWSubs, rawLYSubs, rawHourly, rawLWHourly, rawLYHourly]);

  // ── Aggregated result ──
  const { aggRows, columns } = useMemo(() => {
    const activeDims   = dims.filter((d) => groupBy.has(d.key));
    const activeMetrics = mDefs
      .map((m) => ({ ...m, sel: metrics.get(m.key) }))
      .filter((m) => m.sel?.enabled)
      .map((m) => ({ key: m.key, fn: m.sel!.fn, label: m.label }));

    const aggRows = aggregateRows(
      flatRows,
      activeDims.map((d) => d.key),
      activeMetrics.map((m) => ({ key: m.key, fn: m.fn })),
    );

    // Format display values
    const display = aggRows.map((row) => {
      const out: Record<string, string> = {};
      for (const d of activeDims) {
        const raw = row[d.key];
        if (d.key === "sale_date") out[d.key] = fmtDate(String(raw).split("T")[0]);
        else if (d.key === "hour") out[d.key] = fmtHour(Number(raw));
        else out[d.key] = String(raw ?? "");
      }
      for (const m of activeMetrics) {
        const colKey = `${m.fn}__${m.key}`;
        const val = Number(row[colKey]);
        out[colKey] = m.fn === "count" ? String(Math.round(val)) : fmtNum(val);
      }
      return out;
    });

    const columns: { key: string; label: string }[] = [
      ...activeDims.map((d) => ({ key: d.key, label: d.label })),
      ...activeMetrics.map((m) => ({ key: `${m.fn}__${m.key}`, label: `${m.fn.charAt(0).toUpperCase() + m.fn.slice(1)} ${m.label}` })),
    ];

    return { aggRows: display, columns };
  }, [flatRows, groupBy, metrics, dims, mDefs]);

  // ── Preset download ──
  const handlePresetDownload = () => {
    const sections: string[] = [];
    if (selected.has("summary")) sections.push(`Weekly Summary\n${buildSummaryCsv(days)}`);
    if (selected.has("subdept")) sections.push(`Sub Department\n${buildSubDeptCsv(rawSubs, rawLWSubs, rawLYSubs)}`);
    if (selected.has("hourly"))  sections.push(`Hourly Breakdown\n${buildHourlyCsv(rawHourly, rawLWHourly, rawLYHourly)}`);
    if (selected.has("items") && subDeptItems && itemSevs.size > 0) {
      const label = subDeptName ? `Items — ${subDeptName}` : "Sub Dept Items";
      sections.push(`${label}\n${buildItemsCsv(subDeptItems, itemSevs)}`);
    }
    if (!sections.length) return;
    const safeName = storeName.replace(/[^a-z0-9]/gi, "_");
    downloadCsv(sections.join("\n\n"), `${safeName}_${dateLabel}.csv`);
    onClose();
  };

  // ── Custom download ──
  const handleCustomDownload = () => {
    if (!columns.length || !aggRows.length) return;
    const headers = columns.map((c) => c.label);
    const rows = aggRows.map((r) => columns.map((c) => r[c.key] ?? ""));
    const safeName = storeName.replace(/[^a-z0-9]/gi, "_");
    downloadCsv(rowsToCsv(headers, rows), `${safeName}_custom_${dateLabel}.csv`);
    onClose();
  };

  const presetDatasets: { id: ExportDataset; label: string; description: string }[] = [
    { id: "summary",  label: "Weekly Summary",      description: "Day-by-day net sales vs last week and last year" },
    { id: "subdept",  label: "Sub Department",      description: "Net sales, qty, and transactions by sub dept (TY / LW / LY)" },
    { id: "hourly",   label: "Hourly Breakdown",    description: "Hourly net sales, basket size, and avg item price (TY / LW / LY)" },
  ];

  const SEV_CHIP: { sev: ItemSev; label: string; activeClass: string }[] = [
    { sev: "critical", label: "Critical", activeClass: "bg-red-600 border-red-600 text-white" },
    { sev: "watch",    label: "Watch",    activeClass: "bg-amber-500 border-amber-500 text-white" },
    { sev: "healthy",  label: "Healthy",  activeClass: "bg-emerald-600 border-emerald-600 text-white" },
  ];

  const canCustomDownload = columns.length > 0 && aggRows.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-xl shadow-xl w-full overflow-hidden transition-all duration-200 ${mode === "custom" ? "max-w-2xl" : "max-w-lg"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-[#1e2a4a]">
          <div>
            <p className="text-white text-[13px] font-semibold">Export CSV</p>
            <p className="text-white text-[10px] mt-0.5">{storeName}</p>
          </div>
          {/* Mode tabs */}
          <div className="flex items-center gap-0.5 bg-white/10 rounded-md p-0.5">
            {(["presets", "custom"] as ModalMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  mode === m ? "bg-white text-[#1e2a4a]" : "text-white"
                }`}
              >
                {m === "presets" ? "Presets" : "Custom"}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors justify-self-end">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* ── PRESETS MODE ── */}
        {mode === "presets" && (
          <>
            <div className="px-4 pt-4 pb-2 space-y-3">
              <p className="text-[11px] text-content uppercase tracking-wide font-medium">Select data to include</p>
              {presetDatasets.map(({ id, label, description }) => (
                <label key={id} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selected.has(id)}
                    onChange={() => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#1e2a4a] cursor-pointer flex-shrink-0"
                  />
                  <div>
                    <p className="text-[13px] font-medium text-content group-hover:text-[#1e2a4a] transition-colors">{label}</p>
                    <p className="text-[11px] text-content mt-0.5">{description}</p>
                  </div>
                </label>
              ))}

              {hasItems && (
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has("items")}
                    onChange={() => setSelected((prev) => { const n = new Set(prev); n.has("items") ? n.delete("items") : n.add("items"); return n; })}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#1e2a4a] cursor-pointer flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <p className="text-[13px] font-medium text-content">Sub Dept Items</p>
                      {subDeptName && (
                        <span className="text-[10px] text-content italic truncate">{subDeptName}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-content mt-0.5 mb-1.5">Product-level items with severity grading (TY / LW / LY)</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {SEV_CHIP.map(({ sev, label, activeClass }) => (
                        <button
                          key={sev}
                          onClick={() => toggleItemSev(sev)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                            itemSevs.has(sev) ? activeClass : "bg-white border-gray-200 text-content"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-2">
              <button onClick={onClose} className="text-[12px] text-content transition-colors">Cancel</button>
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

              {/* Left: config panel */}
              <div className="overflow-y-auto no-scrollbar p-4 space-y-5">
                {/* Source */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-content mb-2">Data Source</p>
                  <div className="flex flex-col gap-1.5">
                    {(["subdept", "hourly"] as CustomSource[]).map((s) => (
                      <label key={s} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={source === s}
                          onChange={() => switchSource(s)}
                          className="accent-[#1e2a4a] h-3.5 w-3.5"
                        />
                        <span className="text-[12px] text-content">{s === "subdept" ? "Sub Department" : "Hourly"}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Group by */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-content mb-2">Group By</p>
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
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-content mb-2">Metrics</p>
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
                          <span className="text-[12px] flex-1 text-content">{m.label}</span>
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
                  <p className="text-[11px] font-semibold text-content uppercase tracking-wide">Preview</p>
                  <span className="text-[10px] text-content">
                    {aggRows.length === 0
                      ? "No data — select at least one group or metric"
                      : `Showing ${Math.min(PREVIEW_ROWS, aggRows.length)} of ${aggRows.length} rows`}
                  </span>
                </div>

                {columns.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center p-6 text-center">
                    <p className="text-[12px] text-content leading-relaxed">
                      Select at least one group-by dimension<br />or metric to see a preview.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto thin-scrollbar">
                    <table className="min-w-full text-[11px] border-collapse">
                      <thead className="sticky top-0 bg-gray-50 z-10">
                        <tr>
                          {columns.map((c) => (
                            <th key={c.key} className="text-left px-3 py-2 text-content font-semibold border-b border-gray-100 whitespace-nowrap">
                              {c.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {aggRows.slice(0, PREVIEW_ROWS).map((row, i) => (
                          <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                            {columns.map((c) => (
                              <td key={c.key} className="px-3 py-1.5 text-content whitespace-nowrap border-b border-gray-50">
                                {row[c.key] ?? "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                        {aggRows.length > PREVIEW_ROWS && (
                          <tr>
                            <td colSpan={columns.length} className="px-3 py-2 text-[10px] text-content italic">
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

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <button onClick={onClose} className="text-[12px] text-content transition-colors">Cancel</button>
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

export default SalesExportModal;
