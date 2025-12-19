// Components
import Instructions from "../forecast/controls/Instructions";
import PriceSimControls from "./controls/PriceSimControls";
import PriceSimStorePicker from "./controls/PriceSimStorePicker";
import FilesGrid from "./controls/FilesGrid";
import PriceSimGrid from "./grid/PriceSimGrid";
import PriceSimCarousel from "./grid/PriceSimCarousel";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { useState } from "react";
import { setGlobalFcstPrice, setGlobalRows } from "../../features/priceSimSlice";

const PriceSimulator = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.priceSim);
  const [globalFcstText, setGlobalFcstText] = useState<string>("");

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isNaN(parseFloat(e.target.value)) || e.target.value === "") {
      setGlobalFcstText(e.target.value);
    }
  };
  const handleGlobalFcstPriceClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (e.currentTarget.innerText === "Clear") {
      setGlobalFcstText("");
      dispatch(setGlobalFcstPrice(""));
      dispatch(setGlobalRows([]));
      return;
    }
    dispatch(setGlobalFcstPrice(globalFcstText));
  };

  const handleEnterDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      dispatch(setGlobalFcstPrice(globalFcstText));
    }
  };
  return (
    <div
      data-testid="price-simulator-page"
      className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] p-4 gap-4 flex overflow-hidden"
    >
      <div className="grid grid-rows-[24%_45%_27%] col-span-2 gap-4 w-1/6">
        <Instructions />
        <PriceSimStorePicker />
        <FilesGrid />
      </div>
      <div className="ml-10">
        <PriceSimControls />
      </div>

      <div className="grid grid-rows-[25%_75%] mb-4 gap-4 w-full relative">
        <PriceSimCarousel />
        <div
          className={`${
            state.rowData.length === 0 && "hidden"
          } absolute left-0 top-[165px] flex items-end gap-2`}
        >
          <div>
            <label className="text-xs font-medium pl-0.5">
              Global Fcst Price
            </label>
            <input
              type="text"
              className="basic-input border-2 py-1 bg-custom-white w-32"
              value={globalFcstText}
              onChange={handleTextChange}
              onKeyDown={handleEnterDown}
            />
          </div>
          <div>
            <button
              className="btn-themeBlue py-1 px-4"
              onClick={handleGlobalFcstPriceClick}
            >
              {state.globalRows.length ? "Clear" : "Set"}
            </button>
          </div>
        </div>
        <PriceSimGrid />
      </div>
    </div>
  );
};

export default PriceSimulator;
