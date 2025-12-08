import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { useScrollHeight } from "../upc/components";
import CheckBox from "../../components/inputs/CheckBox";
import RadioBox from "../../components/inputs/RadioBox";

import {
  setClipboardText,
  setMenuPosition,
} from "../../features/ctxMenuSlice";

const ForecastControls = () => {
  // const [filtered, setFiltered] = useState<UpcItem[]>([]);
  const [filterText, setFilterText] = useState<string>("");
  const [upcDisplay, setUpcDisplay] = useState<"code" | "desc">("code");
  const [showDisplay, setShowDisplay] = useState<"all" | "selected" | "stores">(
    "all"
  );
  const dispatch = useAppDispatch();
  const { height, topRef } = useScrollHeight();
  const state = useAppSelector((state) => state.upc);

  const handleClearClick = () => {
    // dispatch(clearUpcData());
  };

  const handleDisplay = (value: "all" | "selected" | "stores") => {
    setShowDisplay(value);
  };

  const handleExportBtnClick = () => {
    // dispatch(setModalType(state.selectedMode));
    // dispatch(setOpenModal(true));
  };

  const handleRightClick = (
    e: React.MouseEvent<HTMLDivElement>,
    option: any
  ) => {
    e.preventDefault();
    // if (options.length > 2) options.pop();

    dispatch(
      setClipboardText({
        upc: option.product_code,
        desc: option.description,
      })
    );
    dispatch(setMenuPosition({ x: e.pageX + 5, y: e.pageY }));
  };

  // useEffect(() => {
  //   if (filterText === "") {
  //     setFiltered(upcItems);
  //   } else {
  //     const filtered = upcItems.filter(
  //       (item) =>
  //         item.description.toLowerCase().includes(filterText.toLowerCase()) ||
  //         item.product_code.toLowerCase().includes(filterText.toLowerCase())
  //     );
  //     setFiltered(filtered);
  //   }
  // }, [filterText, upcItems]);

  return (
    <div data-testid="forecast-controls" className="grid bg-custom-white rounded-lg shadow-lg text-sm select-none">
      <div
        ref={topRef}
        className="flex flex-col gap-2 rounded-t-lg px-2 pt-3 pb-2"
      >
        <div className="font-medium text-center rounded-t-lg">
          Dates
          {/* {startDate} - {selectedMode === 4 ? `${trendPeriods} Days` : endDate} */}
        </div>
        <div className="flex flex-col gap-2">
          <button data-testid="upc-controls-reset-btn" className="py-1 btn-themeBlue" onClick={handleClearClick}>
            Reset
          </button>
          <button
            data-testid="upc-controls-export-btn"
            className="py-1 btn-themeGreen"
            onClick={handleExportBtnClick}
          >
            Export Csv
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <RadioBox
            value={showDisplay === "all"}
            label={`Show All - ${0}`}
            onChange={() => handleDisplay("all")}
            id={1}
          />
          <RadioBox
            value={showDisplay === "selected"}
            label={`Show Selected - ${0}`}
            onChange={() => handleDisplay("selected")}
            id={2}
          />
          <RadioBox
            value={showDisplay === "stores"}
            label={`Show Stores - ${0}`}
            onChange={() => handleDisplay("stores")}
            id={3}
          />
        </div>
        <div className="flex flex-col gap-2">
          <button
            data-testid="upc-deselect-all-btn"
            className="py-1 btn-themeOrange"
            onClick={() => {}}
          >
            Deselect All
          </button>
          <button
            data-testid="upc-toggle-display-btn"
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
            data-testid="upc-filter-input"
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
        style={{ minHeight: height, maxHeight: height }}
      >
        {/* {showDisplay === "all" &&
          filtered.map((item, i) => (
            <div
              key={i}
              className={`even:bg-blue-200 px-2 py-1 text-xs font-medium hover:bg-blue-100 transition-all duration-200 cursor-pointer`}
              onClick={() => dispatch(setSelectedUpcs(item.product_code))}
              onContextMenu={(e) => handleRightClick(e, item)}
            >
              <CheckBox
                id={i}
                label={
                  upcDisplay === "code" ? item.product_code : item.description
                }
                value={selectedUpcs.includes(item.product_code)}
              />
            </div>
          ))}
        {showDisplay === "selected" &&
          upcItems.map((item, i) => {
            if (!selectedUpcs.includes(item.product_code)) return null;
            return (
              <div
                key={i}
                data-testid={`selected-upc-${i}`}
                className={`even:bg-blue-200 px-2 py-1 text-xs font-medium hover:bg-blue-100 transition-all duration-200 cursor-pointer`}
                onClick={() => dispatch(setSelectedUpcs(item.product_code))}
              >
                <CheckBox
                  id={i}
                  label={
                    upcDisplay === "code" ? item.product_code : item.description
                  }
                  value={selectedUpcs.includes(item.product_code)}
                />
              </div>
            );
          })}
        {showDisplay === "stores" &&
          selectedStores.map((store, i) => {
            return (
              <div
                key={i}
                className={`even:bg-blue-200 px-2 py-1 font-medium hover:bg-blue-100 transition-all duration-200 cursor-pointer`}
              >
                {store.store_number} - {store.store_name}
              </div>
            );
          })} */}
      </div>
    </div>
  );
};

export default ForecastControls;
