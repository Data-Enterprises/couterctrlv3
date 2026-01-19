import RadioBox from "../../../../components/inputs/RadioBox";
import { setSelectedMode } from "../../../../features/upcSlice";
import { useAppSelector, useAppDispatch } from "../../../../hooks";

const modes = [
  { mode: 1, label: "Sales Comparison" },
  { mode: 2, label: "Sales Forecast" },
  { mode: 3, label: "Price Optimization" },
  { mode: 4, label: "Trend Detection" },
];

const ModeSelect = () => {
  const dispatch = useAppDispatch();
  const { selectedMode } = useAppSelector((state) => state.upc);

  const handleModeSelect = (mode: number) => {
    dispatch(setSelectedMode(mode));
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg select-none">
      <div className="bg-blue-500 font-medium rounded-t-lg text-custom-white px-2 py-0.5">
        Select Mode
      </div>
      <div className="grid grid-cols-2 text-sm p-4 gap-4">
        {modes.map((mode) => (
          <div
            key={mode.mode}
            onClick={() => handleModeSelect(mode.mode)}
            className="flex items-center justify-between"
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
    </div>
  );
};

export default ModeSelect;
