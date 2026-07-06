import { useState, useMemo } from "react";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import type { SubDeptMargin } from "../../../../interfaces";
import type { GradingMetric } from "../../../../features/subMarginSlice";
import { calculateCogs } from "../..";

// ─── Types ────────────────────────────────────────────────────────────────────

type ExportPreset = "items" | "items_vs_ly" | "cost" | "nocost" | "week_trend";
type ModalMode = "presets" | "custom";
type CustomSource = "ty" | "ly";
type AggFn = "sum" | "avg" | "min" | "max" | "count";

interface DimDef { key: string; label: string }
interface MetricDef { key: string; label: string }
interface MetricSelection { fn: AggFn; enabled: boolean }

type AggRow = Record<string, string | number>;

interface MarginPerfExportModalProps {
  onClose: () => void;
  storeName: string;
  subDeptName: string;
  dateRange: string;
  tyMargins: SubDeptMargin[];
  lyMargins: SubDeptMargin[];
  weekOneMargins: SubDeptMargin[];
  weekTwoMargins: SubDeptMargin[];
  weekThreeMargins: SubDeptMargin[];
  weekFourMargins: SubDeptMargin[];
  weekOneMarginsLY: SubDeptMargin[];
  weekTwoMarginsLY: SubDeptMargin[];
  weekThreeMarginsLY: SubDeptMargin[];
  weekFourMarginsLY: SubDeptMargin[];
  gradingMetric: GradingMetric;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

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

const netSales = (m: SubDeptMargin) => m.total_sales - m.total_tax;
const itemCogs = (m: SubDeptMargin) => calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight);

const downloadCsv = (content: string, filename: string) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── Preset CSV builders ──────────────────────────────────────────────────────

const buildItemsCsv = (margins: SubDeptMargin[]) => {
  const headers = ["Product Code", "Description", "Net Sales", "Qty", "COGS", "Margin %"];
  const grouped = new Map<string, { desc: string; sales: number; qty: number; cogs: number }>();
  for (const m of margins) {
    const existing = grouped.get(m.product_code);
    if (existing) {
      existing.sales += netSales(m);
      existing.qty += m.qty;
      existing.cogs += itemCogs(m);
    } else {
      grouped.set(m.product_code, {
        desc: m.product_description,
        sales: netSales(m),
        qty: m.qty,
        cogs: itemCogs(m),
      });
    }
  }
  const rows = Array.from(grouped.entries()).map(([code, v]) => {
    const marginPct = v.sales > 0 ? ((v.sales - v.cogs) / v.sales) * 100 : 0;
    return [code, v.desc, fmtNum(v.sales), v.qty, fmtNum(v.cogs), fmtNum(marginPct)];
  });
  return rowsToCsv(headers, rows);
};

const buildItemsVsLyCsv = (ty: SubDeptMargin[], ly: SubDeptMargin[]) => {
  const headers = ["Product Code", "Description", "TY Net Sales", "LY Net Sales", "TY Margin %", "LY Margin %", "Margin Pts Δ"];
  const agg = (src: SubDeptMargin[]) => {
    const map = new Map<string, { desc: string; sales: number; cogs: number }>();
    for (const m of src) {
      const e = map.get(m.product_code);
      if (e) { e.sales += netSales(m); e.cogs += itemCogs(m); }
      else map.set(m.product_code, { desc: m.product_description, sales: netSales(m), cogs: itemCogs(m) });
    }
    return map;
  };
  const tyMap = agg(ty);
  const lyMap = agg(ly);
  const allCodes = new Set([...tyMap.keys(), ...lyMap.keys()]);
  const rows: (string | number)[][] = [];
  allCodes.forEach((code) => {
    const t = tyMap.get(code);
    const l = lyMap.get(code);
    const tySales = t?.sales ?? 0;
    const tyCogs = t?.cogs ?? 0;
    const lySales = l?.sales ?? 0;
    const lyCogs = l?.cogs ?? 0;
    const tyMpct = tySales > 0 ? ((tySales - tyCogs) / tySales) * 100 : 0;
    const lyMpct = lySales > 0 ? ((lySales - lyCogs) / lySales) * 100 : 0;
    const pts = tyMpct - lyMpct;
    rows.push([code, t?.desc ?? l?.desc ?? "", fmtNum(tySales), fmtNum(lySales), fmtNum(tyMpct), fmtNum(lyMpct), fmtNum(pts)]);
  });
  return rowsToCsv(headers, rows);
};

