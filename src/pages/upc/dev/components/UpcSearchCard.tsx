import { useRef } from "react";
import { useUpcDevCtx } from "../hooks/useUpcDevCtx";
import { useAppDispatch } from "../../../../hooks";
import {
  setDevUpcs,
  setDevUpcText,
  removeDevUpc,
  clearDevUpcs,
  setDevTrendPeriods,
} from "../../../../features/upcDevSlice";
import { useToast } from "../../../../components/toasts/hooks/useToast";

import StorePicker from "../../../../components/storePicker/StorePicker";
import DatePickers from "../../../../components/datePickers/DatePickers";

interface Props {
  onSearch: () => void;
}

const parseUpcs = (text: string): string[] =>
  text
    .split(/[\n,;\r\t ]+/)
    .map((u) => u.trim())
    .filter((u) => u.length > 0 && /^\d+$/.test(u));

const UpcSearchCard = ({ onSearch }: Props) => {
  const ctx = useUpcDevCtx();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleParseText = () => {
    const parsed = parseUpcs(ctx.upcText);
    if (!parsed.length) {
      toast.warn("No valid UPCs found");
      return;
    }
    dispatch(setDevUpcs(parsed));
    dispatch(setDevUpcText(""));
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseUpcs(text);
      if (parsed.length) {
        dispatch(setDevUpcs(parsed));
        toast.success(`Added ${parsed.length} UPCs from file`);
      } else {
        toast.warn("No valid UPCs found in file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3rem)] overflow-hidden mx-4 pb-12 md:pb-8">
      <div className="bg-custom-white rounded-2xl shadow-lg p-6 w-full max-w-sm flex flex-col gap-4">

        {/* title */}
        <div>
          <h2 className="text-base font-semibold text-content">UPC Workbook</h2>
          <p className="text-[12px] text-content/50 mt-1">
            Sales comp · Forecast · Price opt · Trend · Association
          </p>
        </div>

        {/* store / group */}
        <StorePicker />

        {/* date range */}
        <DatePickers showBtn={false} />

        {/* trend periods */}
        <div>
          <label className="block text-[12px] font-medium text-content/70 mb-1">
            Trend periods (days)
          </label>
          <input
            type="number"
            value={ctx.trendPeriods}
            min={30}
            max={365}
            onChange={(e) => dispatch(setDevTrendPeriods(Number(e.target.value)))}
            className="basic-input w-28 text-[13px] py-1"
            style={{ outline: "none", WebkitAppearance: "none", boxShadow: "none" }}
          />
        </div>

        {/* UPC input */}
        <div>
          <label className="block text-[12px] font-medium text-content/70 mb-1">
            UPCs
          </label>
          <textarea
            value={ctx.upcText}
            onChange={(e) => dispatch(setDevUpcText(e.target.value))}
            placeholder="Paste UPCs, comma or newline separated…"
            rows={3}
            className="basic-input w-full text-[13px] resize-none"
            style={{ outline: "none", boxShadow: "none" }}
          />
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <button
              onClick={handleParseText}
              className="px-3 py-1 text-[11px] font-medium rounded border border-content/20 text-content/60 hover:text-content/80 hover:border-content/35 transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="px-3 py-1 text-[11px] font-medium rounded border border-content/20 text-content/60 hover:text-content/80 hover:border-content/35 transition-colors"
            >
              Upload CSV
            </button>
            {ctx.upcs.length > 0 && (
              <button
                onClick={() => dispatch(clearDevUpcs())}
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

          {ctx.upcs.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto thin-scrollbar">
              {ctx.upcs.map((upc) => (
                <span
                  key={upc}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-[#1e2a4a]/10 text-[#1e2a4a]"
                >
                  {upc}
                  <button
                    onClick={() => dispatch(removeDevUpc(upc))}
                    className="text-[#1e2a4a]/50 hover:text-[#1e2a4a] transition-colors leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* run */}
        <button
          onClick={onSearch}
          className="w-full py-2 text-sm font-semibold text-custom-white rounded-lg bg-[#1e2a4a] hover:bg-[#2a3a63] transition-colors cursor-pointer select-none disabled:opacity-50"
          disabled={!ctx.upcs.length}
        >
          Run
        </button>

      </div>
    </div>
  );
};

export default UpcSearchCard;
