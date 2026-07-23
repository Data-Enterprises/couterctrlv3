import { useRef } from "react";
import { useUpcDevCtx } from "../hooks/useUpcDevCtx";
import { useAppDispatch } from "../../../../hooks";
import {
  setDevUpcs,
  setDevUpcText,
  removeDevUpc,
  clearDevUpcs,
  setDevActiveTab,
  UPC_DEV_TABS,
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
      <div className="bg-custom-white rounded-2xl shadow-lg p-6 w-full max-w-sm flex flex-col gap-2">

        {/* title */}
        <div>
          <h2 className="text-base font-semibold text-content">UPC List</h2>
          <p className="text-[12px] text-content/85">
            Sales comp · Forecast · Price opt · Trend · Association
          </p>
        </div>

        {/* landing tab */}
        <div>
          <label className="block text-[12px] font-medium text-content mb-1">
            Open to
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {UPC_DEV_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => dispatch(setDevActiveTab(tab.id))}
                className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${
                  ctx.activeTab === tab.id
                    ? "bg-[#1e2a4a] border-[#1e2a4a] text-custom-white"
                    : "border-content/20 text-content/85 hover:text-content hover:border-content/35"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* store / group */}
        <StorePicker />

        {/* date range */}
        <DatePickers showBtn={false} />

        {/* UPC input */}
        <div>
          <label className="text-[11px] font-medium text-content/85 ml-0.5">
            UPCs
          </label>
          <textarea
            value={ctx.upcText}
            onChange={(e) => dispatch(setDevUpcText(e.target.value))}
            placeholder="Paste UPCs, comma or newline separated…"
            rows={4}
            className="basic-input bg-custom-white w-full mt-1 py-2 px-2.5 text-[13px] resize-none"
            style={{ outline: "none", boxShadow: "none" }}
          />
          <p className="text-[10.5px] text-content/85 mt-1">
            Separate multiple UPCs with commas or new lines
          </p>
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
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#1e2a4a]/10 text-[#1e2a4a]"
                >
                  {upc}
                  <button
                    onClick={() => dispatch(removeDevUpc(upc))}
                    className="text-[#1e2a4a]/85 hover:text-[#1e2a4a] transition-colors leading-none"
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
          Search
        </button>

      </div>
    </div>
  );
};

export default UpcSearchCard;