const buildCostCsv = (margins: SubDeptMargin[]) => {
  const headers = ["Product Code", "Description", "Cost", "Net Cost", "Case Size", "Calculated Cost", "Total COGS", "Qty"];
  const grouped = new Map<string, { desc: string; cost: number; netCost: number; caseSize: number; calcCost: number; totalCogs: number; qty: number }>();
  for (const m of margins) {
    const e = grouped.get(m.product_code);
    if (e) {
      e.qty += m.qty;
      e.totalCogs += itemCogs(m);
    } else {
      grouped.set(m.product_code, {
        desc: m.product_description,
        cost: m.cost,
        netCost: m.net_cost,
        caseSize: m.case_size,
        calcCost: m.calculated_cost,
        totalCogs: itemCogs(m),
        qty: m.qty,
      });
    }
  }
  const rows = Array.from(grouped.entries()).map(([code, v]) =>
    [code, v.desc, fmtNum(v.cost, 4), fmtNum(v.netCost, 4), v.caseSize, fmtNum(v.calcCost, 4), fmtNum(v.totalCogs), v.qty]
  );
  return rowsToCsv(headers, rows);
};

const buildNoCostCsv = (margins: SubDeptMargin[]) => {
  const headers = ["Product Code", "Description", "Qty", "Cost", "Net Cost", "Case Size"];
  const seen = new Set<string>();
  const rows: (string | number)[][] = [];
  for (const m of margins) {
    if (!seen.has(m.product_code) && (m.case_size === 0 || (m.net_cost === 0 && m.cost === 0))) {
      seen.add(m.product_code);
      rows.push([m.product_code, m.product_description, m.qty, fmtNum(m.cost, 4), fmtNum(m.net_cost, 4), m.case_size]);
    }
  }
  return rowsToCsv(headers, rows);
};

