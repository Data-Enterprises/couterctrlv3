import {
  ArchiveBoxXMarkIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";
import SeverityBadge from "../../../components/SeverityBadge";
import type { InvoiceFileReport } from "../../../interfaces";
import { lineCount, printed, type InvoiceRow } from "..";

interface InvoiceListPanelProps {
  rows: InvoiceRow[];
  files: InvoiceFileReport[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onNewBatch: () => void;
  onExport: () => void;
}

const InvoiceListPanel = ({
  rows,
  files,
  selectedIndex,
  onSelect,
  onNewBatch,
  onExport,
}: InvoiceListPanelProps) => {
  const failedFiles = files.filter((f) => f.error);
  // Extraction worked, the source archive didn't. Separate from failedFiles on
  // purpose — nothing is missing from the page, but the invoices these produced
  // can't be traced back to the image they were read from.
  const unarchivedFiles = files.filter((f) => !f.error && f.storageError);
  const offCount = rows.filter((r) => r.reconciliation?.reconciled === false).length;

  return (
    <div className="h-full bg-custom-white rounded-xl shadow-lg flex flex-col overflow-hidden">
      <div className="px-3 py-2.5 border-b border-gray-100 flex items-center gap-2 flex-shrink-0">
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-content">
            {rows.length} Invoice{rows.length === 1 ? "" : "s"}
          </div>
          <div className="text-[11px] text-content/50 truncate">
            {files.length} file{files.length === 1 ? "" : "s"}
            {offCount > 0 && ` · ${offCount} not reconciled`}
          </div>
        </div>
        <button
          onClick={onExport}
          disabled={rows.length === 0}
          title="Export line items"
          className="p-1.5 rounded-lg hover:bg-bkg transition-colors disabled:opacity-40"
        >
          <ArrowDownTrayIcon className="w-4 h-4 text-content/60" />
        </button>
        <button
          onClick={onNewBatch}
          title="Upload more invoices"
          className="p-1.5 rounded-lg hover:bg-bkg transition-colors"
        >
          <ArrowUpTrayIcon className="w-4 h-4 text-content/60" />
        </button>
      </div>

      {/* A file that failed produced no invoices, so it has no row in the list
          below — it would vanish from the page entirely without this. */}
      {(failedFiles.length > 0 || unarchivedFiles.length > 0) && (
        <div className="px-3 py-2 border-b border-gray-100 flex flex-col gap-1.5 flex-shrink-0">
          {failedFiles.map((f) => (
            <div
              key={f.file}
              className="flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-severity_critical_bg"
            >
              <ExclamationTriangleIcon className="w-3.5 h-3.5 text-severity_critical_text flex-shrink-0 mt-[1px]" />
              <div className="min-w-0">
                <div className="text-[11.5px] font-semibold text-severity_critical_text truncate">
                  {f.file}
                </div>
                <div className="text-[11px] text-severity_critical_text/80 leading-snug">
                  {f.error}
                </div>
              </div>
            </div>
          ))}

          {unarchivedFiles.map((f) => (
            <div
              key={f.file}
              className="flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-severity_watch_bg"
            >
              <ArchiveBoxXMarkIcon className="w-3.5 h-3.5 text-severity_watch_text flex-shrink-0 mt-[1px]" />
              <div className="min-w-0">
                <div className="text-[11.5px] font-semibold text-severity_watch_text truncate">
                  {f.file} — source not archived
                </div>
                <div className="text-[11px] text-severity_watch_text/80 leading-snug">
                  {f.storageError}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto">
        {rows.map((row) => {
          const selected = row.index === selectedIndex;
          const rec = row.reconciliation;
          return (
            <button
              key={row.index}
              onClick={() => onSelect(row.index)}
              className={`w-full text-left px-3 py-2 flex items-center gap-2 border-l-2 transition-colors ${
                selected
                  ? "bg-row_selected border-row_selected_border"
                  : "border-transparent hover:bg-bkg"
              }`}
            >
              <SeverityBadge
                severity={
                  rec === undefined
                    ? "watch"
                    : rec.reconciled
                      ? "healthy"
                      : "critical"
                }
              />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-content truncate">
                  {row.invoice.invoiceNumber}
                </div>
                <div className="text-[11px] text-content/50 truncate">
                  {[
                    row.invoice.invoiceDate,
                    row.invoice.vendor,
                    rec?.file,
                    row.invoice.pages && `p. ${row.invoice.pages}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[12px] font-semibold text-content tabular-nums">
                  {printed(row.invoice.totals?.invoiceTotal)}
                </div>
                <div className="text-[11px] text-content/45">
                  {lineCount(row.invoice)} line
                  {lineCount(row.invoice) === 1 ? "" : "s"}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default InvoiceListPanel;
