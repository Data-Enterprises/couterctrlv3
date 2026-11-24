// Hooks
import { useRef } from "react";
import { useAppDispatch } from "../../../../hooks";
import { useItemReportCtx, useUpcEntry } from "../hooks";

// Redux
import {
  clearPendingUpload,
  setPendingUpcText,
  removePendingUpc,
} from "../../../../features/dev/devItemReportSlice";

/** The entry card's UPC box, copied from the UPC List card: a paste box, Add,
 *  Upload CSV and Clear all, what the list holds, and a chip per code. */
const UpcListField = () => {
  const dispatch = useAppDispatch();
  const fileRef = useRef<HTMLInputElement>(null);
  const { handleParseText, handleCsvUpload } = useUpcEntry();
  const {
    pendingUpcs: upcs,
    upcs: lastBuilt,
    pendingDepartments: departments,
    pendingFileName: fileName,
    pendingUpcText: upcText,
  } = useItemReportCtx();
  /** The codes the last Build ran on. A pending list that still holds them is
   *  being carried into the next Build, and adding to it extends that list
   *  rather than starting a new one (finding S). */
  const carried =
    lastBuilt.length > 0 && upcs.some((u) => lastBuilt.includes(u));

  return (
    <div data-help="upc-input">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-[11px] font-medium text-content/95 ml-0.5">
          UPCs
        </label>
        <span className="text-[10.5px] text-content/95">
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
          className="px-3 py-1 text-[11px] font-medium rounded border border-content/20 cc-muted-link hover:border-content/35"
        >
          Add
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="px-3 py-1 text-[11px] font-medium rounded border border-content/20 cc-muted-link hover:border-content/35"
        >
          Upload CSV
        </button>
        {upcs.length > 0 && (
          <button
            onClick={() => dispatch(clearPendingUpload())}
            className="px-3 py-1 text-[11px] font-medium rounded border border-brand_danger_line text-brand_danger transition-colors"
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
        <div className="text-[10.5px] text-content/95 mt-1.5">
          {fileName && `${fileName} · `}
          {upcs.length} UPC{upcs.length === 1 ? "" : "s"}
          {departments.length > 0
            ? ` · ${departments.length} departments named, so only those are read`
            : " · no department column, so every department is read"}
          {carried && (
            <span className="block mt-0.5 font-medium text-content">
              Includes the list from your last build. Clear all to start a new
              one.
            </span>
          )}
        </div>
      )}

      {upcs.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto thin-scrollbar">
          {upcs.map((upc) => (
            <span
              key={upc}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand_navy/10 text-brand_navy"
            >
              {upc}
              <button
                onClick={() => dispatch(removePendingUpc(upc))}
                className="text-brand_navy/95 hover:text-brand_navy transition-colors leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpcListField;
