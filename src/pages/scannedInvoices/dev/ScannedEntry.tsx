import { useEffect, useRef, useState } from "react";
import { DocumentArrowUpIcon, XMarkIcon } from "@heroicons/react/20/solid";
import {
  MAX_INVOICE_FILES,
  MAX_SCANNED_FILE_BYTES,
} from "../../../api/invoices";

interface Props {
  onRead: (files: File[]) => void;
  parsing: boolean;
  startedAt: number | null;
  error: string | null;
  /** No store, no parse: the server refuses the run before reading. */
  storeChosen: boolean;
  /** Set when the card is the "read more" overlay. */
  onClose?: () => void;
}

const ACCEPT = ".pdf,.png,.jpg,.jpeg,.gif,.webp,image/*,application/pdf";

/**
 * The drop card, the same shape as the AWG page's.
 *
 * Unlike that one, nothing is read here: the scans go to the server and a
 * vision model reads them, which takes minutes for a long batch and is billed.
 * So files are collected first and sent on an explicit button, and the
 * limits the server would refuse are checked before anything is uploaded.
 */
const ScannedEntry = ({
  onRead,
  parsing,
  startedAt,
  error,
  storeChosen,
  onClose,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!parsing) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [parsing]);

  const add = (list: FileList | null) => {
    if (!list) return;
    setFiles((held) => {
      const names = new Set(held.map((f) => f.name));
      return [...held, ...Array.from(list).filter((f) => !names.has(f.name))];
    });
  };

  const tooBig = files.filter((f) => f.size > MAX_SCANNED_FILE_BYTES);
  const tooMany = files.length > MAX_INVOICE_FILES;
  const problem = tooMany
    ? `${MAX_INVOICE_FILES} files per run at most.`
    : tooBig.length > 0
      ? `${tooBig[0].name} is over the ${MAX_SCANNED_FILE_BYTES / (1024 * 1024)} MB limit.`
      : !storeChosen
        ? "Choose a store first — the run is filed against it."
        : null;

  const elapsed = startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;

  return (
    <div className="w-full max-w-[560px] overflow-hidden rounded-xl bg-custom-white shadow-sm">
      <div className="flex items-start gap-3 bg-brand_navy px-4 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-custom-white">
            {onClose ? "Read more scans" : "Scanned Invoices"}
          </p>
          <p className="text-[12px] text-custom-white/85">
            Drop scanned invoices — PDFs or photos, any vendor. Each one is read
            by Claude on Bedrock and checked against its own printed totals.
          </p>
        </div>
        {onClose && !parsing && (
          <button
            type="button"
            onClick={onClose}
            title="Keep the results already open"
            className="-mr-1 flex-shrink-0 rounded p-1 text-custom-white/85 transition-colors hover:bg-custom-white/10 hover:text-custom-white"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 p-4">
        <button
          type="button"
          disabled={parsing}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!parsing) add(e.dataTransfer.files);
          }}
          className={`flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors disabled:opacity-50 ${
            dragging
              ? "border-brand_navy bg-bkg"
              : "border-gray-200 hover:border-brand_slate"
          }`}
        >
          <DocumentArrowUpIcon className="h-7 w-7 text-content/85" />
          <span className="text-[13px] font-medium text-content">
            Drop scans here, or click to choose
          </span>
          <span className="text-[11px] text-content/85">
            PDF, PNG, JPEG, GIF or WebP · up to {MAX_INVOICE_FILES} files ·{" "}
            {MAX_SCANNED_FILE_BYTES / (1024 * 1024)} MB each
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />

        {files.length > 0 && (
          <ul className="flex flex-col divide-y divide-gray-100 rounded-lg border border-gray-200">
            {files.map((file) => (
              <li
                key={file.name}
                className="flex items-center gap-2 px-3 py-1.5 text-[12px]"
              >
                <span className="min-w-0 flex-1 truncate">{file.name}</span>
                <span className="font-mono text-[10.5px] text-content/85">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </span>
                {!parsing && (
                  <button
                    type="button"
                    onClick={() =>
                      setFiles((held) => held.filter((f) => f !== file))
                    }
                    aria-label={`Remove ${file.name}`}
                    className="rounded p-0.5 text-content/85 hover:bg-bkg"
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {(problem && files.length > 0) || error ? (
          <p className="rounded-lg bg-severity_critical_bg px-3 py-2 text-[12px] text-severity_critical_text">
            {error ?? problem}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => onRead(files)}
          disabled={parsing || files.length === 0 || problem !== null}
          className="rounded-lg bg-brand_navy px-3.5 py-2 font-display text-[13px] font-semibold text-custom-white hover:bg-brand_navy_hover disabled:opacity-50"
        >
          {parsing
            ? `Reading… ${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`
            : files.length === 0
              ? "Read files"
              : `Read ${files.length} ${files.length === 1 ? "file" : "files"}`}
        </button>
        {parsing && (
          <p className="text-center text-[11px] text-content/85">
            A long batch can take a few minutes. You can leave this page — the
            result is kept when it arrives.
          </p>
        )}
      </div>
    </div>
  );
};

export default ScannedEntry;
