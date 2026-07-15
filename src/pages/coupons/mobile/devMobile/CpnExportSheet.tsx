import { useState, useMemo } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import BottomSheet from "../../../../components/BottomSheet";
import type { CouponItem } from "../../../../interfaces";
import { fmtNum, rowsToCsv, downloadCsv, aggregateRows } from "../../../../utils/csvExport";
import type { AggFn, AggRow } from "../../../../utils/csvExport";
import { DIMS, METRICS, AGG_OPTIONS, buildPresetCsv } from "../../couponsExportShared";

interface CpnExportSheetProps {
  onClose: () => void;
  title: string;
  subtitle: string;
  rows: CouponItem[];
}

type ModalMode = "presets" | "custom";

interface MetricSelection {
  fn: AggFn;
  enabled: boolean;
}

const CpnExportSheet = ({ onClose, title, subtitle, rows }: CpnExportSheetProps) => {
  const [mode, setMode] = useState<ModalMode>("presets");
  const [groupBy, setGroupBy] = useState<Set<string>>(new Set());
  const [metrics, setMetrics] = useState<Map<string, MetricSelection>>(
    new Map([
      ["coupon_amount", { fn: "sum", enabled: false }],
      ["qty", { fn: "sum", enabled: false }],
    ]),
  );

  // Unique stores derived from rows — same shape as desktop's CouponsExportModal
  const uniqueStores = useMemo(() => {
    const map = new Map<string, { name: string; number: string }>();
    rows.forEach((r) => {
      if (!map.has(r.store_number)) map.set(r.store_number, { name: r.store_name ?? r.store_number, number: r.store_number });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const isMultiStore = uniqueStores.length > 1;

  const [selectedStores, setSelectedStores] = useState<Set<string>>(() => new Set());

  const toggleStore = (num: string) =>
    setSelectedStores((prev) => {
      const n = new Set(prev);
      n.has(num) ? n.delete(num) : n.add(num);
      return n;
    });

  const allSelected = selectedStores.size === uniqueStores.length;
  const noneSelected = selectedStores.size === 0;

  const filteredRows = useMemo(
    () => (isMultiStore ? rows.filter((r) => selectedStores.has(r.store_number)) : rows),
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

  const flatRows = useMemo<AggRow[]>(() => filteredRows.map((r) => ({ ...r }) as unknown as AggRow), [filteredRows]);

  const { aggRows, columns } = useMemo(() => {
    const activeDims = DIMS.filter((d) => groupBy.has(d.key));
    const activeMetrics = METRICS
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
        <div className="text-[10px] font-semibold uppercase tracking-wide text-content/85">Stores</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedStores(new Set(uniqueStores.map((s) => s.number)))}
            disabled={allSelected}
            className="text-[10px] text-[#1e2a4a] disabled:text-content/40 transition-colors"
          >
            All
          </button>
          <span className="text-[10px] text-content/40">·</span>
          <button
            onClick={() => setSelectedStores(new Set())}
            disabled={noneSelected}
            className="text-[10px] text-[#1e2a4a] disabled:text-content/40 transition-colors"
          >
            None
          </button>
        </div>
      </div>
      <div className="space-y-2.5 max-h-36 overflow-y-auto thin-scrollbar pr-1">
        {uniqueStores.map((s) => (
          <label key={s.number} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedStores.has(s.number)}
              onChange={() => toggleStore(s.number)}
              className="accent-[#1e2a4a] h-3.5 w-3.5 rounded flex-shrink-0"
            />
            <span className="text-[12px] text-content truncate flex-1">{s.name}</span>
            <span className="text-[10px] text-content/85 flex-shrink-0">#{s.number}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <BottomSheet onClose={onClose}>
      <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100">
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-content">Export CSV</div>
          <div className="text-[10px] text-content/85 mt-0.5 truncate">{subtitle}</div>
        </div>
        <div className="flex items-center gap-0.5 bg-content/5 rounded-md p-0.5 flex-shrink-0">
          {(["presets", "custom"] as ModalMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                mode === m ? "bg-[#1e2a4a] text-custom-white" : "text-content/85"
              }`}
            >
              {m === "presets" ? "Presets" : "Custom"}
            </button>
          ))}
        </div>
      </div>

      {mode === "presets" ? (
        <div className="px-4 py-4 space-y-4 max-h-[50vh] overflow-y-auto thin-scrollbar">
          {isMultiStore && <StoreFilter />}
          <div className="flex items-start gap-3">
            <input type="checkbox" checked readOnly className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#1e2a4a] flex-shrink-0" />
            <div>
              <div className="text-[13px] font-medium text-content">Coupon Records</div>
              <div className="text-[11px] text-content/85 mt-0.5">
                {filteredRows.length} rows
                {isMultiStore && selectedStores.size < uniqueStores.length ? ` · ${selectedStores.size} of ${uniqueStores.length} stores` : ""}
                {" · "}{title}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 py-4 space-y-5 max-h-[50vh] overflow-y-auto thin-scrollbar">
          {isMultiStore && <StoreFilter />}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-content/85 mb-2">Group By</div>
            <div className="space-y-2">
              {DIMS.map((d) => (
                <label key={d.key} className="flex items-center gap-2">
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
            <div className="text-[10px] font-semibold uppercase tracking-wide text-content/85 mb-2">Metrics</div>
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
                    <span className={`text-[12px] flex-1 ${sel.enabled ? "text-content" : "text-content/85"}`}>{m.label}</span>
                    <select
                      value={sel.fn}
                      disabled={!sel.enabled}
                      onChange={(e) => setMetricFn(m.key, e.target.value as AggFn)}
                      className="text-[10px] border border-gray-200 rounded px-1 py-1 text-content disabled:opacity-40 bg-custom-white outline-none"
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
          <div className="text-[10px] text-content/85">
            {columns.length === 0
              ? "Select at least one group-by or metric"
              : `${aggRows.length} row${aggRows.length === 1 ? "" : "s"} will be exported`}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <button onClick={onClose} className="text-[12px] text-content/85">
          Cancel
        </button>
        <button
          onClick={mode === "presets" ? handlePresetDownload : handleCustomDownload}
          disabled={mode === "presets" ? filteredRows.length === 0 : !columns.length || !aggRows.length}
          className="flex items-center gap-1.5 bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
        >
          <ArrowDownTrayIcon className="w-3.5 h-3.5" />
          Download CSV
        </button>
      </div>
      <div className="h-4 flex-shrink-0" />
    </BottomSheet>
  );
};

export default CpnExportSheet;
