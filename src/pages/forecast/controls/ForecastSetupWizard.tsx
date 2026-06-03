import { useState, useEffect } from "react";
import SingleSelect from "../../../components/SingleSelect";
import DatePickers from "../../../components/datePickers/DatePickers";
import SelectedStoreList from "../../upc/components/SelectedStoreList";
import FileInput from "./FileInput";
import FileGrid from "../grids/FileGrid";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import type { Store } from "../../../interfaces";
import type { Group } from "../../../features/groupSlice";

const options = [
  { label: "Stores", id: 1 },
  { label: "Group", id: 2 },
];

export interface WizardProps {
  radioId: number;
  filteredData: Store[] | Group[];
  selectedStores: Store[];
  storeids: string;
  upcs: string[];
  upcText: string;
  isLoading: boolean;
  noResults: boolean;
  endDate: string;
  onSelectChange: (id: string | number) => void;
  onSelectClick: (id: string | number) => void;
  onTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddUpc: (upc: string) => void;
  onRemoveUpc: (upc: string) => void;
  onEnterDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSearch: () => void;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
}

type Step = 1 | 2 | 3;
type UpcTab = "paste" | "upload" | "saved";

const ForecastSetupWizard = (props: WizardProps) => {
  const {
    radioId, filteredData, selectedStores, storeids, upcs, upcText,
    isLoading, noResults, endDate,
    onSelectChange, onSelectClick, onTextChange, onAddUpc, onRemoveUpc,
    onEnterDown, onSearch, setFile,
  } = props;

  const [step, setStep] = useState<Step>(1);
  const [upcTab, setUpcTab] = useState<UpcTab>("paste");

  const step1Done = storeids.length > 0;
  const step2Done = upcs.length > 0;

  // Auto-advance to step 3 when loading starts or no results come back
  useEffect(() => {
    if (isLoading || noResults) setStep(3);
  }, [isLoading, noResults]);

  const stepLabel = (n: number, label: string) => {
    const active = step === n;
    const done = (n === 1 && step1Done) || (n === 2 && step2Done);
    return (
      <button
        key={n}
        onClick={() => setStep(n as Step)}
        className="flex flex-col items-center gap-1 group"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
          active ? "bg-blue-500 border-blue-500 text-white" :
          done ? "bg-green-500 border-green-500 text-white" :
          "bg-white border-gray-300 text-gray-400"
        }`}>
          {done && !active ? "✓" : n}
        </div>
        <span className={`text-[11px] font-medium whitespace-nowrap ${active ? "text-blue-500" : done ? "text-green-600" : "text-gray-400"}`}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-0 py-4">
      <div
        className="bg-custom-white rounded-xl shadow-lg w-full max-w-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "calc(100vh - 5rem)" }}
      >
        {/* Stepper */}
        <div className="flex items-center justify-center gap-8 px-8 py-4 border-b border-gray-100 shrink-0">
          {stepLabel(1, "Store / Group")}
          <div
            className={`flex-1 h-0.5 max-w-16 ${step1Done ? "bg-green-400" : "bg-gray-200"}`}
          />
          {stepLabel(2, "UPC Source")}
          <div
            className={`flex-1 h-0.5 max-w-16 ${step2Done ? "bg-green-400" : "bg-gray-200"}`}
          />
          {stepLabel(3, "Review & Search")}
        </div>

        {/* Step content */}
        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar px-5 py-2">
          {/* ── Step 1 ── */}
          {step === 1 && (
            <div
              className="flex flex-col gap-3 h-full"
              style={{ minHeight: "365px" }}
            >
              <div className="text-[13px] font-medium text-gray-600">
                Select the store or store group to forecast for, and confirm the
                date range.
              </div>
              <div className="flex gap-2">
                <SingleSelect
                  data={options}
                  label="Store or Group"
                  displayKey="label"
                  valueKey="id"
                  onSelect={onSelectChange}
                  defaultQuery="Stores"
                  id={1}
                  className="w-1/2"
                  innerClass="py-1 text-[13px]"
                />
                {radioId === 1 ? (
                  <SingleSelect
                    label="Stores"
                    data={filteredData as Store[]}
                    displayKey={"store_name" as keyof Store}
                    valueKey={"storeid" as keyof Store}
                    onSelect={onSelectClick}
                    keepOpen={true}
                    resetQuery={true}
                    id={2}
                    className="w-1/2"
                    innerClass="py-1 text-[13px]"
                  />
                ) : (
                  <SingleSelect
                    label="Groups"
                    data={filteredData as Group[]}
                    valueKey={"id" as keyof Group}
                    displayKey={"group_name" as keyof Group}
                    onSelect={onSelectClick}
                    resetQuery={true}
                    id={2}
                    className="w-1/2"
                    innerClass="py-1 text-[13px]"
                  />
                )}
              </div>
              <DatePickers showBtn={false} />
              <div className="flex-1 min-h-0">
                <SelectedStoreList
                  selectedStores={selectedStores}
                  radioId={radioId}
                  className="h-full overflow-y-auto thin-scrollbar"
                  // className={`${selectedStores.length === 0 ? "hidden" : "h-full overflow-y-auto thin-scrollbar"}`}
                  context=""
                  ulContainerClass="grid grid-cols-4 gap-y-2"
                />
              </div>
            </div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <div className="flex flex-col gap-3">
              <div className="text-[13px] font-medium text-gray-600">
                Add the UPCs you want to forecast. Paste them, upload a CSV, or
                load a saved list.
              </div>

              {/* Tab switcher */}
              <div className="flex border-b border-gray-200">
                {(["paste", "upload", "saved"] as UpcTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setUpcTab(tab)}
                    className={`px-4 py-1.5 text-[13px] font-medium capitalize border-b-2 transition-colors ${
                      upcTab === tab
                        ? "border-blue-500 text-blue-500"
                        : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {tab === "paste"
                      ? "Paste UPCs"
                      : tab === "upload"
                        ? "Upload CSV"
                        : "Saved List"}
                  </button>
                ))}
              </div>

              {upcTab === "paste" && (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    data-testid="forecast-upc-input"
                    placeholder="Enter UPCs separated by commas…"
                    className="basic-input focus:border bg-custom-white py-1 text-[13px]"
                    value={upcText}
                    onChange={onTextChange}
                    onKeyDown={onEnterDown}
                  />
                  <div className="flex gap-2">
                    <button
                      className="btn-themeBlue py-1 w-1/2 text-[13px]"
                      onClick={() => onAddUpc(upcText)}
                    >
                      Add
                    </button>
                    <button
                      className="btn-themeBlue py-1 w-1/2 text-[13px]"
                      onClick={() => onAddUpc("")}
                    >
                      Clear
                    </button>
                  </div>
                  {upcs.length > 0 && (
                    <div className="bg-bkg rounded-lg p-2 grid grid-cols-3 gap-1 max-h-40 overflow-y-auto thin-scrollbar">
                      {upcs.map((u, i) => (
                        <div
                          key={i}
                          className="px-2 py-0.5 text-xs font-medium hover:text-blue-500 transition-colors cursor-pointer"
                          onClick={() => onRemoveUpc(u)}
                        >
                          {u}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {upcTab === "upload" && (
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-gray-400">
                    Upload a CSV file with one UPC per line.
                  </div>
                  <FileInput
                    page="forecast"
                    fileExt={[".csv"]}
                    setFile={setFile}
                    className="w-full"
                    labelClassName="h-10 text-[13px]"
                  />
                  {upcs.length > 0 && (
                    <div className="text-xs text-green-600 font-medium">
                      {upcs.length} UPCs loaded from file.
                    </div>
                  )}
                </div>
              )}

              {upcTab === "saved" && (
                <div className="flex flex-col gap-1">
                  <div className="text-xs text-gray-400 mb-1">
                    Click a saved list to load it directly.
                  </div>
                  <div style={{ height: "220px" }}>
                    <FileGrid />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <div className="flex flex-col items-center gap-4 py-5">
              {isLoading ? (
                <div className="flex flex-col items-center gap-3 relative py-4">
                  <LoadingIndicator
                    className="leading-tight-mt-1.5"
                    message="Running forecast…"
                  />
                  {/* <div className="text-[13px] text-gray-500">Running forecast…</div> */}
                </div>
              ) : noResults ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="text-4xl">🔍</div>
                  <div className="text-sm font-medium text-gray-600">
                    No results found
                  </div>
                  <div className="text-xs text-gray-400">
                    Try adjusting your UPCs or date range.
                  </div>
                  <button
                    className="btn-themeBlue py-1.5 px-6 text-[13px]"
                    onClick={() => setStep(2)}
                  >
                    ← Adjust UPCs
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                  <div className="text-base font-medium text-gray-700">
                    Ready to run
                  </div>
                  <div className="bg-bkg rounded-lg p-4 w-full text-[13px] space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Stores</span>
                      <span className="font-medium">
                        {selectedStores.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">UPCs</span>
                      <span className="font-medium">{upcs.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Period ending</span>
                      <span className="font-medium">{endDate}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer navigation */}
        {!isLoading && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 shrink-0">
            <button
              className={`btn-themeBlue py-1 px-4 text-[13px] ${step === 1 ? "opacity-0 pointer-events-none" : ""}`}
              onClick={() => setStep((s) => (s - 1) as Step)}
            >
              ← Back
            </button>
            <div className="text-xs text-gray-400">Step {step} of 3</div>
            {step < 3 ? (
              <button
                className={`btn-themeBlue py-1 px-4 text-[13px] ${
                  (step === 1 && !step1Done) || (step === 2 && !step2Done)
                    ? "opacity-40 pointer-events-none"
                    : ""
                }`}
                onClick={() => setStep((s) => (s + 1) as Step)}
              >
                Next →
              </button>
            ) : (
              <button
                className={`btn-themeGreen py-1 px-4 text-[13px] ${
                  !step1Done || !step2Done
                    ? "opacity-40 pointer-events-none"
                    : ""
                }`}
                onClick={onSearch}
              >
                Run Forecast
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForecastSetupWizard;
