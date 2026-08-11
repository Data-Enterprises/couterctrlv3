import { useRef, useState } from "react";
import { ArrowUpTrayIcon, DocumentTextIcon } from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { setStartDate, setEndDate } from "../../features/searchSlice";
import { addDays, formatDate } from "../../utils";
import SingleStoreSearchCard from "../../components/SingleStoreSearchCard";
import DatePickers from "../../components/datePickers/DatePickers";
import { parseUpload, type ParsedUpload } from "./parseUpload";
import { RECEIVING_LOOKBACK_DAYS } from "./itemReportData";
import type { Store } from "../../interfaces";

/**
 * The entry screen: a store, a window, and a list of UPCs.
 *
 * Built on the shared search card rather than a bespoke form, with the upload
 * in its `children` slot — the store selector and date pickers behave here
 * exactly as they do on every other page, and only the part that's actually new
 * to this page looks new.
 *
 * A file and a paste are the same input. The parser doesn't care which it got,
 * so neither does the form; pasting is just faster when someone has a handful
 * of codes rather than an export.
 */

interface Props {
  stores: Store[];
  storeId: number;
  onStoreSelect: (id: number) => void;
  onRun: (parsed: ParsedUpload) => void;
  loading: boolean;
  loadingMessage: string;
}

/** The sales window the page is designed around. Deliveries are read further
 *  back than this on purpose — see RECEIVING_LOOKBACK_DAYS — because "when did
 *  this last arrive" is a question about the item, not about the range someone
 *  picked here. */
const DEFAULT_DAYS = 30;

const ItemReportEntry = ({
  stores,
  storeId,
  onStoreSelect,
  onRun,
  loading,
  loadingMessage,
}: Props) => {
  const dispatch = useAppDispatch();
  const { startDate, endDate } = useAppSelector((s) => s.search);
  const fileRef = useRef<HTMLInputElement>(null);

  const [parsed, setParsed] = useState<ParsedUpload | null>(null);
  const [fileName, setFileName] = useState("");
  const [pasting, setPasting] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [problem, setProblem] = useState("");

  const accept = (text: string, name: string) => {
    const result = parseUpload(text);
    if (result.upcs.length === 0) {
      setParsed(null);
      setFileName("");
      setProblem("No UPCs found — expected at least one column of digits.");
      return;
    }
    setProblem("");
    setParsed(result);
    setFileName(name);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => accept(String(ev.target?.result ?? ""), file.name);
    reader.readAsText(file);
    // Cleared so re-picking the same file after a failed parse still fires.
    e.target.value = "";
  };

  const applyDefaultWindow = () => {
    dispatch(
      setStartDate(formatDate(addDays(new Date(), -DEFAULT_DAYS).toString())),
    );
    dispatch(setEndDate(formatDate(addDays(new Date(), -1).toString())));
  };

  const run = () => {
    if (!parsed) {
      setProblem("Upload or paste a list of UPCs first.");
      return;
    }
    onRun(parsed);
  };

  return (
    <SingleStoreSearchCard
      title="Item Report"
      description="Upload a UPC list exported from Sub Dept Margins or Vendors to see how each item sold, what it cost, and when it last arrived."
      buttonLabel="Build report"
      stores={stores}
      selectedStoreId={storeId}
      onStoreSelect={onStoreSelect}
      onSearch={run}
      loading={loading}
      loadingMessage={loadingMessage}
      datePicker={
        <div className="flex flex-col gap-1.5">
          <DatePickers showBtn={false} stacked />
          <button
            onClick={applyDefaultWindow}
            className="self-start text-[11px] text-blue-700 hover:text-blue-900 hover:underline transition-colors"
          >
            Use last {DEFAULT_DAYS} days
          </button>
          <span className="text-[10.5px] text-content/60 leading-snug">
            {startDate} – {endDate} for sales. Deliveries are read back{" "}
            {RECEIVING_LOOKBACK_DAYS} days either way.
          </span>
        </div>
      }
    >
      <div className="flex flex-col gap-1.5">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt"
          onChange={onFile}
          className="hidden"
        />

        {parsed ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-2">
            <div className="flex items-center gap-1.5">
              <DocumentTextIcon className="w-4 h-4 text-blue-800 flex-shrink-0" />
              <span className="text-[12px] font-medium text-blue-900 truncate">
                {fileName || "Pasted list"}
              </span>
            </div>
            <div className="text-[11px] text-blue-900 mt-0.5">
              {parsed.upcs.length} UPC{parsed.upcs.length === 1 ? "" : "s"}
              {/* Worth saying out loud: it's the difference between reading a
                  dozen departments and reading all of them. */}
              {parsed.departments.length > 0
                ? ` · ${parsed.departments.length} departments named, so only those are read`
                : " · no department column, so every department is read"}
            </div>
            <button
              onClick={() => {
                setParsed(null);
                setFileName("");
                setPasteText("");
              }}
              className="text-[11px] text-blue-800 hover:text-blue-900 hover:underline mt-1 transition-colors"
            >
              Replace
            </button>
          </div>
        ) : pasting ? (
          <>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="One UPC per line"
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-[12px] text-content bg-custom-white resize-none"
              style={{
                outline: "none",
                WebkitAppearance: "none",
                boxShadow: "none",
              }}
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => accept(pasteText, "")}
                className="text-[11px] text-blue-700 hover:text-blue-900 hover:underline transition-colors"
              >
                Use these
              </button>
              <button
                onClick={() => setPasting(false)}
                className="text-[11px] text-content/60 hover:text-content transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex flex-col items-center gap-1 border border-dashed border-gray-300 hover:border-gray-400 rounded-lg py-3.5 transition-colors"
            >
              <ArrowUpTrayIcon className="w-4 h-4 text-content/50" />
              <span className="text-[12px] text-content">
                Choose a .csv or .txt
              </span>
            </button>
            <button
              onClick={() => setPasting(true)}
              className="self-start text-[11px] text-blue-700 hover:text-blue-900 hover:underline transition-colors"
            >
              or paste a list
            </button>
          </>
        )}

        {problem && (
          <div className="px-2.5 py-2 rounded-lg bg-amber-50 text-[11.5px] text-amber-900 leading-snug">
            {problem}
          </div>
        )}
      </div>
    </SingleStoreSearchCard>
  );
};

export default ItemReportEntry;
