import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useUpcContext } from "../hooks";
import {
  addSelectedUpcParam,
  clearUpcData,
  removeSelectedUpcParam,
  resetAssociations,
  resetDeeperLvlQueryUpcs,
  resetSelectedUpcs,
  setAllSelectedUpcParam,
  setAllSelectedUpcs,
  setSelectedOptItem,
  setSelectedUpcs,
  setOptDisplayMode,
  setTrendMode,
} from "../../../features/upcSlice";
import { useScrollHeight } from ".";
import CheckBox from "../../../components/inputs/CheckBox";
import RadioBox from "../../../components/inputs/RadioBox";
import { setModalType, setOpenModal } from "../../../features/upcModalSlice";

import {
  setClipboardText,
  setMenuPosition,
} from "../../../features/ctxMenuSlice";
import type { UpcItem, UpcPriceOpt } from "../../../interfaces";

const UpcControls = () => {
  const [filtered, setFiltered] = useState<UpcItem[]>([]);
  const [filterText, setFilterText] = useState<string>("");
  const [upcDisplay, setUpcDisplay] = useState<"code" | "desc">("code");
  const [showDisplay, setShowDisplay] = useState<"all" | "selected" | "stores">(
    "all",
  );
  const {
    startDate,
    endDate,
    upcItems,
    selectedMode,
    trendPeriods,
    selectedUpcs,
    selectedStores,
    selectedAssociationUpcParam,
    uploadedUpcs,
  } = useUpcContext();
  const dispatch = useAppDispatch();
  const { height, topRef } = useScrollHeight();
  const state = useAppSelector((state) => state.upc);

  const handleClearClick = () => {
    dispatch(clearUpcData());
  };

  const handleDisplay = (value: "all" | "selected" | "stores") => {
    setShowDisplay(value);
  };

  const handleExportBtnClick = () => {
    dispatch(setModalType(state.selectedMode));
    dispatch(setOpenModal(true));
  };

  const handleRightClick = (
    e: React.MouseEvent<HTMLDivElement>,
    option: UpcItem,
  ) => {
    e.preventDefault();

    dispatch(
      setClipboardText({
        upc: option.product_code,
        desc: option.description,
      }),
    );
    dispatch(setMenuPosition({ x: e.pageX + 5, y: e.pageY }));
  };

  useEffect(() => {
    if (filterText === "") {
      setFiltered(upcItems);
    } else {
      const filtered = upcItems.filter(
        (item) =>
          item.description.toLowerCase().includes(filterText.toLowerCase()) ||
          item.product_code.toLowerCase().includes(filterText.toLowerCase()),
      );
      setFiltered(filtered);
    }
  }, [filterText, upcItems]);

  const handleSelectAll = () => {
    // Upc Association select all
    if (state.selectedMode === 5) {
      dispatch(resetAssociations());
      dispatch(setAllSelectedUpcParam(uploadedUpcs));
    }
    dispatch(setAllSelectedUpcs(upcItems.map((item) => item.product_code)));
  };

  const handleCheckedValue = (pc: string) => {
    if (selectedMode === 5) {
      return selectedAssociationUpcParam.includes(pc);
    } else {
      return selectedUpcs.includes(pc);
    }
  };

  const handleUnselectAll = () => {
    if (state.selectedMode === 5) {
      dispatch(resetAssociations());
      dispatch(resetDeeperLvlQueryUpcs());
    }
    dispatch(setSelectedOptItem({} as UpcPriceOpt));
    dispatch(setOptDisplayMode("multiRow"));
    dispatch(resetSelectedUpcs());
  };

  const handleSingleUpcSelect = (pc: string) => {
    if (selectedMode === 5) {
      if (selectedAssociationUpcParam.includes(pc)) {
        dispatch(removeSelectedUpcParam(pc));
      } else {
        dispatch(addSelectedUpcParam(pc));
      }
      dispatch(resetAssociations());
    }

    dispatch(setSelectedUpcs(pc));
  };

  return (
    <div
      data-testid="upc-controls"
      className="grid bg-custom-white rounded-lg shadow-lg text-sm select-none"
    >
      <div className="flex flex-col gap-2 rounded-t-lg px-2 pt-3 pb-2">
        <div className="font-medium text-center rounded-t-lg">
          {startDate} - {selectedMode === 4 ? `${trendPeriods} Days` : endDate}
        </div>
        <div className="flex flex-col gap-2">
          <button
            data-testid="upc-controls-reset-btn"
            className="py-1 btn-themeBlue"
            onClick={handleClearClick}
          >
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
        {state.selectedMode === 4 ? (
          <div
            data-testid="trend-options"
            className="border-y-2 py-1 border-content/40 flex flex-col gap-1"
          >
            <button
              data-testid="trend-totals-btn"
              className={`btn-themeBlue py-1 w-full ${
                state.trendMode === "Totals" ? "btn-themeGreen" : ""
              }`}
              onClick={() => dispatch(setTrendMode("Totals"))}
            >
              Totals
            </button>
            <button
              data-testid="trend-mean-btn"
              className={`btn-themeBlue py-1 w-full ${
                state.trendMode === "Mean" ? "btn-themeGreen" : ""
              }`}
              onClick={() => dispatch(setTrendMode("Mean"))}
            >
              Mean
            </button>
            <button
              data-testid="trend-volatility-btn"
              className={`btn-themeBlue py-1 w-full ${
                state.trendMode === "Volatility" ? "btn-themeGreen" : ""
              }`}
              onClick={() => dispatch(setTrendMode("Volatility"))}
            >
              Volatility
            </button>
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <RadioBox
            value={showDisplay === "all"}
            label={`Show All - ${upcItems.length}`}
            onChange={() => handleDisplay("all")}
            id={10}
          />
          <RadioBox
            value={showDisplay === "selected"}
            label={`Show Selected - ${selectedUpcs.length}`}
            onChange={() => handleDisplay("selected")}
            id={20}
          />
          <RadioBox
            value={showDisplay === "stores"}
            label={`Show Stores - ${selectedStores.length}`}
            onChange={() => handleDisplay("stores")}
            id={30}
          />
        </div>
        <div className="flex flex-col gap-2">
          <button
            data-testid="upc-select-all-btn"
            className="py-1 btn-themeGreen"
            onClick={handleSelectAll}
          >
            Select All
          </button>
          <button
            data-testid="upc-deselect-all-btn"
            className="py-1 btn-themeOrange"
            onClick={handleUnselectAll}
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
        <div ref={topRef}>
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
        className="rounded-b-lg overflow-y-scroll no-scrollbar"
        style={{ minHeight: height, maxHeight: height }}
      >
        {showDisplay === "all" &&
          filtered.map((item, i) => (
            <div
              key={i}
              className={`even:bg-blue-200 px-2 py-1 text-xs font-medium hover:bg-blue-100 transition-all duration-200 cursor-pointer`}
              onClick={() => handleSingleUpcSelect(item.product_code)}
              onContextMenu={(e) => handleRightClick(e, item)}
            >
              <CheckBox
                id={i}
                label={
                  upcDisplay === "code" ? item.product_code : item.description
                }
                value={handleCheckedValue(item.product_code)}
              />
            </div>
          ))}
        {showDisplay === "selected" &&
          upcItems.map((item, i) => {
            if (!handleCheckedValue(item.product_code)) return null;
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
          })}
      </div>
    </div>
  );
};

export default UpcControls;
