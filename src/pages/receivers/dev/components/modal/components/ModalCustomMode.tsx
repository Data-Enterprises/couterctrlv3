// Utils
import { DIMS, PREVIEW_ROWS, AGG_OPTIONS, METRICS } from "../utils";
import type { AggFn, AggRow } from "../../../../../../utils/csvExport";

// Interfaces
import type { ReceiverDetailsItem } from "../../../../../../interfaces";
import type { MappedColumn, MetricSelection } from "../interfaces";

// Components
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import CustomColTh from "./CustomColTh";
import CustomModeTable from "./CustomModeTable";

interface ModalCustomModeProps {
  canCustomDownload: boolean;
  onClose: () => void;
  vendorName: string;
  invoiceId: number;
  referenceNumber: string;
  details: ReceiverDetailsItem[];
  toggleGroupBy: (key: string) => void;
  toggleMetric: (key: string) => void;
  setMetricFn: (key: string, fn: AggFn) => void;
  groupBy: Set<string>;
  metrics: Map<string, MetricSelection>;
  aggRows: AggRow[];
  columns: MappedColumn[];
  handleCustomDownload: () => void;
}

/** The export modal's Custom tab: Group By and Metrics pickers on the left, a live preview table on the right,
 *  and Cancel and Download CSV buttons. */
const ModalCustomMode = ({
  canCustomDownload,
  onClose,
  vendorName,
  invoiceId,
  details,
  toggleGroupBy,
  toggleMetric,
  setMetricFn,
  groupBy,
  metrics,
  aggRows,
  columns,
  handleCustomDownload,
}: ModalCustomModeProps) => {
  return (
    <>
      <div className="grid grid-cols-[200px_1fr] divide-x divide-gray-100 min-h-[360px] max-h-[calc(100vh-220px)]">
        {/* Left: config */}
        <div className="overflow-y-auto no-scrollbar p-4 space-y-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-content/45 mb-2">
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
                    className="accent-brand_navy h-3.5 w-3.5 rounded flex-shrink-0"
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
                      className={`text-[12px] flex-1 ${sel.enabled ? "text-content" : "text-content/40"}`}
                    >
                      {m.label}
                    </span>
                    <select
                      value={sel.fn}
                      disabled={!sel.enabled}
                      onChange={(e) =>
                        setMetricFn(m.key, e.target.value as AggFn)
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

          <p className="text-[10px] text-content/35 italic leading-relaxed">
            Working on {details.length} line items for {vendorName} Invoice{" "}
            {invoiceId}.
          </p>
        </div>

        {/* Right: preview */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
            <p className="text-[11px] font-semibold text-content/60 uppercase tracking-wide">
              Preview
            </p>
            <span className="text-[10px] text-content/40">
              {aggRows.length === 0
                ? "No data — select at least one group or metric"
                : `Showing ${Math.min(PREVIEW_ROWS, aggRows.length)} of ${aggRows.length} rows`}
            </span>
          </div>

          {columns.length === 0 ? (
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
                    {columns.map((c) => (
                      <CustomColTh column={c} key={c.key} />
                    ))}
                  </tr>
                </thead>
                <CustomModeTable
                  aggRows={aggRows}
                  columns={columns}
                  PREVIEW_ROWS={PREVIEW_ROWS}
                />
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <button
          onClick={onClose}
          className="text-[12px] text-content/50 hover:text-content transition-colors"
        >
          Cancel
        </button>
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
  );
};

export default ModalCustomMode;
