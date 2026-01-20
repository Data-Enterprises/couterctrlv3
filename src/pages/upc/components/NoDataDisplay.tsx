import { useUpcContext } from "../wizard/hooks";

const NoDataDisplay = () => {
  const { selectedMode } = useUpcContext();
  const modeText = () => {
    if (selectedMode === 1) return "Sales Comparison";
    if (selectedMode === 2) return "Sales Forecast";
    if (selectedMode === 3) return "Price Optimization";
    if (selectedMode === 4) return "Trend Detection";
    return "";
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
      <div className="bg-custom-white rounded-lg shadow-lg p-8 text-center w-1/4">
        <div className="text-lg font-medium">Data not yet fetched</div>
        <div className="text-content/70">
          Click Search next to{" "}
          <span className="font-medium text-content">{modeText()}</span>
        </div>
        <div className="text-content/70">To view the data for this module</div>
      </div>
    </div>
  );
};

export default NoDataDisplay;