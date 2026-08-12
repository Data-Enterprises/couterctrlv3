import { useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import {
  setPendingUpload,
  clearPendingUpload,
  setPendingUpcText,
  addPendingUpcs,
  removePendingUpc,
} from "../../features/itemReportSlice";
import SingleStoreSearchCard from "../../components/SingleStoreSearchCard";
import SingleDatePicker from "../../components/datePickers/SingleDatePicker";
import { parseUpload } from "./parseUpload";
import { RECEIVING_LOOKBACK_DAYS, WINDOW_DAYS } from "./itemReportData";
import type { Store } from "../../interfaces";

/**
 * The entry screen: a store, a week, and a list of UPCs.
 *
 * The date is a single week-ending picker, not a range — the same contract the
 * graded pages work to. Every window on this page is seven days, so letting
 * someone pick an arbitrary range would only give them a way to make the three
 * periods incomparable.
 *
 * The UPC input copies the UPC List card exactly: a paste box, Add / Upload CSV
 * / Clear all, and chips for what's been collected. That page is where these
 * users already build lists, and a second, different upload affordance in the
 * same nav category is a thing to relearn for no reason.
 */

interface Props {
  stores: Store[];
  storeId: number;
  onStoreSelect: (id: number) => void;
  onRun: (upcs: string[], departments: string[]) => void;
  loading: boolean;
  loadingMessage: string;
}

const ItemReportEntry = ({
  stores,
  storeId,
  onStoreSelect,
  onRun,
  loading,
  loadingMessage,
}: Props) => {
  const dispatch = useAppDispatch();
  const fileRef = useRef<HTMLInputElement>(null);
  const upcs = useAppSelector((s) => s.itemReport.pendingUpcs);
  const departments = useAppSelector((s) => s.itemReport.pendingDepartments);
  const fileName = useAppSelector((s) => s.itemReport.pendingFileName);
  const upcText = useAppSelector((s) => s.itemReport.pendingUpcText);

  const handleParseText = () => {
    const parsed = parseUpload(upcText);
    if (parsed.upcs.length === 0) return;
    dispatch(addPendingUpcs(parsed.upcs));
    dispatch(setPendingUpcText(""));
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseUpload(String(ev.target?.result ?? ""));
      if (parsed.upcs.length === 0) return;
      // A CSV replaces rather than merges: it carries the department column that
      // narrows the fan-out, and merging two files' departments would widen the
      // read back out without saying so.
      dispatch(
        setPendingUpload({
          upcs: parsed.upcs,
          departments: parsed.departments,
          fileName: file.name,
        }),
      );
    };
    reader.readAsText(file);
    // Cleared so re-picking the same file still fires.
    e.target.value = "";
  };

  return (
    <SingleStoreSearchCard
      title="Item Report"
      description="Upload a UPC list exported from Sub Dept Margins or Vendors to see how each item sold, what it cost, and when it last arrived."
      buttonLabel="Build report"
      stores={stores}
      selectedStoreId={storeId}
      onStoreSelect={onStoreSelect}
      onSearch={() => onRun(upcs, departments)}
      loading={loading}
      loadingMessage={loadingMessage}
      datePicker={
        <div className="flex flex-col gap-1.5">
          <SingleDatePicker />
          <span className="text-[10.5px] text-content/85 leading-snug">
            The {WINDOW_DAYS} days ending on that date, against the same week
            last week and last year. Deliveries are read back{" "}
            {RECEIVING_LOOKBACK_DAYS} days.
          </span>
        </div>
      }
    >
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <label className="text-[11px] font-medium text-content/85 ml-0.5">
            UPCs
          </label>
          <span className="text-[10.5px] text-content/85">
            Separate by comma or new lines
          </span>
        </div>
        <textarea
          value={upcText}
          onChange={(e) => dispatch(setPendingUpcText(e.target.value))}
          placeholder="Paste UPCs, comma or newline separated…"
          rows={4}
          className="basic-input bg-custom-white w-full mt-1 py-2 px-2.5 text-[13px] resize-none"
          style={{ outline: "none", boxShadow: "none" }}
        />
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <button
            onClick={handleParseText}
            className="px-3 py-1 text-[11px] font-medium rounded border border-content/20 text-content/85 hover:text-content hover:border-content/35 transition-colors"
          >
            Add
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="px-3 py-1 text-[11px] font-medium rounded border border-content/20 text-content/85 hover:text-content hover:border-content/35 transition-colors"
          >
            Upload CSV
          </button>
          {upcs.length > 0 && (
            <button
              onClick={() => dispatch(clearPendingUpload())}
              className="px-3 py-1 text-[11px] font-medium rounded border border-red-200 text-red-400 hover:text-red-600 transition-colors"
            >
              Clear all
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={handleCsvUpload}
          />
        </div>

        {/* Worth saying out loud: a file with a department column is the
            difference between reading a dozen departments and reading all of
            them. */}
        {upcs.length > 0 && (
          <div className="text-[10.5px] text-content/85 mt-1.5">
            {fileName && `${fileName} · `}
            {upcs.length} UPC{upcs.length === 1 ? "" : "s"}
            {departments.length > 0
              ? ` · ${departments.length} departments named, so only those are read`
              : " · no department column, so every department is read"}
          </div>
        )}

        {upcs.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto thin-scrollbar">
            {upcs.map((upc) => (
              <span
                key={upc}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#1e2a4a]/10 text-[#1e2a4a]"
              >
                {upc}
                <button
                  onClick={() => dispatch(removePendingUpc(upc))}
                  className="text-[#1e2a4a]/85 hover:text-[#1e2a4a] transition-colors leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </SingleStoreSearchCard>
  );
};

export default ItemReportEntry;
