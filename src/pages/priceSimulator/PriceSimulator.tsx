// Components
import Instructions from "../forecast/controls/Instructions";
import PriceSimControls from "./controls/PriceSimControls";
import PriceSimStorePicker from "./controls/PriceSimStorePicker";
import { useEffect } from "react";
import FilesGrid from "./controls/FilesGrid";

// import { sampleData, calcFcstQty } from "./calc";
import PriceSimGrid from "./grid/PriceSimGrid";

const PriceSimulator = () => {
  useEffect(() => {
    console.log("Price Simulator Mounted");
    // calcFcstQty(sampleData[0].prices, 10.99);
  }, []);

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

      <div className="grid grid-cols-2 gap-4 w-full">
        <PriceSimGrid />
      </div>
    </div>
  );
};

export default PriceSimulator;
