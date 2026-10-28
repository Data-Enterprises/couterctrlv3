import { useRef, useState } from "react";
import { DocumentArrowUpIcon } from "@heroicons/react/20/solid";
import { readInvoiceFile } from "./readInvoiceFile";

/**
 * The drop card.
 *
 * Just the card — the page supplies the frame around it. The same shape every
 * other page's entry card takes, with a drop zone where they have a store
 * picker and a date. Nothing is fetched: the file is read and decoded in the
 * browser, so the "search" here is local work and finishes in milliseconds.
 *
 * **Only the first read.** This used to double as a re-read overlay, which
 * meant the one place you could drop a file was behind a button you had to
 * click first — backwards for drag and drop. Once a file is open the page
 * itself takes the drop and the toolbar button opens the picker, so there is
 * no overlay and nothing to close.
 */
interface Props {
  onFile: (text: string, fileName: string) => void;
  error: string | null;
}

const InvoicesEntry = ({ onFile, error }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const read = (file: File) => readInvoiceFile(file, onFile);

  return (
    <div className="bg-custom-white rounded-xl shadow-sm w-full max-w-[560px] overflow-hidden">
      <div className="bg-brand_navy px-4 py-2.5 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-custom-white text-[13px] font-semibold">
            AWG Invoices
          </p>
          <p className="text-custom-white/85 text-[12px]">
            Drop an AWG electronic invoice file to read it. Every line is
            checked against the invoice&rsquo;s own printed totals before
            anything is shown.
          </p>
        </div>
      </div>

      <div className="p-4">
        {/* Click and drop both land on the same reader — a drop zone that
            can't be clicked is a trap for anyone on a locked-down machine
            where dragging from the file explorer is awkward. */}
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
            const file = e.dataTransfer.files?.[0];
            if (file) read(file);
          }}
          className={`w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-10 transition-colors ${
            dragging
              ? "border-brand_navy bg-filter_active"
              : "border-gray-200 hover:border-brand_navy/40 hover:bg-gray-50"
          }`}
        >
          <DocumentArrowUpIcon className="w-6 h-6 text-brand_navy" />
          <span className="text-[13px] font-medium text-content">
            Drop a file here, or click to choose one
          </span>
          <span className="text-[11.5px] text-content/85">
            Nothing is uploaded — the file is read in this browser.
          </span>
        </button>

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) read(file);
            // Cleared so re-picking the same file still fires.
            e.target.value = "";
          }}
        />

        {error && (
          <div className="mt-3 px-3 py-2 rounded bg-severity_critical_bg text-[12px] text-severity_critical_text">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicesEntry;
