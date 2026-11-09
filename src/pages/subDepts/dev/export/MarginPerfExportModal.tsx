// Hooks
import { useState, useMemo } from "react";

// Utils
import { fmtNum, rowsToCsv, downloadCsv, aggregateRows } from "../../../../utils/csvExport";
import { collectGradedItems } from "../utils/gradedItems";
import {
  fmtDate,
  netSales,
  itemCogs,
  buildItemsCsv,
  buildItemsVsLyCsv,
  buildCostCsv,
  buildNoCostCsv,
  METRIC_LABEL,
  buildAllDeptsCsv,
  buildUpcListCsv,
  ITEM_DIMS,
  ITEM_METRICS,
  AGG_OPTIONS,
  PREVIEW_ROWS,
} from "./utils";

// Interfaces
import type { AggFn, AggRow } from "../../../../utils/csvExport";
import type { ItemSev } from "../utils/gradedItems";
import type {
  CustomSource,
  ExportPreset,
  MarginPerfExportModalProps,
  MetricSelection,
  ModalMode,
} from "./interfaces";

// Components
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import ResizableModalShell from "../../../../components-dev/modals/ResizableModalShell";
import MultiSelectFilter from "../../../../components-dev/filters/MultiSelectFilter";
import SevChips from "./components/SevChips";

/** The Sub Dept Margins export pop-up: pick presets such as Items vs Last Year or UPC List, or build a custom
 *  export by data source, group by, metrics and departments, preview it, then Export CSV. */
