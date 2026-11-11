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
import { deptLabel, suggestedAction } from "../utils/figures";
import {
  AGG_OPTIONS,
  buildActionsCsv,
  buildNotSellingCsv,
  buildProductionCsv,
  buildRollupCsv,
  buildSheetCsv,
  buildStoreOrderCsv,
  DIMS,
  DOW,
  METRICS,
  PREVIEW_ROWS,
} from "../utils";

// Interfaces
import type {
  SuggestedItem,
  SuggestedGroupRow,
  SuggestedNotSelling,
  NotSellingItem,
} from "../../../../interfaces";
import type { MetricSelection, ModalMode, PresetId } from "../interfaces";

// Components
import ResizableModalShell from "../../../../components-dev/modals/ResizableModalShell";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";

interface SuggestedExportModalProps {
  onClose: () => void;
  /** Every scale item in the active store, all departments. */
  items: SuggestedItem[];
  /** Just the department on screen, with its column filters applied — what the
   *  buyer is actually looking at, which is what the Order Sheet has to be. */
  sheetItems: SuggestedItem[];
  /** Every store x department row behind the tree. */
  groupRows: SuggestedGroupRow[];
  /** The active store's dead / stopped / declining set, when it was asked for. */
  notSelling: SuggestedNotSelling | null;
  storeLabel: string;
  /** Null when no department is selected — the store overview is open. */
  departmentLabel: string | null;
  coverWindow: { start: string; end: string } | null;
  /** `leadDays + coverDays`, off the response. Every rhythm sentence is argued
   *  against it, so the export has to carry the same figure the screen used. */
  cycleDays: number;
}

/**
 * Presets / Custom CSV export, the shape every other page uses.
 *
 * One preset per view. The panel answers four questions in four places, so the
 * file menu offers the same four rather than making anyone learn a second
 * arrangement: the store's heaviest lines, one department's sheet, the
 * production reading, and what has stopped selling. The rollup behind the tree
 * is the fifth, and the only one that spans stores.
 *
 * Custom is the same group-by + metric-with-aggregate builder as Receivers,
 * Coupons and Sub Dept Margins, running on the store's item rows.
 */
