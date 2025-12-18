// Components
import Instructions from "../forecast/controls/Instructions";
import PriceSimControls from "./controls/PriceSimControls";
import PriceSimStorePicker from "./controls/PriceSimStorePicker";
import FilesGrid from "./controls/FilesGrid";
import PriceSimGrid from "./grid/PriceSimGrid";
import PriceSimCarousel from "./grid/PriceSimCarousel";
import { useAppSelector } from "../../hooks";

const PriceSimulator = () => {
  const state = useAppSelector((state) => state.priceSim);
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
          className={`${state.rowData.length === 0 && "hidden"} absolute left-0 top-[170px] flex items-end gap-2`}
        >
          <div>
            <label className="text-xs font-medium pl-0.5">
              Global Fcst Price
            </label>
            <input
              type="text"
              className="basic-input py-1 bg-custom-white w-32"
            />
          </div>
          <div>
            <button className="btn-themeBlue py-1 px-4">Set</button>
          </div>
        </div>
        <PriceSimGrid />
      </div>
    </div>
  );
};

export default PriceSimulator;