const MarginPerfExportModal = ({
  onClose,
  storeName,
  subDeptName,
  dateRange,
  tyMargins,
  lyMargins,
  threshold,
  subDepts,
  grades,
  gradingMetric,
  loadingGrades,
}: MarginPerfExportModalProps) => {

  // No default selections anywhere in this modal.
  const [mode, setMode] = useState<ModalMode>("presets");
  const [selected, setSelected] = useState<Set<ExportPreset>>(new Set());
  const [itemSevs, setItemSevs] = useState<Set<ItemSev>>(new Set());
  // Seeded to Critical because that is what this preset is for — the other two
  // are there to widen it, not to be chosen from scratch.
  const [deptSevs, setDeptSevs] = useState<Set<ItemSev>>(new Set(["critical"]));
  const [upcSevs, setUpcSevs] = useState<Set<ItemSev>>(new Set(["critical"]));
  /**
   * Which departments the two store-wide datasets cover. Empty means all — an
   * untouched filter must never silently empty an export.
   *
   * One selection shared by both, not one each: they emit the same item set and
   * differ only in how many columns survive, so two independent department
   * pickers would be two ways to describe one thing.
   */
  const [deptPick, setDeptPick] = useState<string[]>([]);
  const [source, setSource] = useState<CustomSource>("ty");
  const [groupBy, setGroupBy] = useState<Set<string>>(new Set());
  const [metrics, setMetrics] = useState<Map<string, MetricSelection>>(
    new Map([
      ["net_sales_calc", { fn: "sum", enabled: false }],
      ["qty",            { fn: "sum", enabled: false }],
      ["cogs_calc",      { fn: "sum", enabled: false }],
      ["total_tax",      { fn: "sum", enabled: false }],
    ])
  );

  const switchSource = (s: CustomSource) => {
    setSource(s);
    setGroupBy(new Set());
    setMetrics(new Map([
      ["net_sales_calc", { fn: "sum", enabled: false }],
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

  // Selecting a severity chip activates the "Items vs Last Year" preset (and
  // clearing them all back out deactivates it), so the two stay in sync.
  const toggleItemSev = (sev: ItemSev) =>
    setItemSevs((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });

  // Same two-way tie as the Items vs Last Year chips: clearing every severity
  // is the same statement as unchecking the preset, so they move together.
  const toggleDeptSev = (sev: ItemSev) =>
    setDeptSevs((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });

  const toggleUpcSev = (sev: ItemSev) =>
    setUpcSevs((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });

  const gradedCount = subDepts.filter((s) => grades[s.id]).length;

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
    { id: "items",  label: "Items Report",  description: "TY net sales, qty, COGS, and margin % aggregated by item" },
    { id: "cost",   label: "Cost Analysis", description: "Cost, net cost, case size, and COGS breakdown per item" },
    { id: "nocost", label: "No Cost Items", description: "Items flagged for missing cost data" },
  ];

  const safeName = (storeName + "_" + subDeptName).replace(/[^a-z0-9]/gi, "_");

  const handlePresetDownload = () => {
    const sections: string[] = [];
    if (selected.has("items"))  sections.push(`Items Report\n${buildItemsCsv(tyMargins)}`);
    if (selected.has("cost"))   sections.push(`Cost Analysis\n${buildCostCsv(tyMargins)}`);
    if (selected.has("nocost")) sections.push(`No Cost Items\n${buildNoCostCsv(tyMargins)}`);
    if (selected.has("items_vs_ly") && itemSevs.size > 0) {
      sections.push(`Items vs Last Year\n${buildItemsVsLyCsv(tyMargins, lyMargins, threshold, itemSevs)}`);
    }
    // Narrowing the department list before the collector runs keeps the filter
    // out of the grading logic entirely — it decides scope, not severity.
    const pickedDepts =
      deptPick.length === 0
        ? subDepts
        : subDepts.filter((d) => deptPick.includes(String(d.id)));

    if (selected.has("all_depts") && deptSevs.size > 0) {
      const items = collectGradedItems(pickedDepts, grades, threshold, gradingMetric, deptSevs);
      sections.push(`Graded Items — All Departments\n${buildAllDeptsCsv(items, gradingMetric)}`);
    }
    if (selected.has("upc_list") && upcSevs.size > 0) {
      const items = collectGradedItems(pickedDepts, grades, threshold, gradingMetric, upcSevs);
      // No section title on this one. It is the only preset written to be read
      // back in - by UPC List, Item Actions and Forecasting - and its single
      // `UPC` column header already names it. A title above that header is a
      // second header: the paste box drops it (digits only), but a spreadsheet
      // shows two heading rows and the file stops looking like a list of UPCs.
      sections.push(buildUpcListCsv(items));
    }
    if (!sections.length) return;
    // The store-wide presets aren't about the open department, so a file made
    // only of those shouldn't be named after it.
    const storeWide = new Set<ExportPreset>(["all_depts", "upc_list"]);
    const scopeName = [...selected].every((p) => storeWide.has(p))
      ? storeName.replace(/[^a-z0-9]/gi, "_")
      : safeName;
    downloadCsv(sections.join("\n\n"), `${scopeName}_${dateRange.replace(/\s/g, "")}.csv`);
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
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:sub-margins:v2"
      defaultWidth={1140}
      defaultHeight={960}
    >
        {/* Header */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-brand_navy">
          <div>
            <p className="text-custom-white text-[13px] font-semibold">Export CSV</p>
            <p className="text-custom-white text-[10px] mt-0.5">{subDeptName} · {storeName}</p>
          </div>
          <div className="flex items-center gap-0.5 bg-custom-white/10 rounded-md p-0.5">
            {(["presets", "custom"] as ModalMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  mode === m ? "bg-custom-white text-brand_navy" : "text-custom-white"
                }`}
              >
                {m === "presets" ? "Presets" : "Custom"}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="text-custom-white/95 hover:text-custom-white transition-colors justify-self-end">
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
                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-brand_navy cursor-pointer flex-shrink-0"
                  />
                  <div>
                    <p className="text-[13px] font-medium text-content group-hover:text-brand_navy transition-colors">{label}</p>
                    <p className="text-[11px] text-content mt-0.5">{description}</p>
                  </div>
                </label>
              ))}

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.has("items_vs_ly")}
                  onChange={() => {
                    const checking = !selected.has("items_vs_ly");
                    // Seeds only when nothing is chosen, and never clears on
                    // uncheck — a severity the user picked survives them
                    // toggling the dataset off and back on.
                    if (checking && itemSevs.size === 0) setItemSevs(new Set(["critical", "watch", "healthy"]));
                    setSelected((prev) => { const n = new Set(prev); checking ? n.add("items_vs_ly") : n.delete("items_vs_ly"); return n; });
                  }}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-brand_navy cursor-pointer flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-content">Items vs Last Year</p>
                  <p className="text-[11px] text-content mt-0.5 mb-1.5">Side-by-side TY vs LY per item with margin pts Δ</p>
                  <SevChips
                    value={itemSevs}
                    onToggle={toggleItemSev}
                    hint={selected.has("items_vs_ly") && itemSevs.size === 0}
                  />
                </div>
              </div>

              {/* Scope for both store-wide datasets below. Sits above them
                  rather than inside either, because it governs the pair. */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <span className="text-[11px] text-content">Departments</span>
                <MultiSelectFilter
                  options={subDepts.map((d) => ({
                    label: d.desc,
                    value: String(d.id),
                  }))}
                  values={deptPick}
                  onChange={setDeptPick}
                  placeholder="All departments"
                  noun="departments"
                  className="w-[220px]"
                />
                <span className="text-[10px] text-content">
                  Applies to both datasets below.
                </span>
              </div>

              {/* The only presets that aren't scoped to the open department.
                  Cost nothing extra — grading already holds every department's
                  item rows. */}
              <div className="flex items-start gap-3 pt-3 border-t border-gray-100">
                <input
                  type="checkbox"
                  checked={selected.has("all_depts")}
                  onChange={() => {
                    const checking = !selected.has("all_depts");
                    // Seeds only when nothing is chosen, and never clears on
                    // uncheck — a severity the user picked survives them
                    // toggling the dataset off and back on.
                    if (checking && deptSevs.size === 0) setDeptSevs(new Set(["critical"]));
                    setSelected((prev) => { const n = new Set(prev); checking ? n.add("all_depts") : n.delete("all_depts"); return n; });
                  }}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-brand_navy cursor-pointer flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-content">Graded Items — All Departments</p>
                  <p className="text-[11px] text-content mt-0.5 mb-1.5">
                    Every graded UPC in the store, tagged with its department and
                    severity. Graded on {METRIC_LABEL[gradingMetric]} at a{" "}
                    {threshold} threshold — the same as the items list.
                  </p>
                  <SevChips
                    value={deptSevs}
                    onToggle={toggleDeptSev}
                    hint={selected.has("all_depts") && deptSevs.size === 0}
                  />
                  {/* Departments grade in one at a time, so an export taken
                      early would silently be a partial store. */}
                  <p className="text-[10px] text-content mt-1.5">
                    {loadingGrades
                      ? `Still grading — ${gradedCount} of ${subDepts.length} departments ready`
                      : `${gradedCount} of ${subDepts.length} departments`}
                  </p>
                </div>
              </div>

              {/* The same item set with every column but the UPC dropped —
                  a list to feed another page, not a report to read. Its own
                  severities, so it doesn't have to ride along with the full
                  export to be taken. */}
              <div className="flex items-start gap-3 pt-3 border-t border-gray-100">
                <input
                  type="checkbox"
                  checked={selected.has("upc_list")}
                  onChange={() => {
                    const checking = !selected.has("upc_list");
                    // Seeds only when nothing is chosen, and never clears on
                    // uncheck — a severity the user picked survives them
                    // toggling the dataset off and back on.
                    if (checking && upcSevs.size === 0) setUpcSevs(new Set(["critical"]));
                    setSelected((prev) => { const n = new Set(prev); checking ? n.add("upc_list") : n.delete("upc_list"); return n; });
                  }}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-brand_navy cursor-pointer flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-content">UPC List</p>
                  <p className="text-[11px] text-content mt-0.5 mb-1.5">
                    Just the UPCs from every department, one per row, ready to
                    load into another page.
                  </p>
                  <SevChips
                    value={upcSevs}
                    onToggle={toggleUpcSev}
                    hint={selected.has("upc_list") && upcSevs.size === 0}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-2">
              <button onClick={onClose} className="text-[12px] text-content transition-colors">Cancel</button>
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
            <div className="grid grid-cols-[200px_1fr] divide-x divide-gray-100 min-h-[360px] max-h-[calc(100vh-220px)]">
              {/* Left: config */}
              <div className="overflow-y-auto no-scrollbar p-4 space-y-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-content mb-2">Data Source</p>
                  <div className="flex flex-col gap-1.5">
                    {(["ty", "ly"] as CustomSource[]).map((s) => (
                      <label key={s} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={source === s}
                          onChange={() => switchSource(s)}
                          className="accent-brand_navy h-3.5 w-3.5"
                        />
                        <span className="text-[12px] text-content">{s === "ty" ? "This Year" : "Last Year"}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-content mb-2">Group By</p>
                  <div className="space-y-1.5">
                    {ITEM_DIMS.map((d) => (
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
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-content mb-2">Metrics</p>
                  <div className="space-y-2">
                    {ITEM_METRICS.map((m) => {
                      const sel = metrics.get(m.key)!;
                      return (
                        <div key={m.key} className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={sel.enabled}
                            onChange={() => toggleMetric(m.key)}
                            className="accent-brand_navy h-3.5 w-3.5 rounded flex-shrink-0"
                          />
                          <span className="text-[12px] flex-1 text-content">{m.label}</span>
                          <select
                            value={sel.fn}
                            disabled={!sel.enabled}
                            onChange={(e) => setMetricFn(m.key, e.target.value as AggFn)}
                            className="text-[10px] border border-gray-200 rounded px-1 py-0.5 text-content disabled:opacity-30 bg-custom-white outline-none"
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
                          <tr key={i} className={i % 2 === 0 ? "bg-custom-white" : "bg-gray-50/50"}>
                            {columns.map((c) => (
                              <td key={c.key} className="px-3 py-1.5 text-content whitespace-nowrap border-b border-gray-50">
                                {row[c.key] ?? "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                        {aggRows.length > PREVIEW_ROWS && (
                          <tr>
                            <td colSpan={columns.length} className="px-3 py-2 text-[10px] text-content">
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

export default MarginPerfExportModal;
