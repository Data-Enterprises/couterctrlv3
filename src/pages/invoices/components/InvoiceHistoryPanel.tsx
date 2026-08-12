import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/20/solid";
import type {
  InvoiceEngine,
  InvoiceHistoryFile,
  InvoiceRunStatus,
  Store,
} from "../../../interfaces";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import EmptyPrompt from "../../../components/EmptyPrompt";
import { ENGINES, formatBytes } from "..";

interface InvoiceHistoryPanelProps {
  files: InvoiceHistoryFile[];
  total: number;
  offset: number;
  pageSize: number;
  loading: boolean;
  openingRunId: string | null;
  stores: Store[];
  storeid: number | null;
  engine: InvoiceEngine | null;
  status: InvoiceRunStatus | null;
  onFilterChange: (next: {
    storeid?: number | null;
    engine?: InvoiceEngine | null;
    status?: InvoiceRunStatus | null;
  }) => void;
  onOffsetChange: (offset: number) => void;
  onRefresh: () => void;
  onOpenRun: (file: InvoiceHistoryFile) => void;
  /** Absent when there are no results to go back to. */
  onBack?: () => void;
}

const STATUSES: InvoiceRunStatus[] = ["success", "partial", "failed"];

const STATUS_CLASS: Record<InvoiceRunStatus, string> = {
  success: "bg-severity_healthy_bg text-severity_healthy_text",
  partial: "bg-severity_watch_bg text-severity_watch_text",
  failed: "bg-severity_critical_bg text-severity_critical_text",
};

const COLS =
  "grid grid-cols-[10.5rem_10rem_1fr_5rem_4.5rem_6.5rem_5.5rem_5.5rem] gap-2 items-center";

const when = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
};

const duration = (ms: number | null) =>
  ms === null ? "—" : ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;

const Select = <T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (value: T | null) => void;
}) => (
  <label className="flex items-center gap-1.5 text-[11.5px] text-content/50">
    {label}
    <select
      value={value === null ? "" : String(value)}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === "") return onChange(null);
        const match = options.find((o) => String(o.value) === raw);
        onChange(match ? match.value : null);
      }}
      className="text-[12px] text-content bg-bkg border-0 rounded-md py-1 pl-2 pr-7 focus:ring-1 focus:ring-[#1e2a4a]"
    >
      <option value="">All</option>
      {options.map((o) => (
        <option key={String(o.value)} value={String(o.value)}>
          {o.label}
        </option>
      ))}
    </select>
  </label>
);

