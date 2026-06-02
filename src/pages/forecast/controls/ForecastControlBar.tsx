import { useAppDispatch, useAppSelector } from "../../../hooks";
import {
  reloadRowData,
  resetSimulations,
  setGlobalFcstPrice,
  updateGlobalFcstRows,
  setGlobalAdDays,
  updateGlobalAdDaysRows,
} from "../../../features/forecastSlice";

interface ForecastControlBarProps {
  onItemsToggle?: () => void;
  showItemsPanel?: boolean;
  onSave?: () => void;
}

const ForecastControlBar = ({
  onItemsToggle,
  showItemsPanel,
  onSave,
}: ForecastControlBarProps) => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.forecast);

  const simsFull = Object.values(state.simBtns).every((v) => v === 1);

  return (
    <div className="bg-custom-white rounded-lg shadow-lg flex flex-col justify-between p-2">
      <div className="grid grid-cols-2 gap-2">
        {/* Global Price */}
        <div className="flex flex-col gap-1 mb-1 leading-tight">
          <label
            htmlFor="global-price"
            className="text-[10px] font-medium text-gray-400"
          >
            Global Price
          </label>
          <div className="flex items-center gap-1">
            <input
              id="global-price"
              data-testid="global-price-input"
              type="text"
              className="basic-input focus:border py-0.5 bg-custom-white flex-1 min-w-0 text-[12px]"
              value={state.globalFcstPrice}
              onChange={(e) =>
                dispatch(setGlobalFcstPrice(e.currentTarget.value))
              }
            />
            <button
              data-testid="set-global-price-btn"
              className="btn-themeBlue py-1 text-[12px] px-2 shrink-0"
              onClick={() => dispatch(updateGlobalFcstRows())}
            >
              Set
            </button>
          </div>
        </div>

        {/* Global Ad Days */}
        <div className="flex flex-col gap-1 mb-1 leading-tight">
          <label
            htmlFor="global-addays"
            className="text-[10px] font-medium text-gray-400"
          >
            Global Ad Days
          </label>
          <div className="flex items-center gap-1">
            <input
              id="global-addays"
              data-testid="global-addays-input"
              type="text"
              className="basic-input focus:border py-0.5 bg-custom-white flex-1 min-w-0 text-[12px]"
              value={state.globalAdDays}
              onChange={(e) => dispatch(setGlobalAdDays(e.currentTarget.value))}
            />
            <button
              data-testid="set-global-addays-btn"
              className="btn-themeBlue py-1 text-[12px] px-2 shrink-0"
              onClick={() => dispatch(updateGlobalAdDaysRows())}
            >
              Set
            </button>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-1">
        <div className="grid grid-cols-2 gap-1">
          <button
            data-testid="reload-sim-btn"
            className="btn-themeBlue py-1 px-0 text-[12px] flex-1"
            onClick={() => dispatch(reloadRowData())}
          >
            Reset Grid
          </button>
          <button
            data-testid="reset-sim-btn"
            className="btn-themeOrange py-1 px-0 text-[12px] flex-1"
            onClick={() => dispatch(resetSimulations())}
          >
            Reset Sims
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <button
            data-testid="save-new-sim-btn"
            className={`btn-themeGreen py-1 px-0 text-[12px] ${simsFull ? "opacity-50 pointer-events-none" : ""}`}
            onClick={onSave}
          >
            Save Sim
          </button>
          <button
            data-testid="items-toggle-btn"
            className={`py-1 px-0 text-[12px] rounded-lg border-2 transition-all ${
              showItemsPanel
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-blue-500 border-blue-300 hover:border-blue-500"
            }`}
            onClick={onItemsToggle}
          >
            Items ☰
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForecastControlBar;
