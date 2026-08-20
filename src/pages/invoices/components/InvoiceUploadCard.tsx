import { useRef, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowUpTrayIcon,
  DocumentIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import type { InvoiceEngine, Store } from "../../../interfaces";
import SingleSelect from "../../../components/SingleSelect";
import {
  ACCEPT_ATTR,
  ENGINES,
  dedupeFiles,
  formatBytes,
  isStageableFile,
  isSupportedFile,
} from "..";
import { useToast } from "../../../components/toasts/hooks/useToast";

interface InvoiceUploadCardProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  engine: InvoiceEngine;
  onEngineChange: (engine: InvoiceEngine) => void;
  stores: Store[];
  storeid: number;
  onStoreChange: (storeid: number) => void;
  /** One request per file instead of one carrying the batch. */
  bulk: boolean;
  onBulkChange: (bulk: boolean) => void;
  onExtract: () => void;
  loading: boolean;
  onHistory: () => void;
  /** Present once a run has finished, so the card can be reopened over the
   *  results without losing them. */
  onBack?: () => void;
  notice?: string;
}

const InvoiceUploadCard = ({
  files,
  onFilesChange,
  engine,
  onEngineChange,
  stores,
  storeid,
  onStoreChange,
  bulk,
  onBulkChange,
  onExtract,
  loading,
  onHistory,
  onBack,
  notice,
}: InvoiceUploadCardProps) => {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const active = ENGINES.find((e) => e.id === engine) ?? ENGINES[0];
  const storeName =
    stores.find((s) => s.storeid === storeid)?.store_name ?? "";
  // Staged files the selected engine can't read. Not removed — the other
  // engine may well take them, and the fix is usually to switch rather than to
  // go find the file again.
  const unreadable = files.filter((f) => !isSupportedFile(f, engine));

  const accept = (incoming: File[]) => {
    const stageable = incoming.filter(isStageableFile);
    const rejected = incoming.length - stageable.length;
    if (rejected > 0) {
      toast.warn(
        `${rejected} file${rejected === 1 ? "" : "s"} skipped — neither engine reads that format`,
      );
    }
    if (stageable.length > 0) onFilesChange(dedupeFiles(files, stageable));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    accept(Array.from(e.dataTransfer.files ?? []));
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    accept(Array.from(e.target.files ?? []));
    // Reset so re-picking the same file after removing it still fires change.
    e.target.value = "";
  };

  const remove = (index: number) =>
    onFilesChange(files.filter((_, i) => i !== index));

  return (
    <div className="bg-custom-white rounded-2xl shadow-lg p-6 w-full max-w-md flex flex-col gap-3">
      <div>
        <h2 className="text-base font-semibold text-content">
          Scanned Invoice Parsing
        </h2>
        <p className="text-[12px] text-content/50 mt-1">
          Upload scanned invoice PDFs or photos. Each line item is transcribed
          exactly as printed and every invoice is reconciled against its own
          totals.
        </p>
      </div>

      {/* Every run is filed against a store — it's what the log row and the
          cost are attributed to, and the server re-checks it against the
          caller's own assignments before spending anything. */}
      <SingleSelect
        label="Select Store"
        data={stores}
        displayKey="store_name"
        valueKey="storeid"
        onSelect={(id) => onStoreChange(Number(id))}
        defaultQuery={storeid > 0 ? storeName : ""}
        innerClass="text-[13px] py-1"
        listClass="text-[13px]"
      />

      {/* Both engines return the same shape and the same reconciliation, so the
          checks on the results screen are what score one against the other on
          a given document. */}
      <div>
        <div className="flex gap-1 p-1 rounded-lg bg-bkg">
          {ENGINES.map((e) => (
            <button
              key={e.id}
              data-testid={`engine-${e.id}`}
              onClick={() => onEngineChange(e.id)}
              disabled={loading}
              className={`flex-1 py-1.5 text-[12.5px] font-semibold rounded-md transition-colors disabled:opacity-50 ${
                e.id === engine
                  ? "bg-custom-white text-content shadow-sm"
                  : "text-content/50 hover:text-content"
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-content/45 mt-1.5 leading-snug">
          {active.blurb}
        </p>
      </div>

      {/* One request per file is the safer shape for a big drop: a file that
          blows up takes only itself down, and the invoices from the files that
          finished are on screen while the rest are still reading. It costs the
          same per page — the pages get read either way. */}
      <label className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-bkg cursor-pointer">
        <input
          type="checkbox"
          data-testid="bulk-mode-toggle"
          checked={bulk}
          disabled={loading}
          onChange={(e) => onBulkChange(e.target.checked)}
          className="mt-[2px] accent-[#1e2a4a] cursor-pointer"
        />
        <span className="min-w-0">
          <span className="block text-[12.5px] font-semibold text-content">
            Bulk mode — one request per file
          </span>
          <span className="block text-[11px] text-content/45 leading-snug">
            {files.length > 0 ? `${files.length} files, ${files.length} requests` : "One request per file"}
            , each filed as its own run. A failure costs you that file instead
            of the batch, and results appear as they land.
          </span>
        </span>
      </label>

      {notice && (
        <div className="px-2.5 py-2 rounded-lg bg-amber-50 text-[11.5px] text-amber-900 leading-snug">
          {notice}
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed px-4 py-6 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors ${
          dragging
            ? "border-[#1e2a4a] bg-[#1e2a4a]/5"
            : "border-gray-300 hover:border-[#1e2a4a]/50"
        }`}
      >
        <ArrowUpTrayIcon className="w-5 h-5 text-content/40" />
        <div className="text-[13px] font-medium text-content">
          Drop invoices here, or click to choose
        </div>
        <div className="text-[11px] text-content/45">
          {active.fileTypes} · a batch PDF may hold many invoices
        </div>
        <input
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          className="hidden"
          ref={inputRef}
          onChange={handleSelect}
        />
      </div>

      {files.length > 0 && (
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto no-scrollbar">
          {files.map((file, i) => {
            const readable = isSupportedFile(file, engine);
            return (
              <div
                key={`${file.name}__${file.size}`}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${
                  readable ? "bg-bkg" : "bg-severity_watch_bg"
                }`}
                title={
                  readable
                    ? undefined
                    : `${active.label} doesn't read this format — it takes ${active.fileTypes}`
                }
              >
                {!readable ? (
                  <ExclamationTriangleIcon className="w-4 h-4 text-severity_watch_text flex-shrink-0" />
                ) : file.type === "application/pdf" ||
                  file.name.toLowerCase().endsWith(".pdf") ? (
                  <DocumentIcon className="w-4 h-4 text-content/40 flex-shrink-0" />
                ) : (
                  <PhotoIcon className="w-4 h-4 text-content/40 flex-shrink-0" />
                )}
                <span
                  className={`text-[12px] truncate flex-1 min-w-0 ${
                    readable ? "text-content" : "text-severity_watch_text"
                  }`}
                >
                  {file.name}
                </span>
                <span className="text-[11px] text-content/45 flex-shrink-0">
                  {formatBytes(file.size)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(i);
                  }}
                  disabled={loading}
                  className="flex-shrink-0 text-content/40 hover:text-content transition-colors disabled:opacity-40"
                  title="Remove"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {unreadable.length > 0 && (
        <div className="px-2.5 py-2 rounded-lg bg-severity_watch_bg text-[11.5px] text-severity_watch_text leading-snug">
          {unreadable.length} file{unreadable.length === 1 ? "" : "s"} can't be
          read by {active.label}. Switch engine or remove{" "}
          {unreadable.length === 1 ? "it" : "them"} — sending{" "}
          {unreadable.length === 1 ? "it" : "them"} anyway just returns a
          per-file error.
        </div>
      )}

      {/* Store is required by the endpoint, and a missing one fails the whole
          request — cheaper to gate here than to upload and be turned away. */}
      <button
        data-testid="extract-invoices-btn"
        onClick={onExtract}
        disabled={loading || files.length === 0 || storeid === 0}
        className="w-full py-2 text-sm font-semibold text-custom-white rounded-lg bg-[#1e2a4a] hover:bg-[#2a3a63] transition-colors cursor-pointer select-none disabled:opacity-50"
      >
        {storeid === 0
          ? "Select a store first"
          : files.length === 0
            ? `Extract with ${active.label}`
            : `Extract ${files.length} File${files.length === 1 ? "" : "s"} with ${active.label}${bulk ? " — separately" : ""}`}
      </button>

      <button
        data-testid="open-history-btn"
        onClick={onHistory}
        className="w-full py-1.5 text-[12.5px] font-semibold text-content/60 hover:text-content transition-colors underline underline-offset-2"
      >
        View previous runs
      </button>

      {onBack && (
        <button
          onClick={onBack}
          className="w-full py-2.5 flex items-center justify-center gap-1.5 transition-colors"
          style={{ background: "rgba(30,42,74,0.07)", borderRadius: 10 }}
        >
          <ArrowLeftIcon className="w-4 h-4 text-[#1e2a4a]" />
          <span className="text-[#1e2a4a] font-semibold text-[13px] underline underline-offset-2">
            Back to results
          </span>
        </button>
      )}
    </div>
  );
};

export default InvoiceUploadCard;