const SuggestedExportModal = ({
  onClose,
  items,
  sheetItems,
  groupRows,
  notSelling,
  storeLabel,
  departmentLabel,
  coverWindow,
  cycleDays,
}: SuggestedExportModalProps) => {
  const [mode, setMode] = useState<ModalMode>("presets");
  const [selected, setSelected] = useState<Set<PresetId>>(new Set(["storeOrder"]));

  const [groupBy, setGroupBy] = useState<Set<string>>(new Set());
  const [metrics, setMetrics] = useState<Map<string, MetricSelection>>(
    new Map([
      ["suggested_weight", { fn: "sum", enabled: false }],
      ["demand_weight", { fn: "sum", enabled: false }],
      ["avg_daily_weight", { fn: "sum", enabled: false }],
      ["sold_weight_window", { fn: "sum", enabled: false }],
      ["shrink_multiplier", { fn: "avg", enabled: false }],
      ["markdown_weight_window", { fn: "sum", enabled: false }],
      ...DOW.map(
        (_, i) =>
          [`dow_${i}`, { fn: "sum", enabled: false }] as [string, MetricSelection],
      ),
      ["on_hand_weight", { fn: "sum", enabled: false }],
      // Averaged, not summed: adding days of cover across items produces a
      // number with no meaning at all.
      ["days_of_cover", { fn: "avg", enabled: false }],
    ]),
  );

  const togglePreset = (id: PresetId) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

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
    () =>
      items.map((i) => {
        // `aggregateRows` walks flat keys, so the seven rates have to be
        // columns here rather than a nested object.
        const dow: Record<string, number> = {};
        for (let d = 0; d < 7; d++) {
          dow[`dow_${d}`] = i.dow_rates?.[String(d)] ?? 0;
        }
        return {
          ...i,
          ...dow,
          sub_department_description: deptLabel(i.sub_department_description),
        } as unknown as AggRow;
      }),
    [items],
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

  const safeName = `${storeLabel} ${departmentLabel}`
    .replace(/[^a-z0-9]/gi, "_")
    .replace(/_+/g, "_");
  const windowLabel = coverWindow
    ? `${coverWindow.start} to ${coverWindow.end}`
    : "";

  /** The active store's departments. Item rows carry their own storeid, so the
   *  scope comes from the data rather than another prop. */
  const activeStoreId = items.length ? items[0].storeid : null;
  const storeDeptRows = groupRows.filter((r) => r.storeid === activeStoreId);

  const handlePresetDownload = () => {
    const sections: string[] = [];
    if (selected.has("storeOrder")) {
      sections.push(
        `Top to Order — ${storeLabel} — all departments${
          windowLabel ? ` — covers ${windowLabel}` : ""
        }\n${buildStoreOrderCsv(items)}`,
      );
    }
    if (selected.has("actions")) {
      sections.push(
        `Suggested Actions — ${storeLabel} — all departments${
          windowLabel ? ` — covers ${windowLabel}` : ""
        }
${buildActionsCsv(items, notSelling, cycleDays)}`,
      );
    }
    if (selected.has("sheet") && departmentLabel) {
      sections.push(
        `Order Sheet — ${storeLabel} — ${departmentLabel}${
          windowLabel ? ` — covers ${windowLabel}` : ""
        }\n${buildSheetCsv(sheetItems)}`,
      );
    }
    if (selected.has("production")) {
      sections.push(
        `Production — ${storeLabel} — average lb by weekday\n${buildProductionCsv(storeDeptRows)}`,
      );
    }
    if (selected.has("notSelling") && notSelling) {
      sections.push(
        `Not Selling — ${storeLabel} — recent ${notSelling.window.recent.days}d vs prior ${notSelling.window.prior.days}d\n${buildNotSellingCsv(notSelling)}`,
      );
    }
    if (selected.has("rollup")) {
      sections.push(
        `Store Rollup${windowLabel ? ` — covers ${windowLabel}` : ""}\n${buildRollupCsv(groupRows)}`,
      );
    }
    if (sections.length === 0) return;
    downloadCsv(sections.join("\n\n"), `${safeName}_order.csv`);
    onClose();
  };

  const handleCustomDownload = () => {
    if (!columns.length || !aggRows.length) return;
    downloadCsv(
      rowsToCsv(
        columns.map((c) => c.label),
        aggRows.map((r) => columns.map((c) => r[c.key] ?? "")),
      ),
      `${safeName}_custom.csv`,
    );
    onClose();
  };

  const canCustomDownload = columns.length > 0 && aggRows.length > 0;

  /** Quoted on the preset card. Built the same way the file is, so the number
   *  the card promises is the number of rows that come out. */
  const actionCount = useMemo(() => {
    const ns = new Map<string, NotSellingItem>();
    for (const r of notSelling?.items ?? []) ns.set(String(r.product_code), r);
    const recentDays = notSelling?.window.recent.days ?? 0;
    return items.filter(
      (i) =>
        suggestedAction(
          i,
          ns.get(String(i.product_code)),
          recentDays,
          cycleDays,
        ) !== null,
    ).length;
  }, [items, notSelling, cycleDays]);

  // Only offer what the current scope can actually fill. A preset that silently
  // exports a header and no rows is worse than one that is not there.
  const PRESETS: { id: PresetId; label: string; description: string }[] = [
    {
      id: "storeOrder",
      label: "Top to Order",
      description: `${items.length.toLocaleString()} items across every department at ${storeLabel}, heaviest first`,
    },
    {
      id: "actions",
      label: "Suggested Actions",
      description: `${actionCount.toLocaleString()} items at ${storeLabel} with something to do about them, worst first, each with its reasoning`,
    },
    ...(departmentLabel
      ? [
          {
            id: "sheet" as PresetId,
            label: "Order Sheet",
            description: `${sheetItems.length.toLocaleString()} items for ${departmentLabel} as filtered on screen, with a totals row`,
          },
        ]
      : []),
    {
      id: "production",
      label: "Production",
      description: `${storeDeptRows.length.toLocaleString()} departments at ${storeLabel}, with the seven weekday rates`,
    },
    ...(notSelling
      ? [
          {
            id: "notSelling" as PresetId,
            label: "Not Selling",
            description: `${notSelling.items.length.toLocaleString()} dead, stopped and declining items, ranked by pounds lost`,
          },
        ]
      : []),
    {
      id: "rollup",
      label: "Store Rollup",
      description: `${groupRows.length.toLocaleString()} store and department rows behind the tree`,
    },
  ];

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:suggested:v1"
      defaultWidth={1140}
      defaultHeight={960}
    >
      {/* Header */}
      <div className="cc-phone-header">
        <div>
          <p className="cc-navy-title text-[13px]">
            Export CSV
          </p>
          <p className="text-custom-white/95 text-[10px] mt-0.5">
            {storeLabel} — {departmentLabel}
            {windowLabel && ` · covers ${windowLabel}`}
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
          className="cc-navy-link justify-self-end"
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
            {PRESETS.map((p) => (
              <label
                key={p.id}
                className="flex items-start gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={selected.has(p.id)}
                  onChange={() => togglePreset(p.id)}
                  className="mt-0.5 cc-checkbox border-line_strong cursor-pointer flex-shrink-0"
                />
                <div>
                  <p className="text-[13px] cc-row-title">
                    {p.label}
                  </p>
                  <p className="text-[11px] text-content/95 mt-0.5">
                    {p.description}
                  </p>
                </div>
              </label>
            ))}
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
            <div className="overflow-y-auto no-scrollbar p-4 space-y-5">
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
                      <span className="text-[12px] text-content">{d.label}</span>
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
                          className={`text-[12px] flex-1 ${
                            sel.enabled ? "text-content" : "text-content/95"
                          }`}
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

              <p className="text-[10px] text-content/95 leading-relaxed">
                Working on {items.length.toLocaleString()} items for{" "}
                {storeLabel} — {departmentLabel}.
              </p>
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-line_hair flex-shrink-0">
                <p className="text-[11px] cc-caps">
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
                            className="px-3 py-2 text-[10px] text-content/95"
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

          <div className="cc-bar-footer">
            <button
              onClick={onClose}
              className="text-[12px] cc-muted-link"
            >
              Cancel
            </button>
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

export default SuggestedExportModal;
