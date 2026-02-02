import RadioBox from "../../../components/inputs/RadioBox";
import { setSelectedMode } from "../../../features/upcSlice";
import { useAppSelector, useAppDispatch } from "../../../hooks";

const modes = [
  { mode: 1, label: "Sales Comparison" },
  { mode: 2, label: "Sales Forecast" },
  { mode: 3, label: "Price Optimization" },
  { mode: 4, label: "Trend Detection" },
  { mode: 5, label: "UPC Association" },
];

const ModeSelect = () => {
  const dispatch = useAppDispatch();
  const {
    selectedMode,
    salesComp,
    forecast,
    optBestPrices,
    upcTrends,
    uploadedUpcs,
  } = useAppSelector((state) => state.upc);

  const handleModeSelect = (mode: number) => {
    dispatch(setSelectedMode(mode));
  };

  const activeStyle = (mode: number) => {
    let active = false;

    if (mode === 1) active = salesComp.length > 0;
    else if (mode === 2) active = forecast.length > 0;
    else if (mode === 3) active = optBestPrices.length > 0;
    else if (mode === 4) active = upcTrends.length > 0;
    else if (mode === 5) active = uploadedUpcs.length > 0;

    return active ? "bg-orange-200 rounded-full" : "";
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg select-none">
      <div className="bg-blue-500 font-medium rounded-t-lg text-custom-white px-2 py-0.5">
        Select Mode
      </div>
      <div className="grid grid-cols-2 text-sm p-2 gap-2">
        {modes.map((mode) => (
          <div
            key={mode.mode}
            onClick={() => handleModeSelect(mode.mode)}
            className={
              activeStyle(mode.mode) +
              " cursor-pointer py-1 px-2 flex items-center"
            }
          >
            <RadioBox
              label={mode.label}
              value={selectedMode === mode.mode}
              onChange={() => dispatch(setSelectedMode(mode.mode))}
              id={mode.mode}
            />
          </div>
        ))}
      </div>
      <div className="px-4 text-sm text-content/60 flex items-center gap-1">
        <div className="h-1.5 w-1.5 bg-content/60 rounded-full"></div>
        <div className="pb-[2px]">activated modes will appear highlighted</div>
      </div>
    </div>
  );
};

export default ModeSelect;
