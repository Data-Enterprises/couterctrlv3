// Components
import FileGrid from "../forecast/grids/FileGrid";
import Instructions from "../forecast/controls/Instructions";
import PriceSimControls from "./controls/PriceSimControls";
import PriceSimStorePicker from "./controls/PriceSimStorePicker";

const PriceSimulator = () => {
  return (
    <div
      data-testid="price-simulator-page"
      className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] p-4 gap-4 flex overflow-hidden"
    >
      <div className="grid grid-rows-[24%_45%_27%] col-span-2 gap-4 w-1/6">
        <Instructions />
        <PriceSimStorePicker />
        <FileGrid />
      </div>
      {/* col 2 of 10 */}
      <div className="ml-10">
        <PriceSimControls />
      </div>

      {/* The magic happens here */}
      {/* Grid layout */}
      <div>Other calcs/comps</div>
    </div>
  );
};

export default PriceSimulator;
