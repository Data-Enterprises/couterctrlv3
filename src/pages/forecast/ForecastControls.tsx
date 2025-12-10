import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { useScrollHeight } from ".";
import RadioBox from "../../components/inputs/RadioBox";
import type { ForecastItem } from "../../interfaces";
import CheckBox from "../../components/inputs/CheckBox";
import {
  reset,
  resetSelectedUpcs,
  setAllUpcs,
  setExportModalOpen,
  setSelectedUpcs,
} from "../../features/forecastSlice";

const ForecastControls = () => {
  const [filtered, setFiltered] = useState<ForecastItem[]>([]);
  const [filterText, setFilterText] = useState<string>("");
  const [upcDisplay, setUpcDisplay] = useState<"code" | "desc">("code");
  const [showDisplay, setShowDisplay] = useState<"all" | "selected" | "stores">(
    "all"
  );
  const dispatch = useAppDispatch();
  const { height, topRef } = useScrollHeight();
  const state = useAppSelector((state) => state.forecast);
  const search = useAppSelector((state) => state.search);

  const handleClearClick = () => {
    dispatch(reset());
  };

  const handleDisplay = (value: "all" | "selected" | "stores") => {
    setShowDisplay(value);
  };

  const handleExportBtnClick = () => {
    // exportData(state.historyData, headers, 'test_history.csv');
    dispatch(setExportModalOpen(true));
  };

  useEffect(() => {
    if (filterText === "") {
      setFiltered(state.items);
    } else {
      const filtered = state.items.filter(
        (item) =>
          item.description.toLowerCase().includes(filterText.toLowerCase()) ||
          item.upc.toLowerCase().includes(filterText.toLowerCase())
      );
      setFiltered(filtered);
    }
  }, [filterText, state.items]);

  const handleDeselectAll = () => {
    dispatch(resetSelectedUpcs());
  };

  const handleSelectAll = () => {
    const allUpcs = state.qty.map((item) => item.upc);
    dispatch(setAllUpcs(allUpcs));
  };

  return (
    <div
      data-testid="forecast-controls"
      className={`${
        state.items.length === 0 ? "hidden" : "animate-windowIn"
      } bg-custom-white rounded-lg shadow-lg text-sm select-none`}
    >
      <div
        ref={topRef}
        className="flex flex-col gap-2 rounded-t-lg px-2 pt-3 pb-2"
      >
        <div className="font-medium text-center rounded-t-lg">
          {search.startDate} - {search.endDate}
        </div>
        <div className="flex flex-col gap-2">
          <button
            data-testid="forecast-controls-reset-btn"
            className="py-1 btn-themeBlue"
            onClick={handleClearClick}
          >
            Reset
          </button>
          <button
            data-testid="forecast-controls-export-btn"
            className="py-1 btn-themeGreen"
            onClick={handleExportBtnClick}
          >
            Export Csv
          </button>
        </div>
        <div className="flex flex-col gap-2">
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
          <RadioBox
            value={showDisplay === "stores"}
            label={`Show Stores - ${state.selectedStores.length}`}
            onChange={() => handleDisplay("stores")}
            id={3}
          />
        </div>
        <div className="flex flex-col gap-2">
          <button
            data-testid="forecast-select-all-btn"
            className="py-1 btn-themeGreen"
            onClick={handleSelectAll}
          >
            Select All
          </button>
          <button
            data-testid="forecast-deselect-all-btn"
            className="py-1 btn-themeOrange"
            onClick={handleDeselectAll}
          >
            Deselect All
          </button>
          <button
            data-testid="forecast-toggle-display-btn"
            className="py-1 btn-themeBlue"
            onClick={() =>
              setUpcDisplay(upcDisplay === "code" ? "desc" : "code")
            }
          >
            {upcDisplay === "code" ? "Show Desc" : "Show UPC"}
          </button>
        </div>
        <div>
          <input
            data-testid="forecast-controls-filter-input"
            type="text"
            className="basic-input focus:border bg-custom-white py-1 w-full"
            value={filterText}
            onChange={(e) => setFilterText(e.currentTarget.value)}
          />
        </div>
      </div>

      <div
        data-testid="upc-controls-list"
        className="bg-custom-white rounded-b-lg overflow-y-scroll no-scrollbar"
        style={{ height: height || 500 }}
      >
        {showDisplay === "all" &&
          filtered.map((item, i) => (
            <div
              key={i}
              className={`even:bg-blue-200 px-2 py-1 text-xs font-medium hover:bg-blue-100 transition-all duration-200 cursor-pointer`}
              onClick={() => dispatch(setSelectedUpcs(item.upc))}
              // onContextMenu={(e) => handleRightClick(e, item)}
            >
              <CheckBox
                id={i}
                label={upcDisplay === "code" ? item.upc : item.description}
                value={state.selectedUpcs.includes(item.upc)}
              />
            </div>
          ))}
        {showDisplay === "selected" &&
          state.items.map((item, i) => {
            if (!state.selectedUpcs.includes(item.upc)) return null;
            return (
              <div
                key={i}
                data-testid={`selected-upc-${i}`}
                className={`even:bg-blue-200 px-2 py-1 text-xs font-medium hover:bg-blue-100 transition-all duration-200 cursor-pointer`}
                onClick={() => dispatch(setSelectedUpcs(item.upc))}
              >
                <CheckBox
                  id={i}
                  label={upcDisplay === "code" ? item.upc : item.description}
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
                className={`even:bg-blue-200 px-2 py-1 font-medium hover:bg-blue-100 transition-all duration-200 cursor-pointer`}
              >
                {store.store_number} - {store.store_name}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default ForecastControls;