const InvoiceHistoryPanel = ({
  files,
  total,
  offset,
  pageSize,
  loading,
  openingRunId,
  stores,
  storeid,
  engine,
  status,
  onFilterChange,
  onOffsetChange,
  onRefresh,
  onOpenRun,
  onBack,
}: InvoiceHistoryPanelProps) => {
  const storeName = (id: number) =>
    stores.find((s) => s.storeid === id)?.store_name ?? `Store ${id}`;

  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + files.length, total);

  return (
    <div className="h-full bg-custom-white rounded-xl shadow-lg flex flex-col overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-content">
            Previous Runs
          </div>
          <div className="text-[11px] text-content/50">
            One row per file · {total} total
          </div>
        </div>

        <div className="flex items-center gap-3 ml-4">
          <Select
            label="Store"
            value={storeid}
            options={stores.map((s) => ({
              value: s.storeid,
              label: s.store_name,
            }))}
            onChange={(next) => onFilterChange({ storeid: next })}
          />
          <Select
            label="Engine"
            value={engine}
            options={ENGINES.map((e) => ({ value: e.id, label: e.label }))}
            onChange={(next) => onFilterChange({ engine: next })}
          />
          <Select
            label="Status"
            value={status}
            options={STATUSES.map((s) => ({ value: s, label: s }))}
            onChange={(next) => onFilterChange({ status: next })}
          />
        </div>

        <button
          onClick={onRefresh}
          title="Refresh"
          className="ml-auto p-1.5 rounded-lg hover:bg-bkg transition-colors"
        >
          <ArrowPathIcon className="w-4 h-4 text-content/60" />
        </button>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-[12px] font-semibold text-[#1e2a4a] hover:underline underline-offset-2"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            Back to results
          </button>
        )}
      </div>

      <div
        className={`${COLS} px-4 py-1.5 text-[11px] font-semibold text-content/50 border-b border-gray-100 flex-shrink-0`}
      >
        <div>When</div>
        <div>Store</div>
        <div>File</div>
        <div>Engine</div>
        <div className="text-right">Pages</div>
        <div className="text-right">Invoices</div>
        <div className="text-right">Cost</div>
        <div className="text-right">Status</div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto relative">
        {loading ? (
          <LoadingIndicator message="Loading previous runs..." />
        ) : files.length === 0 ? (
          <EmptyPrompt
            title="Nothing here yet"
            description="Runs appear once invoices have been processed for a store you can see."
          />
        ) : (
          files.map((f, i) => {
            // A run with no archive has nothing to reopen — the extraction
            // happened, the result.json write didn't.
            const openable = f.resultS3Uri !== null;
            const opening = openingRunId === f.runId;
            return (
              <button
                key={`${f.runId}__${f.fileName ?? "run"}__${i}`}
                onClick={() => openable && onOpenRun(f)}
                disabled={!openable || opening}
                title={
                  openable
                    ? `Open run ${f.runId}`
                    : "This run has no archived result to open"
                }
                className={`${COLS} w-full text-left px-4 py-1.5 border-b border-gray-100 last:border-0 text-[12px] transition-colors ${
                  openable
                    ? "hover:bg-bkg cursor-pointer"
                    : "cursor-default opacity-60"
                } ${opening ? "bg-row_selected" : ""}`}
              >
                <div className="text-content/70">{when(f.createdAt)}</div>
                <div className="truncate text-content">
                  {storeName(f.storeid)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-content font-medium">
                    {f.fileName ?? "— run failed before any file —"}
                  </div>
                  {f.error ? (
                    <div className="truncate text-[11px] text-severity_critical_text">
                      {f.error}
                    </div>
                  ) : (
                    <div className="text-[11px] text-content/40">
                      {[
                        f.fileSizeBytes !== null && formatBytes(f.fileSizeBytes),
                        duration(f.durationMs),
                        f.modelId,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  )}
                </div>
                <div className="text-content/70">
                  {ENGINES.find((e) => e.id === f.engine)?.label ?? f.engine}
                </div>
                <div className="text-right tabular-nums text-content/70">
                  {f.pageCount ?? "—"}
                </div>
                {/* Reconciled over extracted — failedCount is the same number
                    from the other side, so showing both would just repeat it. */}
                <div className="text-right tabular-nums">
                  <span
                    className={
                      f.invoiceCount > 0 && f.reconciledCount < f.invoiceCount
                        ? "text-severity_critical_text font-medium"
                        : "text-content/70"
                    }
                  >
                    {f.reconciledCount}/{f.invoiceCount}
                  </span>
                </div>
                <div className="text-right tabular-nums text-content/70">
                  {f.estCostUsd === null ? "—" : `$${f.estCostUsd}`}
                </div>
                <div className="text-right">
                  <span
                    className={`text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_CLASS[f.status]}`}
                  >
                    {opening ? "opening…" : f.status}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-2 flex-shrink-0">
        <div className="text-[11.5px] text-content/50">
          {from}–{to} of {total}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => onOffsetChange(Math.max(0, offset - pageSize))}
            disabled={offset === 0 || loading}
            className="p-1.5 rounded-lg hover:bg-bkg transition-colors disabled:opacity-30"
            title="Previous page"
          >
            <ChevronLeftIcon className="w-4 h-4 text-content/60" />
          </button>
          <button
            onClick={() => onOffsetChange(offset + pageSize)}
            disabled={offset + pageSize >= total || loading}
            className="p-1.5 rounded-lg hover:bg-bkg transition-colors disabled:opacity-30"
            title="Next page"
          >
            <ChevronRightIcon className="w-4 h-4 text-content/60" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceHistoryPanel;