const buildWeekTrendCsv = (
  weeks: SubDeptMargin[][],
  weeksLY: SubDeptMargin[][],
) => {
  const headers = ["Week", "TY Net Sales", "TY Margin %", "LY Net Sales", "LY Margin %", "Sales Δ%", "Margin Pts Δ"];
  const calcWeek = (src: SubDeptMargin[]) => {
    const sales = src.reduce((acc, m) => acc + netSales(m), 0);
    const cogs = src.reduce((acc, m) => acc + itemCogs(m), 0);
    return { sales, marginPct: sales > 0 ? ((sales - cogs) / sales) * 100 : 0 };
  };
  const rows = weeks.map((wk, i) => {
    const ty = calcWeek(wk);
    const ly = calcWeek(weeksLY[i]);
    const salesDelta = ly.sales > 0 ? ((ty.sales - ly.sales) / Math.abs(ly.sales)) * 100 : 0;
    const ptsDelta = ty.marginPct - ly.marginPct;
    return [`Week ${i + 1}`, fmtNum(ty.sales), fmtNum(ty.marginPct), fmtNum(ly.sales), fmtNum(ly.marginPct), fmtNum(salesDelta), fmtNum(ptsDelta)];
  });
  return rowsToCsv(headers, rows);
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

const ITEM_DIMS: DimDef[] = [
  { key: "sale_date",               label: "Date" },
  { key: "product_code",            label: "Product Code" },
  { key: "product_description",     label: "Description" },
];

const ITEM_METRICS: MetricDef[] = [
  { key: "net_sales_calc",  label: "Net Sales" },
  { key: "qty",             label: "Qty" },
  { key: "cogs_calc",       label: "COGS" },
  { key: "total_tax",       label: "Total Tax" },
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

const MarginPerfExportModal = ({
  onClose,
  storeName,
  subDeptName,
  dateRange,
  tyMargins,
  lyMargins,
  weekOneMargins,
  weekTwoMargins,
  weekThreeMargins,
  weekFourMargins,
  weekOneMarginsLY,
  weekTwoMarginsLY,
  weekThreeMarginsLY,
  weekFourMarginsLY,
}: MarginPerfExportModalProps) => {

  const [mode, setMode] = useState<ModalMode>("presets");
  const [selected, setSelected] = useState<Set<ExportPreset>>(new Set(["items", "week_trend"]));
  const [source, setSource] = useState<CustomSource>("ty");
  const [groupBy, setGroupBy] = useState<Set<string>>(new Set(["product_code", "product_description"]));
  const [metrics, setMetrics] = useState<Map<string, MetricSelection>>(
    new Map([
      ["net_sales_calc", { fn: "sum", enabled: true }],
      ["qty",            { fn: "sum", enabled: false }],
      ["cogs_calc",      { fn: "sum", enabled: false }],
      ["total_tax",      { fn: "sum", enabled: false }],
    ])
  );

  const switchSource = (s: CustomSource) => {
    setSource(s);
    setGroupBy(new Set(["product_code", "product_description"]));
    setMetrics(new Map([
      ["net_sales_calc", { fn: "sum", enabled: true }],
      ["qty",            { fn: "sum", enabled: false }],
      ["cogs_calc",      { fn: "sum", enabled: false }],
      ["total_tax",      { fn: "sum", enabled: false }],
    ]));
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

  // Flatten margins into AggRow, computing derived fields
  const flatRows = useMemo<AggRow[]>(() => {
    const src = source === "ty" ? tyMargins : lyMargins;
    return src.map((m) => ({
      ...m,
      sale_date: m.sale_date.split("T")[0],
      net_sales_calc: netSales(m),
      cogs_calc: itemCogs(m),
    } as AggRow));
  }, [source, tyMargins, lyMargins]);

  const { aggRows, columns } = useMemo(() => {
    const activeDims = ITEM_DIMS.filter((d) => groupBy.has(d.key));
    const activeMetrics = ITEM_METRICS
      .map((m) => ({ ...m, sel: metrics.get(m.key) }))
      .filter((m) => m.sel?.enabled)
      .map((m) => ({ key: m.key, fn: m.sel!.fn, label: m.label }));

    const rows = aggregateRows(
      flatRows,
      activeDims.map((d) => d.key),
      activeMetrics.map((m) => ({ key: m.key, fn: m.fn })),
    );

    const display = rows.map((row) => {
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

    const cols: { key: string; label: string }[] = [
      ...activeDims.map((d) => ({ key: d.key, label: d.label })),
      ...activeMetrics.map((m) => ({ key: `${m.fn}__${m.key}`, label: `${m.fn.charAt(0).toUpperCase() + m.fn.slice(1)} ${m.label}` })),
    ];

    return { aggRows: display, columns: cols };
  }, [flatRows, groupBy, metrics]);

  const presetDatasets: { id: ExportPreset; label: string; description: string }[] = [
    { id: "items",       label: "Items Report",       description: "TY net sales, qty, COGS, and margin % aggregated by item" },
    { id: "items_vs_ly", label: "Items vs Last Year",  description: "Side-by-side TY vs LY per item with margin pts Δ" },
    { id: "cost",        label: "Cost Analysis",       description: "Cost, net cost, case size, and COGS breakdown per item" },
    { id: "nocost",      label: "No Cost Items",       description: "Items flagged for missing cost data" },
    { id: "week_trend",  label: "Week Trend",          description: "4-week TY vs LY net sales and margin comparison" },
  ];

  const safeName = (storeName + "_" + subDeptName).replace(/[^a-z0-9]/gi, "_");

  const handlePresetDownload = () => {
    const sections: string[] = [];
    if (selected.has("items"))       sections.push(`Items Report\n${buildItemsCsv(tyMargins)}`);
    if (selected.has("items_vs_ly")) sections.push(`Items vs Last Year\n${buildItemsVsLyCsv(tyMargins, lyMargins)}`);
    if (selected.has("cost"))        sections.push(`Cost Analysis\n${buildCostCsv(tyMargins)}`);
    if (selected.has("nocost"))      sections.push(`No Cost Items\n${buildNoCostCsv(tyMargins)}`);
    if (selected.has("week_trend"))  sections.push(`Week Trend\n${buildWeekTrendCsv(
      [weekOneMargins, weekTwoMargins, weekThreeMargins, weekFourMargins],
      [weekOneMarginsLY, weekTwoMarginsLY, weekThreeMarginsLY, weekFourMarginsLY],
    )}`);
    if (!sections.length) return;
    downloadCsv(sections.join("\n\n"), `${safeName}_${dateRange.replace(/\s/g, "")}.csv`);
    onClose();
  };

  const handleCustomDownload = () => {
    if (!columns.length || !aggRows.length) return;
    const headers = columns.map((c) => c.label);
    const rows = aggRows.map((r) => columns.map((c) => r[c.key] ?? ""));
    downloadCsv(rowsToCsv(headers, rows), `${safeName}_custom_${dateRange.replace(/\s/g, "")}.csv`);
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
              <p className="text-white/55 text-[10px] mt-0.5">{subDeptName} · {storeName}</p>
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
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-content/45 mb-2">Data Source</p>
                  <div className="flex flex-col gap-1.5">
                    {(["ty", "ly"] as CustomSource[]).map((s) => (
                      <label key={s} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={source === s}
                          onChange={() => switchSource(s)}
                          className="accent-[#1e2a4a] h-3.5 w-3.5"
                        />
                        <span className="text-[12px] text-content">{s === "ty" ? "This Year" : "Last Year"}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-content/45 mb-2">Group By</p>
                  <div className="space-y-1.5">
                    {ITEM_DIMS.map((d) => (
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

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-content/45 mb-2">Metrics</p>
                  <div className="space-y-2">
                    {ITEM_METRICS.map((m) => {
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

            {/* Footer */}
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

export default MarginPerfExportModal;
