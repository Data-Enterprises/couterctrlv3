import RadioBox from "../../../../components/inputs/RadioBox";
import { setSelectedMode } from "../../../../features/upcSlice";
import { useAppSelector, useAppDispatch } from "../../../../hooks";

const modes = [
  { mode: 1, label: "Sales Comparison" },
  { mode: 2, label: "Sales Forecast" },
  { mode: 3, label: "Price Optimization" },
  { mode: 4, label: "Trend Detection" },
];

const ModelSelect = () => {
  const dispatch = useAppDispatch();
  const { selectedMode } = useAppSelector((state) => state.upc);

  const handleModeSelect = (mode: number) => {
    if (selectedMode !== mode) {
      dispatch(setSelectedMode(mode));
    } else {
      dispatch(setSelectedMode(0));
    }
  };

  return (
    <div className="flex flex-col justify-around items-center gap-2 mt-2">
      <div className="w-full text-center text-sm text-content/70">
        Select the mode you would like to view
      </div>
      <div className="grid grid-cols-2 gap-4">
        {modes.map((mode) => (
          <div key={mode.mode} onClick={() => handleModeSelect(mode.mode)}>
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

export default ModelSelect;
