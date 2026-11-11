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
  buildPresetCsv,
  DIMS,
  METRICS,
  AGG_OPTIONS,
} from "../utils";
import { PREVIEW_ROWS } from "./utils";

// Interfaces
import type { MetricSelection, ModalMode } from "../interfaces";
import type { CouponItem } from "../../../../interfaces";

// Components
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import ResizableModalShell from "../../../../components-dev/modals/ResizableModalShell";

interface CouponsExportModalProps {
  onClose: () => void;
  title: string;
  subtitle: string;
  rows: CouponItem[];
}

/** The Coupons CSV export pop-up. Presets downloads the coupon records as they are; Custom groups by chosen fields
 *  with sum/count metrics and a live preview. Multi-store data adds a store checklist. */
const CouponsExportModal = ({
  onClose,
  title,
  subtitle,
  rows,
}: CouponsExportModalProps) => {
  const [mode, setMode] = useState<ModalMode>("presets");

  // No default selections
  const [groupBy, setGroupBy] = useState<Set<string>>(new Set());
  const [metrics, setMetrics] = useState<Map<string, MetricSelection>>(
    new Map([
      ["coupon_amount", { fn: "sum", enabled: false }],
      ["qty", { fn: "sum", enabled: false }],
    ]),
  );

  // Unique stores derived from rows
  const uniqueStores = useMemo(() => {
    const map = new Map<string, { name: string; number: string }>();
    rows.forEach((r) => {
      if (!map.has(r.store_number))
        map.set(r.store_number, {
          name: r.store_name ?? r.store_number,
          number: r.store_number,
        });
    });
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [rows]);

  const isMultiStore = uniqueStores.length > 1;

  // Selected stores — no default selections
  const [selectedStores, setSelectedStores] = useState<Set<string>>(
    () => new Set(),
  );

  const toggleStore = (num: string) =>
    setSelectedStores((prev) => {
      const n = new Set(prev);
      n.has(num) ? n.delete(num) : n.add(num);
      return n;
    });

  const allSelected = selectedStores.size === uniqueStores.length;
  const noneSelected = selectedStores.size === 0;

  // Rows filtered by selected stores
  const filteredRows = useMemo(
    () =>
      isMultiStore
        ? rows.filter((r) => selectedStores.has(r.store_number))
        : rows,
    [rows, selectedStores, isMultiStore],
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
    () => filteredRows.map((r) => ({ ...r }) as unknown as AggRow),
    [filteredRows],
  );

  const { aggRows, columns } = useMemo(() => {
    const activeDims = DIMS.filter((d) => groupBy.has(d.key));
    const activeMetrics = METRICS.map((m) => ({
      ...m,
      sel: metrics.get(m.key),
    }))
      .filter((m) => m.sel?.enabled)
      .map((m) => ({ key: m.key, fn: m.sel!.fn, label: m.label }));

    const agg = aggregateRows(
      flatRows,
      activeDims.map((d) => d.key),
      activeMetrics.map((m) => ({ key: m.key, fn: m.fn })),
    );

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
      ...activeMetrics.map((m) => ({
        key: `${m.fn}__${m.key}`,
        label: `${m.fn.charAt(0).toUpperCase() + m.fn.slice(1)} ${m.label}`,
      })),
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
        <p className="text-[10px] cc-caps">
          Stores
        </p>
        <div className="flex gap-1.5">
          <button
            onClick={() =>
              setSelectedStores(new Set(uniqueStores.map((s) => s.number)))
            }
            disabled={allSelected}
            className="text-[9px] text-brand_navy/95 hover:text-brand_navy disabled:opacity-30 transition-colors"
          >
            All
          </button>
          <span className="text-[9px] text-content/95">·</span>
          <button
            onClick={() => setSelectedStores(new Set())}
            disabled={noneSelected}
            className="text-[9px] text-brand_navy/95 hover:text-brand_navy disabled:opacity-30 transition-colors"
          >
            None
          </button>
        </div>
      </div>
      <div className="space-y-1.5 max-h-36 overflow-y-auto thin-scrollbar pr-1">
        {uniqueStores.map((s) => (
          <label
            key={s.number}
            className="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedStores.has(s.number)}
              onChange={() => toggleStore(s.number)}
              className="cc-checkbox flex-shrink-0"
            />
            <span className="text-[12px] text-content truncate">{s.name}</span>
            <span className="text-[10px] text-content/95 flex-shrink-0">
              #{s.number}
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:coupons:v2"
      defaultWidth={1140}
      defaultHeight={960}
    >
        {/* Header */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-brand_navy">
          <div>
            <p className="cc-navy-title text-[13px]">
              Export CSV
            </p>
            <p className="text-custom-white/95 text-[10px] mt-0.5">
              {subtitle}
            </p>
          </div>
          <div className="flex items-center gap-0.5 bg-custom-white/10 rounded-md p-0.5">
            {(["presets", "custom"] as ModalMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${mode === m ? "bg-custom-white text-brand_navy" : "text-custom-white/95 hover:text-custom-white"}`}
              >
                {m === "presets" ? "Presets" : "Custom"}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="cc-navy-link justify-self-end"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* PRESETS */}
        {mode === "presets" && (
          <>
            <div className="px-4 pt-4 pb-2 space-y-4">
              {isMultiStore && <StoreFilter />}
              <div>
                {!isMultiStore && (
                  <p className="text-[11px] text-content/95 uppercase tracking-wide font-medium mb-3">
                    Select data to include
                  </p>
                )}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked
                    readOnly
                    className="mt-0.5 cc-checkbox border-line_strong flex-shrink-0"
                  />
                  <div>
                    <p className="text-[13px] font-medium text-content group-hover:text-brand_navy transition-colors">
                      Coupon Records
                    </p>
                    <p className="text-[11px] text-content/95 mt-0.5">
                      {filteredRows.length} rows
                      {isMultiStore && selectedStores.size < uniqueStores.length
                        ? ` · ${selectedStores.size} of ${uniqueStores.length} stores`
                        : ""}
                      {" · "}
                      {title}
                    </p>
                  </div>
                </label>
              </div>
            </div>
            <div className="cc-bar-footer mt-2">
              <button
                onClick={onClose}
                className="text-[12px] cc-muted-link"
              >
                Cancel
              </button>
              <button
                onClick={handlePresetDownload}
                disabled={filteredRows.length === 0}
                className="flex items-center gap-1.5 cc-btn-primary hover:bg-brand_navy/85 text-[12px]"
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
            <div className="grid grid-cols-[220px_1fr] divide-x divide-line_hair min-h-[360px] max-h-[calc(100vh-220px)]">
              {/* Config */}
              <div className="overflow-y-auto no-scrollbar p-4 space-y-5">
                {isMultiStore && <StoreFilter />}
                <div>
                  <p className="text-[10px] cc-caps mb-2">
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
                  <p className="text-[10px] cc-caps mb-2">
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
                            className="cc-checkbox flex-shrink-0"
                          />
                          <span
                            className={`text-[12px] flex-1 ${sel.enabled ? "text-content" : "text-content/95"}`}
                          >
                            {m.label}
                          </span>
                          <select
                            value={sel.fn}
                            disabled={!sel.enabled}
                            onChange={(e) =>
                              setMetricFn(m.key, e.target.value as AggFn)
                            }
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
                <p className="text-[10px] text-content/95 italic leading-relaxed">
                  {filteredRows.length} rows
                  {isMultiStore && selectedStores.size < uniqueStores.length
                    ? ` · ${selectedStores.size}/${uniqueStores.length} stores`
                    : ""}
                </p>
              </div>

              {/* Preview */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-line_hair flex-shrink-0">
                  <p className="text-[11px] cc-caps">
                    Preview
                  </p>
                  <span className="text-[10px] text-content/95">
                    {aggRows.length === 0
                      ? "No data"
                      : `Showing ${Math.min(PREVIEW_ROWS, aggRows.length)} of ${aggRows.length} rows`}
                  </span>
                </div>
                {columns.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center p-6 text-center">
                    <p className="text-[12px] text-content/95 leading-relaxed">
                      Select at least one group-by
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
                          <tr
                            key={i}
                            className={
                              i % 2 === 0 ? "bg-custom-white" : "bg-fill_soft/50"
                            }
                          >
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
                        {aggRows.length > PREVIEW_ROWS && (
                          <tr>
                            <td
                              colSpan={columns.length}
                              className="px-3 py-2 text-[10px] text-content/95 italic"
                            >
                              + {aggRows.length - PREVIEW_ROWS} more rows…
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
              <button
                onClick={onClose}
                className="text-[12px] cc-muted-link"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomDownload}
                disabled={!columns.length || !aggRows.length}
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

export default CouponsExportModal;
