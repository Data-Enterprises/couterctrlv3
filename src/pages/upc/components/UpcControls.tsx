import { useState } from "react";
import { useAppDispatch } from "../../../hooks";
import { useUpcContext } from "../wizard/hooks";
import {
  clearUpcData,
  resetSelectedUpcs,
  setSelectedUpcs,
} from "../../../features/upcSlice";
import { useScrollHeight } from ".";
import CheckBox from "../../../components/inputs/CheckBox";
import RadioBox from "../../../components/inputs/RadioBox";

const UpcControls = () => {
  const [upcDisplay, setUpcDisplay] = useState<"code" | "desc">("code");
  const [showDisplay, setShowDisplay] = useState<"all" | "selected" | "stores">(
    "all"
  );
  const {
    startDate,
    endDate,
    upcItems,
    selectedMode,
    trendPeriods,
    selectedUpcs,
    selectedStores,
  } = useUpcContext();
  const dispatch = useAppDispatch();
  const { height, topRef } = useScrollHeight();

  const handleClearClick = () => {
    dispatch(clearUpcData());
  };

  const handleDisplay = (value: "all" | "selected" | "stores") => {
    setShowDisplay(value);
  };

  return (
    <div className="grid bg-custom-white rounded-lg shadow-lg text-sm">
      <div
        ref={topRef}
        className="flex flex-col gap-2 rounded-t-lg px-2 pt-3 pb-2"
      >
        <div className="font-medium text-center rounded-t-lg">
          {startDate} - {selectedMode === 4 ? `${trendPeriods} Days` : endDate}
        </div>
        <div className="flex flex-col gap-2">
          <button className="py-1 btn-themeBlue" onClick={handleClearClick}>
            Reset
          </button>
          <button className="py-1 btn-themeGreen">Export Csv</button>
        </div>
        <div className="flex flex-col gap-2">
          <RadioBox
            value={showDisplay === "all"}
            label={`Show All - ${upcItems.length}`}
            onChange={() => handleDisplay("all")}
            id={1}
          />
          <RadioBox
            value={showDisplay === "selected"}
            label={`Show Selected - ${selectedUpcs.length}`}
            onChange={() => handleDisplay("selected")}
            id={2}
          />
          <RadioBox
            value={showDisplay === "stores"}
            label={`Show Stores - ${selectedStores.length}`}
            onChange={() => handleDisplay("stores")}
            id={3}
          />
        </div>
        <div className="flex flex-col gap-2">
          <button
            className="py-1 btn-themeOrange"
            onClick={() => dispatch(resetSelectedUpcs())}
          >
            Deselect All
          </button>
          <button
            className="py-1 btn-themeBlue"
            onClick={() =>
              setUpcDisplay(upcDisplay === "code" ? "desc" : "code")
            }
          >
            {upcDisplay === "code" ? "Show Desc" : "Show UPC"}
          </button>
        </div>
        <input
          type="text"
          className="basic-input focus:border bg-custom-white py-1 w-full"
        />
      </div>

      <div
        className="bg-custom-white rounded-b-lg overflow-y-scroll no-scrollbar"
        style={{ minHeight: height, maxHeight: height }}
      >
        {showDisplay === "all" &&
          upcItems.map((item, i) => (
            <div
              key={i}
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
          ))}
        {showDisplay === "selected" &&
          upcItems.map((item, i) => {
            if (!selectedUpcs.includes(item.product_code)) return null;
            return (
              <div
                key={i}
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
