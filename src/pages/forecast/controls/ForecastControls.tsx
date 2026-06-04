import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useScrollHeight } from "..";
import RadioBox from "../../../components/inputs/RadioBox";
import type { ForecastItem } from "../../../interfaces";
import CheckBox from "../../../components/inputs/CheckBox";
import {
  reset,
  setExportModalOpen,
  setSelectedUpcs,
  setRowData,
  setAllRows,
  resetRows,
} from "../../../features/forecastSlice";
import { clearUpcs } from "../../../features/upcUploadSlice";
import { clearAdListData } from "../../../features/adListSlice";

const ForecastControls = ({ onSettingsClick }: { onSettingsClick?: () => void }) => {
  const [filtered, setFiltered] = useState<ForecastItem[]>([]);
  const [filterText, setFilterText] = useState<string>("");
  // const [upcDisplay, setUpcDisplay] = useState<"code" | "desc">("code");
  const [showDisplay, setShowDisplay] = useState<"all" | "selected" | "stores">(
    "all",
  );
  const dispatch = useAppDispatch();
  const { topRef } = useScrollHeight();
  const state = useAppSelector((state) => state.forecast);
  const search = useAppSelector((state) => state.search);
  const [maxH, setMaxH] = useState<string>(
    window.innerWidth <= 1536
      ? "min-h-[300px] max-h-[300px]"
      : "min-h-[410px] max-h-[410px]",
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1536) {
        setMaxH("min-h-[300px] max-h-[300px]");
      } else {
        setMaxH("min-h-[410px] max-h-[410px]");
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleResetClick = () => {
    dispatch(reset());
    dispatch(clearUpcs());
    dispatch(clearAdListData());
  };

  const handleDisplay = (value: "all" | "selected" | "stores") => {
    setShowDisplay(value);
  };

  const handleExportBtnClick = () => {
    dispatch(setExportModalOpen(true));
  };

  useEffect(() => {
    if (filterText === "") {
      setFiltered(state.items);
    } else {
      const filtered = state.items.filter(
        (item) =>
          item.description.toLowerCase().includes(filterText.toLowerCase()) ||
          item.upc.toLowerCase().includes(filterText.toLowerCase()),
      );
      setFiltered(filtered);
    }
  }, [filterText, state.items]);

  const handleDeselectAll = () => {
    dispatch(resetRows());
  };

  const handleSelectAll = () => {
    dispatch(setAllRows());
  };

  const handleUpcSelect = (upc: string) => {
    const row = state.initialRowData.find((r) => r.upc === upc);
    dispatch(setSelectedUpcs(upc));
    dispatch(setRowData(row!));
  };

  const upcStyle = (selected: boolean) =>
    `flex items-center justify-between px-2 py-1 text-xs font-medium border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer ${
      selected ? "bg-blue-50 border-l-2 border-blue-500" : ""
    }`;

  const isSinglePriced = (upc: string) =>
    state.singlePriceResults.some((item) => item.upc === upc);

  return (
    <>
      {!state.noResults ? (
        <div
          data-testid="forecast-controls"
          className={`${
            state.items.length === 0 ? "hidden" : "animate-windowIn"
          } bg-custom-white rounded-lg shadow-lg text-sm select-none`}
        >
          <div ref={topRef}>
            <div className="bg-blue-500 text-white text-[13px] font-medium px-3 py-1 rounded-t-lg">
              90 Day · Ending {search.endDate}
            </div>
            <div className="flex flex-col gap-1 p-2">
              <div className="flex flex-col gap-2">
                <button
                  data-testid="forecast-controls-reset-btn"
                  className="py-1 btn-themeBlue text-[13px]"
                  onClick={handleResetClick}
                >
                  Reset
                </button>
                <button
                  data-testid="forecast-controls-settings-btn"
                  className="py-1 btn-themeBlue text-[13px]"
                  onClick={onSettingsClick}
                >
                  {/* Settings */}
                  Edit Search
                </button>
                <button
                  data-testid="forecast-controls-export-btn"
                  className="py-1 btn-themeBlue text-[13px]"
                  onClick={handleExportBtnClick}
                >
                  Export Csv
                </button>
              </div>
              <div className="flex flex-col gap-0.5">
                <RadioBox
                  value={showDisplay === "all"}
                  label={`Show All - ${state.items.length}`}
                  onChange={() => handleDisplay("all")}
                  id={1}
                />
                <RadioBox
                  value={showDisplay === "selected"}
                  label={`Show Selected - ${state.selectedUpcs.length}`}
                  onChange={() => handleDisplay("selected")}
                  id={2}
                />
                {/* <RadioBox
                value={showDisplay === "stores"}
                label={`Show Stores - ${state.selectedStores.length}`}
                onChange={() => handleDisplay("stores")}
                id={3}
              /> */}
              </div>
              <div className="flex flex-col gap-1">
                <button
                  data-testid="forecast-select-all-btn"
                  className="py-1 btn-themeGreen text-[13px]"
                  onClick={handleSelectAll}
                >
                  Select All
                </button>
                <button
                  data-testid="forecast-deselect-all-btn"
                  className="py-1 btn-themeOrange text-[13px]"
                  onClick={handleDeselectAll}
                >
                  Deselect All
                </button>
                {/* <button
                data-testid="forecast-toggle-display-btn"
                className="py-1 btn-themeBlue text-[13px]"
                onClick={() =>
                  setUpcDisplay(upcDisplay === "code" ? "desc" : "code")
                }
              >
                {upcDisplay === "code" ? "Show Desc" : "Show UPC"}
              </button> */}
              </div>
              <div>
                <input
                  data-testid="forecast-controls-filter-input"
                  type="text"
                  className="basic-input focus:border bg-custom-white py-1 text-[13px] w-full"
                  value={filterText}
                  onChange={(e) => setFilterText(e.currentTarget.value)}
                />
              </div>
            </div>
          </div>

          <div
            data-testid="upc-controls-list"
            className={`bg-custom-white rounded-b-lg overflow-y-scroll no-scrollbar ${maxH}`}
            // style={{ height: height || 500 }}
          >
            {showDisplay === "all" &&
              filtered.map((item, i) => (
                <div
                  key={i}
                  className={upcStyle(state.selectedUpcs.includes(item.upc))}
                  onClick={() => handleUpcSelect(item.upc)}
                >
                  <CheckBox
                    id={i}
                    // label={
                    //   upcDisplay === "code" ? item.upc : item.description
                    // }
                    label={item.upc}
                    value={state.selectedUpcs.includes(item.upc)}
                  />
                  {isSinglePriced(item.upc) && (
                    <span className="ml-1 text-[10px] text-gray-400 font-normal">
                      (1pt)
                    </span>
                  )}
                </div>
              ))}
            {showDisplay === "selected" &&
              state.items.map((item, i) => {
                if (!state.selectedUpcs.includes(item.upc)) return null;
                return (
                  <div
                    key={i}
                    data-testid={`selected-upc-${i}`}
                    className={upcStyle(true)}
                    onClick={() => dispatch(setSelectedUpcs(item.upc))}
                  >
                    <CheckBox
                      id={i}
                      // label={
                      //   upcDisplay === "code" ? item.upc : item.description
                      // }
                      label={item.upc}
                      value={state.selectedUpcs.includes(item.upc)}
                    />
                  </div>
                );
              })}
            {showDisplay === "stores" &&
              state.selectedStores.map((store, i) => {
                return (
                  <div
                    key={i}
                    className="text-[11px] leading-tight px-2 py-1 border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    {store.store_name}
                  </div>
                );
              })}
          </div>
        </div>
      ) : (
        <div className="w-48 h-full flex items-center justify-center bg-custom-white rounded-lg shadow-lg">
          No records found
        </div>
      )}
    </>
  );
};

export default ForecastControls;
