// Components
import Instructions from "../forecast/controls/Instructions";
import PriceSimControls from "./controls/PriceSimControls";
import PriceSimStorePicker from "./controls/PriceSimStorePicker";
import FilesGrid from "./controls/FilesGrid";
import PriceSimGrid from "./grid/PriceSimGrid";

const PriceSimulator = () => {
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

      <div className="grid grid-rows-[25%_75%] w-full">
        <div></div>
        
        <PriceSimGrid />
      </div>
    </div>
  );
};

export default PriceSimulator;
