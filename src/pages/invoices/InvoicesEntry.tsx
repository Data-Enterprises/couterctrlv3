import { useRef, useState } from "react";
import { DocumentArrowUpIcon, XMarkIcon } from "@heroicons/react/20/solid";

/**
 * The drop card.
 *
 * Just the card — the page supplies the frame around it, full-page before a
 * file has been read and an overlay after. Owning only the card is what lets
 * the two look identical: the re-read is the same card, not a shrunken copy of
 * it inside a generic modal shell.
 *
 * The same shape every other page's entry card takes, with a drop zone where
 * they have a store picker and a date. Nothing is fetched: the file is read and
 * decoded in the browser, so the "search" here is local work and finishes in
 * milliseconds.
 *
 * The file must be read as **ISO-8859-1**. These are fixed-width records, and
 * reading them as UTF-8 shifts every column after the first non-ASCII byte —
 * which decodes as bad data rather than as an encoding error, so it would be
 * blamed on the vendor.
 */
interface Props {
  onFile: (text: string, fileName: string) => void;
  error: string | null;
  /** Set when the card is the re-read overlay: adds the close control. Absent
   *  on the first read, where there is nothing to go back to. */
  onClose?: () => void;
}

const InvoicesEntry = ({ onFile, error, onClose }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const read = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) =>
      onFile(String(event.target?.result ?? ""), file.name);
    reader.readAsText(file, "ISO-8859-1");
  };

  return (
    <div className="bg-custom-white rounded-xl shadow-sm w-full max-w-[560px] overflow-hidden">
      <div className="bg-[#1e2a4a] px-4 py-2.5 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-custom-white text-[13px] font-semibold">
            {onClose ? "Read another file" : "Invoices"}
          </p>
          <p className="text-custom-white/85 text-[12px]">
            Drop an AWG electronic invoice file to read it. Every line is
            checked against the invoice&rsquo;s own printed totals before
            anything is shown.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            title="Keep the file already open"
            className="flex-shrink-0 p-1 -mr-1 rounded text-custom-white/85 hover:text-custom-white hover:bg-custom-white/10 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
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
              ? "border-[#1e2a4a] bg-filter_active"
              : "border-gray-200 hover:border-[#1e2a4a]/40 hover:bg-gray-50"
          }`}
        >
          <DocumentArrowUpIcon className="w-6 h-6 text-[#1e2a4a]" />
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
