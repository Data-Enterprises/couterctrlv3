// Hooks
import { useRef } from "react";
import { useForecastCtx } from "../../hooks";
import { useUpcInput } from "../hooks";

// Redux
import {
  setUpcText,
  removeUpc,
  clearUpcs,
} from "../../../../../features/dev/devForecastDevSlice";

// Utils
import { PILL } from "../../utils";

/** The search card's UPC field: a box to paste into, Add, Upload CSV and
 *  Upload AD list, the UPCs so far as chips, and the AD list's note. */
const UpcField = () => {
  const { dispatch, upcText, upcs, adListRows, adListFileName } =
    useForecastCtx();
  const { handleParseText, handleCsvUpload, handleAdUpload } = useUpcInput();
  const fileRef = useRef<HTMLInputElement>(null);
  const adRef = useRef<HTMLInputElement>(null);

  return (
    <div>
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
        onChange={(e) => dispatch(setUpcText(e.target.value))}
        placeholder="Paste UPCs, comma or newline separated…"
        rows={4}
        className="basic-input bg-custom-white w-full mt-1 py-2 px-2.5 text-[13px] resize-none"
        style={{ outline: "none", boxShadow: "none" }}
      />
      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        <button onClick={handleParseText} className={PILL}>
          Add
        </button>
        <button onClick={() => fileRef.current?.click()} className={PILL}>
          Upload CSV
        </button>
        <button onClick={() => adRef.current?.click()} className={PILL}>
          Upload AD list
        </button>
        {upcs.length > 0 && (
          <button
            onClick={() => dispatch(clearUpcs())}
            className="px-3 py-1 text-[11px] font-medium rounded border border-brand_danger_line text-brand_danger hover:bg-brand_danger_bg transition-colors"
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
        <input
          ref={adRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleAdUpload}
        />
      </div>

      {upcs.length > 0 && (
        <div
          data-help="upc-input"
          className="mt-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto thin-scrollbar"
        >
          {upcs.map((upc) => (
            <span
              key={upc}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand_navy/10 text-brand_navy"
            >
              {upc}
              {adListRows[upc] && (
                <span className="text-[9px] font-semibold">AD</span>
              )}
              <button
                onClick={() => dispatch(removeUpc(upc))}
                className="text-brand_navy/95 hover:text-brand_navy transition-colors leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {adListFileName && (
        <p className="text-[10.5px] text-content/95 mt-1.5">
          Ad prices from {adListFileName} will be used as the forecast price for
          those items
        </p>
      )}
    </div>
  );
};

export default UpcField;
