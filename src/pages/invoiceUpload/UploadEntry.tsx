import { useRef, useState } from "react";
import {
  DocumentArrowUpIcon,
  DocumentTextIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import SingleSelect from "../../components/SingleSelect";
import EntryCardLoading from "../../components/loading/EntryCardLoading";
import type { Store } from "../../interfaces";
import type { HistoryFile } from "./types";

/**
 * The upload card: store, files, send — then the store's recent EDI runs
 * underneath, so a file already sent can be reopened instead of re-uploaded.
 *
 * Unlike the local Invoices page, the file goes to the server: it is archived
 * to S3 and logged against the chosen store, which is why a store is required
 * before anything can be sent.
 *
 * Any file name is accepted. AWG names these by transmission date
 * ("20260425ELVC5897.D.20260425.032310"), so there is no extension to filter
 * the picker on — the server checks the first record instead.
 */
interface Props {
  stores: Store[];
  storeid: number;
  onStoreSelect: (id: number) => void;
  onUpload: (files: File[]) => void;
  uploading: boolean;
  error: string | null;
  history: HistoryFile[];
  historyLoading: boolean;
  onOpenRun: (runId: string) => void;
  /** Set when the card is the re-upload overlay: adds the close control. */
  onClose?: () => void;
}

/** Mirrors goliath's INVOICE_EDI_MAX_UPLOAD_BYTES and INVOICE_MAX_FILES
 *  defaults. Checked here so an oversized file is refused before it's sent
 *  rather than after the whole request has uploaded; the server still
 *  enforces its own. EDI has its own, larger cap than the scanned engines —
 *  a busy store's ELVC file runs past 20MB. */
const MAX_FILE_BYTES = 100 * 1024 * 1024;
const MAX_FILES = 5;

const formatSize = (bytes: number | null) => {
  if (bytes === null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  const mb = bytes / (1024 * 1024);
  return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`;
};

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const UploadEntry = ({
  stores,
  storeid,
  onStoreSelect,
  onUpload,
  uploading,
  error,
  history,
  historyLoading,
  onOpenRun,
  onClose,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);

  const storeName = stores.find((s) => s.storeid === storeid)?.store_name ?? "";

  const addFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const problems: string[] = [];
    const accepted: File[] = [];
    for (const f of Array.from(list)) {
      // Same name and size is the same file dropped twice, not a second one.
      if (
        [...files, ...accepted].some(
          (p) => p.name === f.name && p.size === f.size,
        )
      ) {
        continue;
      }
      if (f.size > MAX_FILE_BYTES) {
        problems.push(
          `${f.name} is ${formatSize(f.size)} — over the ${formatSize(MAX_FILE_BYTES)} limit`,
        );
        continue;
      }
      if (files.length + accepted.length >= MAX_FILES) {
        problems.push(`${f.name} skipped — ${MAX_FILES} files per upload maximum`);
        continue;
      }
      accepted.push(f);
    }
    setRejected(problems);
    setFiles((prev) => [...prev, ...accepted]);
  };

  return (
    <div className="bg-custom-white rounded-xl shadow-sm w-full max-w-[560px] overflow-hidden">
      <div className="bg-[#1e2a4a] px-4 py-2.5 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-custom-white text-[13px] font-semibold">
            {onClose ? "Upload another file" : "Invoice Upload"}
          </p>
          <p className="text-custom-white/85 text-[12px]">
            Send an AWG electronic invoice (EDI) file to be decoded, checked
            against its own totals, and archived against a store.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            title="Keep the run already open"
            className="flex-shrink-0 p-1 -mr-1 rounded text-custom-white/85 hover:text-custom-white hover:bg-custom-white/10 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="relative p-4 flex flex-col gap-3">
        <div
          className="flex flex-col gap-3"
          style={uploading ? { visibility: "hidden" } : undefined}
        >
          <SingleSelect
            label="Select Store"
            data={stores}
            displayKey="store_name"
            valueKey="storeid"
            onSelect={(id) => onStoreSelect(Number(id))}
            defaultQuery={storeid > 0 ? storeName : ""}
            // The store can be preselected after mount, once the user's
            // stores load — without this the input would stay blank.
            resetQuery
            innerClass="text-[13px] py-1"
            listClass="text-[13px]"
          />

          <button
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            className={`w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-8 transition-colors ${
              dragging
                ? "border-[#1e2a4a] bg-filter_active"
                : "border-gray-200 hover:border-[#1e2a4a]/40 hover:bg-gray-50"
            }`}
          >
            <DocumentArrowUpIcon className="w-6 h-6 text-[#1e2a4a]" />
            <span className="text-[13px] font-medium text-content">
              Drop EDI files here, or click to choose
            </span>
            <span className="text-[11.5px] text-content/85">
              Up to {MAX_FILES} files, {formatSize(MAX_FILE_BYTES)} each.
              Files are archived with the run.
            </span>
          </button>

          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              // Cleared so re-picking the same file still fires.
              e.target.value = "";
            }}
          />

          {files.length > 0 && (
            <div className="rounded-lg border border-gray-100 divide-y divide-gray-100">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${file.size}`}
                  className="flex items-center gap-2 px-3 py-1.5"
                >
                  <DocumentTextIcon className="w-4 h-4 flex-shrink-0 text-content/60" />
                  <span className="flex-1 min-w-0 truncate text-[12.5px] text-content">
                    {file.name}
                  </span>
                  <span className="flex-shrink-0 text-[11.5px] tabular-nums text-content/70">
                    {formatSize(file.size)}
                  </span>
                  <button
                    onClick={() => {
                      setFiles((prev) => prev.filter((_, i) => i !== index));
                      setRejected([]);
                    }}
                    title="Remove"
                    className="flex-shrink-0 p-0.5 rounded text-content/60 hover:text-content hover:bg-gray-100"
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {rejected.length > 0 && (
            <div className="px-3 py-2 rounded bg-amber-50 text-[12px] text-amber-900">
              {rejected.map((msg) => (
                <div key={msg}>{msg}</div>
              ))}
            </div>
          )}

          <button
            onClick={() => onUpload(files)}
            disabled={storeid === 0 || files.length === 0 || uploading}
            className="w-full py-2 text-sm font-semibold text-custom-white rounded-lg bg-[#1e2a4a] hover:bg-[#2a3a63] transition-colors cursor-pointer select-none disabled:opacity-50 disabled:cursor-default"
          >
            {/* Says what's missing rather than just greying out. */}
            {storeid === 0
              ? "Select a store to upload"
              : files.length === 0
                ? "Add a file to upload"
                : files.length > 1
                  ? `Upload ${files.length} files`
                  : "Upload"}
          </button>

          {error && (
            <div className="px-3 py-2 rounded bg-severity_critical_bg text-[12px] text-severity_critical_text whitespace-pre-line">
              {error}
            </div>
          )}
        </div>

        {uploading && (
          <EntryCardLoading message="Decoding invoices" context={storeName} />
        )}
      </div>

      {storeid > 0 && (
        <div className="border-t border-gray-100">
          <div className="px-4 py-2 text-[11.5px] font-semibold uppercase tracking-wide text-content/85 bg-gray-50">
            Recent EDI uploads
          </div>
          <div className="max-h-[240px] overflow-y-auto thin-scrollbar">
            {historyLoading && (
              <div className="py-4 text-center text-[12px] text-content/85">
                Loading…
              </div>
            )}
            {!historyLoading && history.length === 0 && (
              <div className="py-4 text-center text-[12px] text-content/85">
                Nothing uploaded for this store yet
              </div>
            )}
            {!historyLoading &&
              history.map((row) => (
                <button
                  key={`${row.runId}-${row.fileName}`}
                  onClick={() => onOpenRun(row.runId)}
                  // Without an archived result.json there is nothing to reopen.
                  disabled={!row.resultS3Uri}
                  title={row.error ?? row.fileName ?? ""}
                  className="w-full text-left flex items-center gap-2 px-4 py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 disabled:opacity-60 disabled:hover:bg-transparent"
                >
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      row.status === "failed" || row.failedCount > 0
                        ? "bg-severity_critical_text"
                        : "bg-severity_healthy_text"
                    }`}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[12.5px] font-medium text-content truncate">
                      {row.fileName ?? "(no file)"}
                    </span>
                    <span className="block text-[11.5px] text-content/85 truncate">
                      {formatWhen(row.createdAt)}
                      {row.status === "failed"
                        ? " · failed"
                        : ` · ${row.invoiceCount} invoices${
                            row.failedCount > 0
                              ? ` · ${row.failedCount} did not reconcile`
                              : ""
                          }`}
                    </span>
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadEntry;
