import { useMemo, useState } from "react";
import ResizableModalShell from "../../../components/modals/ResizableModalShell";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import {
  setCouponExportOpen,
  COUPON_THRESHOLD_DEFAULT,
} from "../../../features/couponSalesSlice";
import {
  aggregateRows,
  downloadCsv,
  fmtNum,
  rowsToCsv,
  type AggFn,
  type AggRow,
} from "../../../utils/csvExport";
import { AGG_OPTIONS } from "../../coupons/couponsExportShared";
import {
  buildCouponPresetCsv,
  PRESET_OPTIONS,
  CPN_SALES_DIMS,
  CPN_SALES_METRICS,
  type CouponPreset,
} from "../shared/couponSalesExport";
import type { CouponItem } from "../../../interfaces";
import { couponValueOf, usesFallbackValue } from "../shared/couponGrading";

interface Props {
  /** Coupons for the selected store. The whole-search set is offered too —
   *  the store list is graded across every store, so an export limited to one
   *  of them wouldn't reproduce what the left panel shows. */
  storeCoupons: CouponItem[];
}

type Mode = "presets" | "custom";
type Scope = "store" | "all";

const CpnSalesExportModal = ({ storeCoupons }: Props) => {
  const dispatch = useAppDispatch();
  const allCoupons = useAppSelector((s) => s.couponSales.coupons);
  const rawThreshold = useAppSelector((s) => s.couponSales.threshold);
  const assignedStores = useAppSelector((s) => s.user.assignedStores);
  const groupStores = useAppSelector((s) => s.user.selectedGroupStores);
  const threshold = rawThreshold ?? COUPON_THRESHOLD_DEFAULT;

  const [mode, setMode] = useState<Mode>("presets");
  const [scope, setScope] = useState<Scope>("store");
  const [presets, setPresets] = useState<Set<CouponPreset>>(new Set(["stores"]));
  const [groupBy, setGroupBy] = useState<Set<string>>(new Set());
  const [metrics, setMetrics] = useState<Map<string, { fn: AggFn; enabled: boolean }>>(
    new Map([
      ["coupon_amount", { fn: "sum", enabled: true }],
      ["qty", { fn: "sum", enabled: false }],
      ["total_sales", { fn: "sum", enabled: false }],
    ]),
  );

  const source = scope === "all" ? allCoupons : storeCoupons;

  const close = () => dispatch(setCouponExportOpen(false));

  // Two normalisations before the generic aggregator sees the rows:
  //   sale_date carries a time component the grouping shouldn't split on, and
  //   coupon_amount can be null with the real figure in store_coupon /
  //   vendor_coupon. That fallback is transaction-level and repeated on every
  //   line, so it is written onto the first line of each sale and zeroed on
  //   the rest — otherwise summing the column in a spreadsheet multiplies it
  //   by the basket size.
  const aggSource: AggRow[] = useMemo(() => {
    const seenSales = new Set<number>();
    return source.map((c) => {
      let amount = couponValueOf(c);
      if (usesFallbackValue(c)) {
        if (seenSales.has(c.sale_id)) amount = 0;
        else seenSales.add(c.sale_id);
      }
      return {
        ...c,
        coupon_amount: amount,
        sale_date_only: c.sale_date.split("T")[0],
      };
    }) as unknown as AggRow[];
  }, [source]);

  const activeMetrics = useMemo(
    () =>
      [...metrics.entries()]
        .filter(([, m]) => m.enabled)
        .map(([key, m]) => ({ key, fn: m.fn })),
    [metrics],
  );

  // Live preview — the same rows the download will contain.
  const PREVIEW_ROWS = 12;

  const previewColumns = useMemo(
    () => [
      ...[...groupBy].map((d) => ({
        key: d,
        label: CPN_SALES_DIMS.find((x) => x.key === d)?.label ?? d,
      })),
      ...activeMetrics.map((m) => ({
        key: `${m.fn}__${m.key}`,
        label: `${m.fn.toUpperCase()} ${CPN_SALES_METRICS.find((x) => x.key === m.key)?.label ?? m.key}`,
      })),
    ],
    [groupBy, activeMetrics],
  );

  const previewRows = useMemo(() => {
    if (!groupBy.size && !activeMetrics.length) return [];
    return aggregateRows(aggSource, [...groupBy], activeMetrics);
  }, [aggSource, groupBy, activeMetrics]);

  const customCsv = () => {
    const dims = [...groupBy];
    const rows = aggregateRows(aggSource, dims, activeMetrics);
    const headers = [
      ...dims.map((d) => CPN_SALES_DIMS.find((x) => x.key === d)?.label ?? d),
      ...activeMetrics.map(
        (m) =>
          `${CPN_SALES_METRICS.find((x) => x.key === m.key)?.label ?? m.key} (${m.fn})`,
      ),
    ];
    const data = rows.map((r) => [
      ...dims.map((d) => r[d] ?? ""),
      ...activeMetrics.map((m) => {
        // aggregateRows emits `${fn}__${key}`, not the bare key — reading the
        // bare key left every metric column blank in the download.
        const v = r[`${m.fn}__${m.key}`];
        return typeof v === "number" ? fmtNum(v) : (v ?? "");
      }),
    ]);
    return rowsToCsv(headers, data);
  };

  const togglePreset = (key: CouponPreset) =>
    setPresets((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const handleExport = () => {
    const scopeTag = scope === "all" ? "all-stores" : "store";
    // Several presets concatenate into one labelled file, the way Sales
    // stacks its selected datasets — one download, not one per checkbox.
    const csv =
      mode === "presets"
        ? PRESET_OPTIONS.filter((p) => presets.has(p.key))
            .map(
              (p) =>
                `${p.label}\n${buildCouponPresetCsv(p.key, source, threshold, assignedStores, groupStores)}`,
            )
            .join("\n\n")
        : customCsv();
    const name =
      mode === "presets"
        ? `coupon-sales-${scopeTag}.csv`
        : `coupon-sales-custom-${scopeTag}.csv`;
    downloadCsv(csv, name);
    close();
  };

  const toggleDim = (key: string) =>
    setGroupBy((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const canExport =
    mode === "presets"
      ? presets.size > 0
      : groupBy.size > 0 || activeMetrics.length > 0;

  return (
    <ResizableModalShell
      onClose={close}
      storageKey="export-modal:coupon-sales"
      defaultWidth={760}
      defaultHeight={640}
      closeOnBackdrop={false}
    >
        {/* Header */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-[#1e2a4a]">
          <div>
            <p className="text-custom-white text-[13px] font-semibold">Export CSV</p>
            <p className="text-custom-white text-[10px] mt-0.5">
              {scope === "all" ? "All stores in search" : "Selected store"}
            </p>
          </div>
          {/* Mode tabs */}
          <div className="flex items-center gap-0.5 bg-custom-white/10 rounded-md p-0.5">
            {(["presets", "custom"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  mode === m ? "bg-custom-white text-[#1e2a4a]" : "text-custom-white"
                }`}
              >
                {m === "presets" ? "Presets" : "Custom"}
              </button>
            ))}
          </div>
          <button
            onClick={close}
            aria-label="Close"
            className="text-custom-white/60 hover:text-custom-white transition-colors justify-self-end"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* PRESETS MODE */}
        {mode === "presets" && (
          <div className="px-4 pt-4 pb-2 space-y-3 flex-1 min-h-0 overflow-y-auto thin-scrollbar">
            <div>
              <p className="text-[11px] text-content uppercase tracking-wide font-medium mb-1.5">
                Scope
              </p>
              <div className="flex gap-1.5">
                {([
                  { key: "store", label: "Selected store" },
                  { key: "all", label: "All stores in search" },
                ] as { key: Scope; label: string }[]).map((sc) => (
                  <button
                    key={sc.key}
                    onClick={() => setScope(sc.key)}
                    className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${
                      scope === sc.key
                        ? "border-[#1e2a4a] bg-row_selected text-content"
                        : "border-gray-200 text-content hover:border-gray-300"
                    }`}
                  >
                    {sc.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-content/50 uppercase tracking-wide font-medium">
              Select data to include
            </p>
            {PRESET_OPTIONS.map((pr) => (
              <label key={pr.key} className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={presets.has(pr.key)}
                  onChange={() => togglePreset(pr.key)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#1e2a4a] cursor-pointer flex-shrink-0"
                />
                <div>
                  <p className="text-[13px] font-medium text-content group-hover:text-[#1e2a4a] transition-colors">
                    {pr.label}
                  </p>
                  <p className="text-[11px] text-content/50 mt-0.5">{pr.desc}</p>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* CUSTOM MODE */}
        {mode === "custom" && (
          <div className="grid grid-cols-[200px_1fr] divide-x divide-gray-100 flex-1 min-h-0">
            {/* Left: config */}
            <div className="overflow-y-auto no-scrollbar p-4 space-y-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-content/45 mb-2">
                  Scope
                </p>
                <div className="flex flex-col gap-1.5">
                  {([
                  { key: "store", label: "Selected store" },
                  { key: "all", label: "All stores in search" },
                ] as { key: Scope; label: string }[]).map((sc) => (
                    <label key={sc.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={scope === sc.key}
                        onChange={() => setScope(sc.key)}
                        className="accent-[#1e2a4a] h-3.5 w-3.5"
                      />
                      <span className="text-[12px] text-content">{sc.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-content/45 mb-2">
                  Group By
                </p>
                <div className="space-y-1.5">
                  {CPN_SALES_DIMS.map((d) => (
                    <label key={d.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={groupBy.has(d.key)}
                        onChange={() => toggleDim(d.key)}
                        className="accent-[#1e2a4a] h-3.5 w-3.5 rounded flex-shrink-0"
                      />
                      <span className="text-[12px] text-content">{d.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-content/45 mb-2">
                  Metrics
                </p>
                <div className="space-y-2">
                  {CPN_SALES_METRICS.map((m) => {
                    const sel = metrics.get(m.key)!;
                    return (
                      <div key={m.key} className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={sel.enabled}
                          onChange={() =>
                            setMetrics((prev) => {
                              const next = new Map(prev);
                              next.set(m.key, { ...sel, enabled: !sel.enabled });
                              return next;
                            })
                          }
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
                            setMetrics((prev) => {
                              const next = new Map(prev);
                              next.set(m.key, { ...sel, fn: e.target.value as AggFn });
                              return next;
                            })
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
            </div>

            {/* Right: preview */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
                <p className="text-[11px] font-semibold text-content/60 uppercase tracking-wide">
                  Preview
                </p>
                <span className="text-[10px] text-content/40">
                  {previewRows.length === 0
                    ? "No data — select at least one group or metric"
                    : `Showing ${Math.min(PREVIEW_ROWS, previewRows.length)} of ${previewRows.length} rows`}
                </span>
              </div>

              {previewColumns.length === 0 ? (
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
                        {previewColumns.map((c) => (
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
                      {previewRows.slice(0, PREVIEW_ROWS).map((r, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-custom-white" : "bg-gray-50/50"}>
                          {previewColumns.map((c) => (
                            <td
                              key={c.key}
                              className="px-3 py-1.5 text-content/80 whitespace-nowrap border-b border-gray-50"
                            >
                              {r[c.key] ?? "—"}
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
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <button
            onClick={close}
            className="text-[12px] text-content/50 hover:text-content transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-content">
              {source.length.toLocaleString()} coupon lines
            </span>
            <button
              onClick={handleExport}
              disabled={!canExport}
              className="flex items-center gap-1.5 bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
            >
              <ArrowDownTrayIcon className="w-3.5 h-3.5" />
              Download CSV
            </button>
          </div>
        </div>
    </ResizableModalShell>
  );
};

export default CpnSalesExportModal;
