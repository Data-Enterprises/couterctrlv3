import { useRef } from "react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import StorePicker from "../../../components/storePicker/StorePicker";
import SingleDatePicker from "../../../components/datePickers/SingleDatePicker";
import EntryCardLoading from "../../../components/loading/EntryCardLoading";
import { isAdListFile, parseAdListWorkbook } from "../adListParse";
import {
  addUpcs,
  setUpcText,
  removeUpc,
  clearUpcs,
  setUploadedAdList,
} from "../../../features/forecastDevSlice";
import { getStoreName } from "../../../utils";

/**
 * Forecast entry — the search card.
 *
 * UPC List's search card with two changes: one date instead of a range (the
 * endpoint takes the end of the history window and walks 90 days back from it),
 * and an AD list upload beside the CSV one.
 *
 * The AD list isn't a convenience import: its prices are injected into the
 * price history before the forecast is fitted, so it changes every figure on
 * the page. Its items join the list like any other UPC and carry an AD badge on
 * the chip, so it's clear which ones are priced off the ad.
 */

const PILL =
  "px-3 py-1 text-[11px] font-medium rounded border border-content/20 text-content/85 hover:text-content hover:border-content/35 transition-colors";

const parseUpcs = (text: string): string[] =>
  text
    .split(/[\n,;\r\t ]+/)
    .map((u) => u.trim())
    .filter((u) => u.length > 0 && /^\d+$/.test(u));

interface Props {
  onSearch: () => void;
  isLoading: boolean;
  loadingMessage?: string;
  /** Passed only when the card is a re-search overlay — shows a close button
   *  and drops the full-page centering, same contract as UpcSearchCard. */
  onClose?: () => void;
  /** Shown in the card, so a failed search explains itself where the user is
   *  already looking rather than in a toast they may have missed. */
  notice?: string;
}

const ForecastEntry = ({
  onSearch,
  isLoading,
  loadingMessage = "Loading forecast...",
  onClose,
  notice,
}: Props) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const adRef = useRef<HTMLInputElement>(null);
  const search = useAppSelector((s) => s.search);
  const assignedStores = useAppSelector((s) => s.user.assignedStores);
  // Dev's own list — see the note in forecastDevSlice. Nothing loaded here
  // reaches the legacy page or the UPC List page.
  const { upcs, upcText, adListRows, adListFileName } = useAppSelector(
    (s) => s.forecastDev,
  );

  const handleParseText = () => {
    const parsed = parseUpcs(upcText);
    if (!parsed.length) {
      toast.warn("No valid UPCs found");
      return;
    }
    dispatch(addUpcs(parsed));
    dispatch(setUpcText(""));
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseUpcs(ev.target?.result as string);
      if (parsed.length) {
        dispatch(addUpcs(parsed));
        toast.success(`Added ${parsed.length} UPCs from file`);
      } else {
        toast.warn("No valid UPCs found in file");
      }
    };
    reader.readAsText(file);
    // Cleared so picking the same file twice still fires a change event.
    e.target.value = "";
  };

  const handleAdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!isAdListFile(file.name)) {
      toast.warn("Please select an Excel (.xlsx) file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rows = parseAdListWorkbook(ev.target!.result as ArrayBuffer);
        if (!rows.length) {
          toast.warn("No UPCs found in that AD list");
          return;
        }
        dispatch(setUploadedAdList({ rows, fileName: file.name }));
        toast.success(`Added ${rows.length} UPCs from the AD list`);
      } catch {
        toast.error("Failed to parse AD list file");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Echoed under the spinner, same derivation SearchCard uses.
  const searchLabel = [
    search.type === "Group"
      ? search.selectedGroup.group_name
      : getStoreName(
          assignedStores,
          search.selectedStore.storeid,
          search.selectedStore.store_name,
        ),
    search.singleDate,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={
        onClose
          ? "w-full max-w-sm"
          : "flex items-center justify-center min-h-[calc(100vh-3rem)] overflow-hidden mx-4 pb-12 md:pb-8"
      }
    >
      <div className="bg-custom-white rounded-2xl shadow-lg p-6 w-full max-w-sm flex flex-col gap-2">
        {/* title */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-content">Forecast</h2>
            <p className="text-[12px] text-content/85">
              Ad-week units, revenue and markdown at a price you choose, from 90
              days of sales history
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close search"
              className="flex-shrink-0 -mt-1 -mr-1 p-1 rounded text-content/60 hover:text-content hover:bg-[#1e2a4a]/10 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="relative flex flex-col gap-2">
          <div
            className="flex flex-col gap-2"
            style={isLoading ? { visibility: "hidden" } : undefined}
          >
            {notice && (
              <div className="px-2.5 py-2 rounded-lg bg-amber-50 text-[11.5px] text-amber-900 leading-snug">
                {notice}
              </div>
            )}

            {/* store / group */}
            <StorePicker />

            {/* the end of the history window */}
            <SingleDatePicker />

            {/* UPC input */}
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
                <button
                  onClick={() => fileRef.current?.click()}
                  className={PILL}
                >
                  Upload CSV
                </button>
                <button onClick={() => adRef.current?.click()} className={PILL}>
                  Upload AD list
                </button>
                {upcs.length > 0 && (
                  <button
                    onClick={() => dispatch(clearUpcs())}
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
                <input
                  ref={adRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleAdUpload}
                />
              </div>

              {upcs.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto thin-scrollbar">
                  {upcs.map((upc) => (
                    <span
                      key={upc}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#1e2a4a]/10 text-[#1e2a4a]"
                    >
                      {upc}
                      {adListRows[upc] && (
                        <span className="text-[9px] font-semibold">AD</span>
                      )}
                      <button
                        onClick={() => dispatch(removeUpc(upc))}
                        className="text-[#1e2a4a]/85 hover:text-[#1e2a4a] transition-colors leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {adListFileName && (
                <p className="text-[10.5px] text-content/85 mt-1.5">
                  Ad prices from {adListFileName} will be used as the forecast
                  price for those items
                </p>
              )}
            </div>

            {/* run */}
            <button
              onClick={onSearch}
              disabled={!upcs.length || isLoading}
              className="w-full py-2 text-sm font-semibold text-custom-white rounded-lg bg-[#1e2a4a] hover:bg-[#2a3a63] transition-colors cursor-pointer select-none disabled:opacity-50"
            >
              {upcs.length > 1 ? `Forecast ${upcs.length} items` : "Forecast"}
            </button>
          </div>

          {isLoading && (
            <EntryCardLoading message={loadingMessage} context={searchLabel} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ForecastEntry;
