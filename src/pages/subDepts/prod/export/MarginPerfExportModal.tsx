// Hooks
import { useMarginPerfExport } from "./hooks";

// Utils
import {
  METRIC_LABEL,
  ITEM_DIMS,
  ITEM_METRICS,
  AGG_OPTIONS,
  PREVIEW_ROWS,
} from "./utils";

// Interfaces
import type { AggFn } from "../../../../utils/csvExport";
import type {
  CustomSource,
  MarginPerfExportModalProps,
  ModalMode,
} from "./interfaces";

// Components
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import ResizableModalShell from "../../../../components/modals/ResizableModalShell";
import MultiSelectFilter from "../../../../components/filters/MultiSelectFilter";
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
  const {
    switchSource,
    toggleGroupBy,
    toggleMetric,
    toggleItemSev,
    toggleDeptSev,
    toggleUpcSev,
    gradedCount,
    setMetricFn,
    presetDatasets,
    handlePresetDownload,
    handleCustomDownload,
    canCustomDownload,
    mode,
    setMode,
    selected,
    setSelected,
    itemSevs,
    setItemSevs,
    deptSevs,
    setDeptSevs,
    upcSevs,
    setUpcSevs,
    deptPick,
    setDeptPick,
    source,
    groupBy,
    metrics,
    aggRows,
    columns,
  } = useMarginPerfExport({
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
  });

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:sub-margins:v2"
      defaultWidth={1140}
      defaultHeight={960}
    >
      {/* Header */}
      <div className="cc-phone-header">
        <div>
          <p className="cc-navy-title text-[13px]">Export CSV</p>
          <p className="text-custom-white text-[10px] mt-0.5">
            {subDeptName} · {storeName}
          </p>
        </div>
        <div className="cc-segment-navy">
          {(["presets", "custom"] as ModalMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`cc-chip-btn text-[11px] ${
                mode === m
                  ? "bg-custom-white text-brand_navy"
                  : "text-custom-white"
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
            <p className="text-[11px] text-content uppercase tracking-wide font-medium">
              Select data to include
            </p>
            {presetDatasets.map(({ id, label, description }) => (
              <label
                key={id}
                className="flex items-start gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={selected.has(id)}
                  onChange={() =>
                    setSelected((prev) => {
                      const n = new Set(prev);
                      n.has(id) ? n.delete(id) : n.add(id);
                      return n;
                    })
                  }
                  className="mt-0.5 cc-checkbox border-line_strong cursor-pointer flex-shrink-0"
                />
                <div>
                  <p className="text-[13px] cc-row-title">{label}</p>
                  <p className="text-[11px] text-content mt-0.5">
                    {description}
                  </p>
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
                  if (checking && itemSevs.size === 0)
                    setItemSevs(new Set(["critical", "watch", "healthy"]));
                  setSelected((prev) => {
                    const n = new Set(prev);
                    checking ? n.add("items_vs_ly") : n.delete("items_vs_ly");
                    return n;
                  });
                }}
                className="mt-0.5 cc-checkbox border-line_strong cursor-pointer flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-content">
                  Items vs Last Year
                </p>
                <p className="text-[11px] text-content mt-0.5 mb-1.5">
                  Side-by-side TY vs LY per item with margin pts Δ
                </p>
                <SevChips
                  value={itemSevs}
                  onToggle={toggleItemSev}
                  hint={selected.has("items_vs_ly") && itemSevs.size === 0}
                />
              </div>
            </div>

            {/* Scope for both store-wide datasets below. Sits above them
                  rather than inside either, because it governs the pair. */}
            <div className="flex items-center gap-2 pt-3 border-t border-line_hair">
              <span className="text-[11px] text-content">Departments</span>
              <MultiSelectFilter
                options={subDepts.map((d) => ({
                  label: d.desc,
                  value: d.key,
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
            <div className="flex items-start gap-3 pt-3 border-t border-line_hair">
              <input
                type="checkbox"
                checked={selected.has("all_depts")}
                onChange={() => {
                  const checking = !selected.has("all_depts");
                  // Seeds only when nothing is chosen, and never clears on
                  // uncheck — a severity the user picked survives them
                  // toggling the dataset off and back on.
                  if (checking && deptSevs.size === 0)
                    setDeptSevs(new Set(["critical"]));
                  setSelected((prev) => {
                    const n = new Set(prev);
                    checking ? n.add("all_depts") : n.delete("all_depts");
                    return n;
                  });
                }}
                className="mt-0.5 cc-checkbox border-line_strong cursor-pointer flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-content">
                  Graded Items — All Departments
                </p>
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
            <div className="flex items-start gap-3 pt-3 border-t border-line_hair">
              <input
                type="checkbox"
                checked={selected.has("upc_list")}
                onChange={() => {
                  const checking = !selected.has("upc_list");
                  // Seeds only when nothing is chosen, and never clears on
                  // uncheck — a severity the user picked survives them
                  // toggling the dataset off and back on.
                  if (checking && upcSevs.size === 0)
                    setUpcSevs(new Set(["critical"]));
                  setSelected((prev) => {
                    const n = new Set(prev);
                    checking ? n.add("upc_list") : n.delete("upc_list");
                    return n;
                  });
                }}
                className="mt-0.5 cc-checkbox border-line_strong cursor-pointer flex-shrink-0"
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
          <div className="cc-bar-footer mt-2">
            <button
              onClick={onClose}
              className="text-[12px] text-content transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePresetDownload}
              disabled={selected.size === 0}
              className="flex items-center gap-1.5 cc-btn-primary text-[12px]"
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
                <p className="text-[10px] font-semibold uppercase tracking-wide text-content mb-2">
                  Data Source
                </p>
                <div className="flex flex-col gap-1.5">
                  {(["ty", "ly"] as CustomSource[]).map((s) => (
                    <label
                      key={s}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        checked={source === s}
                        onChange={() => switchSource(s)}
                        className="accent-brand_navy h-3.5 w-3.5"
                      />
                      <span className="text-[12px] text-content">
                        {s === "ty" ? "This Year" : "Last Year"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-content mb-2">
                  Group By
                </p>
                <div className="space-y-1.5">
                  {ITEM_DIMS.map((d) => (
                    <label
                      key={d.key}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={groupBy.has(d.key)}
                        onChange={() => toggleGroupBy(d.key)}
                        className="cc-checkbox flex-shrink-0"
                      />
                      <span className="text-[12px] text-content">
                        {d.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-content mb-2">
                  Metrics
                </p>
                <div className="space-y-2">
                  {ITEM_METRICS.map((m) => {
                    const sel = metrics.get(m.key)!;
                    return (
                      <div key={m.key} className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={sel.enabled}
                          onChange={() => toggleMetric(m.key)}
                          className="cc-checkbox flex-shrink-0"
                        />
                        <span className="text-[12px] flex-1 text-content">
                          {m.label}
                        </span>
                        <select
                          value={sel.fn}
                          disabled={!sel.enabled}
                          onChange={(e) =>
                            setMetricFn(m.key, e.target.value as AggFn)
                          }
                          className="text-[10px] cc-field-sm disabled:opacity-30"
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
              <div className="cc-bar-header flex-shrink-0">
                <p className="text-[11px] font-semibold text-content uppercase tracking-wide">
                  Preview
                </p>
                <span className="text-[10px] text-content">
                  {aggRows.length === 0
                    ? "No data — select at least one group or metric"
                    : `Showing ${Math.min(PREVIEW_ROWS, aggRows.length)} of ${aggRows.length} rows`}
                </span>
              </div>

              {columns.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-6 text-center">
                  <p className="text-[12px] text-content leading-relaxed">
                    Select at least one group-by dimension
                    <br />
                    or metric to see a preview.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-auto thin-scrollbar">
                  <table className="min-w-full text-[11px] border-collapse">
                    <thead className="sticky top-0 bg-fill_soft z-10">
                      <tr>
                        {columns.map((c) => (
                          <th key={c.key} className="cc-th text-content">
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
                            i % 2 === 0 ? "bg-custom-white" : "bg-fill_soft/50"
                          }
                        >
                          {columns.map((c) => (
                            <td key={c.key} className="cc-td text-content">
                              {row[c.key] ?? "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {aggRows.length > PREVIEW_ROWS && (
                        <tr>
                          <td
                            colSpan={columns.length}
                            className="px-3 py-2 text-[10px] text-content"
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

          {/* Footer */}
          <div className="cc-bar-footer">
            <button
              onClick={onClose}
              className="text-[12px] text-content transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCustomDownload}
              disabled={!canCustomDownload}
              className="flex items-center gap-1.5 cc-btn-primary text-[12px]"
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
