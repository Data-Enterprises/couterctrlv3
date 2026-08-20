import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MinusCircleIcon,
} from "@heroicons/react/20/solid";
import type { BulkFileProgress } from "..";

interface InvoiceBulkProgressPanelProps {
  files: BulkFileProgress[];
  engineLabel: string;
  canceling: boolean;
  onCancel: () => void;
}

const STATUS_STYLES: Record<
  BulkFileProgress["status"],
  { row: string; label: string; text: string }
> = {
  queued: { row: "bg-bkg", label: "Queued", text: "text-content/45" },
  running: {
    row: "bg-[#1e2a4a]/5",
    label: "Reading…",
    text: "text-[#1e2a4a] font-semibold",
  },
  done: { row: "bg-bkg", label: "Done", text: "text-content/60" },
  failed: {
    row: "bg-severity_critical_bg",
    label: "Failed",
    text: "text-severity_critical_text font-semibold",
  },
  canceled: { row: "bg-bkg", label: "Not sent", text: "text-content/45" },
};

/** A bulk run is one request per file, so there is a real per-file state to
 *  show — and there has to be: the batch takes minutes, invoices land on the
 *  results screen as each file finishes, and a file that fails should say so
 *  while the others are still going rather than at the end. */
const InvoiceBulkProgressPanel = ({
  files,
  engineLabel,
  canceling,
  onCancel,
}: InvoiceBulkProgressPanelProps) => {
  const settled = files.filter(
    (f) => f.status === "done" || f.status === "failed",
  ).length;
  const failed = files.filter((f) => f.status === "failed").length;
  const invoices = files.reduce((sum, f) => sum + f.invoices, 0);
  const pct = files.length === 0 ? 0 : (settled / files.length) * 100;

  return (
    <div className="bg-custom-white rounded-2xl shadow-lg p-6 w-full max-w-lg flex flex-col gap-3">
      <div>
        <h2 className="text-base font-semibold text-content">
          Extracting {files.length} file{files.length === 1 ? "" : "s"} with{" "}
          {engineLabel}
        </h2>
        <p className="text-[12px] text-content/50 mt-1">
          {files.length} request{files.length === 1 ? "" : "s"}, one per file,
          all sent together — the browser opens about six at a time and holds
          the rest. Invoices appear as each file finishes.
        </p>
      </div>

      <div className="h-1.5 rounded-full bg-bkg overflow-hidden">
        <div
          className="h-full bg-[#1e2a4a] transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center gap-2 text-[11.5px] text-content/50">
        <span>
          {settled} of {files.length} done
        </span>
        <span>· {invoices} invoice{invoices === 1 ? "" : "s"}</span>
        {failed > 0 && (
          <span className="text-severity_critical_text font-semibold">
            · {failed} failed
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1 max-h-72 overflow-y-auto no-scrollbar">
        {files.map((f, i) => {
          const style = STATUS_STYLES[f.status];
          return (
            <div
              // Position, not name: two staged files can share a name when
              // they differ in size, and this list never reorders.
              key={i}
              className={`flex items-start gap-2 px-2.5 py-1.5 rounded-lg ${style.row}`}
            >
              <div className="w-4 flex-shrink-0 mt-[2px]">
                {f.status === "done" ? (
                  <CheckCircleIcon className="w-4 h-4 text-severity_healthy_text" />
                ) : f.status === "failed" ? (
                  <ExclamationTriangleIcon className="w-4 h-4 text-severity_critical_text" />
                ) : f.status === "canceled" ? (
                  <MinusCircleIcon className="w-4 h-4 text-content/30" />
                ) : (
                  <div
                    className={`w-2 h-2 mt-[4px] ml-[4px] rounded-full ${
                      f.status === "running"
                        ? "bg-[#1e2a4a] animate-pulse"
                        : "bg-content/20"
                    }`}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] text-content truncate">
                  {f.file}
                </div>
                {f.error && (
                  <div className="text-[11px] text-severity_critical_text/80 leading-snug">
                    {f.error}
                  </div>
                )}
              </div>
              <span
                className={`text-[11px] flex-shrink-0 tabular-nums ${style.text}`}
              >
                {f.status === "done" && f.invoices > 0
                  ? `${f.invoices} invoice${f.invoices === 1 ? "" : "s"}`
                  : style.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Every request is already out, so stopping drops the answers, not the
          work. A file the server had started reading is billed either way and
          its run is still filed — the wording promises no more than that. */}
      <button
        onClick={onCancel}
        disabled={canceling}
        className="w-full py-2 text-[12.5px] font-semibold text-content/60 hover:text-content transition-colors underline underline-offset-2 disabled:opacity-50"
      >
        {canceling ? "Stopping…" : "Stop waiting for these"}
      </button>
    </div>
  );
};

export default InvoiceBulkProgressPanel;
