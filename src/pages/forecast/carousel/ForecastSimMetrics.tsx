import { useAppSelector } from "../../../hooks";
import type { ForecastOutlierRow, SimBtns } from "../../../features/forecastSlice";
import { formatCurrency2 } from "../../../utils";

interface ForecastSimMetricsProps {
  sim: keyof SimBtns;
  rowData: ForecastOutlierRow[];
  onClick?: () => void;
  onSave?: () => void;
}

const ForecastSimMetrics = ({ sim, rowData, onClick, onSave }: ForecastSimMetricsProps) => {
  const state = useAppSelector((state) => state.forecast);
  const isActive = state.selectedSim === sim;
  const hasData = state.simBtns[sim] === 1;

  const getTotals = () => {
    return rowData.reduce(
      (acc, row) => ({
        adFcst: acc.adFcst + row.adFcst,
        fcstTotal: acc.fcstTotal + row.fcstTotal,
        markdownDollars: acc.markdownDollars + row.markdownDollars,
      }),
      { adFcst: 0, fcstTotal: 0, markdownDollars: 0 }
    );
  };

  if (!hasData) {
    return (
      <span
        className="bg-custom-white rounded-lg shadow-lg flex items-center justify-center opacity-50 cursor-pointer hover:opacity-70 transition-opacity select-none"
        onDoubleClick={onSave}
        title="Double-click to save current simulation here"
      >
        <div className="font-medium py-0.5 rounded-t-lg text-center text-sm underline">
          {state.simTitles[sim as keyof SimBtns]}
        </div>
      </span>
    );
  }

  return (
    <span
      className={`bg-custom-white rounded-lg shadow-lg cursor-pointer transition-all duration-150 select-none ${
        isActive
          ? "ring-2 ring-green-500 shadow-xl"
          : "hover:shadow-xl hover:ring-1 hover:ring-blue-300"
      }`}
      onClick={onClick}
    >
      <div className="font-medium py-0.5 rounded-t-lg text-center underline text-sm">
        {state.simTitles[sim as keyof SimBtns]}
      </div>
      <div className="py-1 space-y-0.5 px-4 text-[12.5px]">
        <div className="flex gap-1 justify-between">
          <div>Ad Item Count:</div>
          <div className="font-semibold">{rowData.length}</div>
        </div>
        <div className="flex gap-1 justify-between">
          <div>Ad Fcst Qty:</div>
          <div className="font-semibold">{getTotals().adFcst}</div>
        </div>
        <div className="flex gap-1 justify-between">
          <div>Fcst Total:</div>
          <div className="font-semibold">{formatCurrency2(getTotals().fcstTotal)}</div>
        </div>
        <div className="flex gap-1 justify-between">
          <div>Markdown $:</div>
          <div className="font-semibold">{formatCurrency2(getTotals().markdownDollars)}</div>
        </div>
      </div>
    </span>
  );
};

export default ForecastSimMetrics;
