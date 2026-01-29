import { useAppSelector } from "../../../hooks";
import type {
  ForecastOutlierRow,
  SimBtns,
} from "../../../features/forecastSlice";
import { formatCurrency2 } from "../../../utils";

interface ForecastSimMetricsProps {
  sim: keyof SimBtns;
  rowData: ForecastOutlierRow[];
}
const ForecastSimMetrics = ({ sim, rowData }: ForecastSimMetricsProps) => {
  const state = useAppSelector((state) => state.forecast);

  const getTotals = () => {
    return rowData.reduce(
      (acc, row) => {
        return {
          adFcst: acc.adFcst + row.adFcst,
          fcstTotal: acc.fcstTotal + row.fcstTotal,
          markdownDollars: acc.markdownDollars + row.markdownDollars,
        };
      },
      { adFcst: 0, fcstTotal: 0, markdownDollars: 0 }
    );
  };

  if (state.simBtns[sim] === 0) {
    return (
      <span className="bg-custom-white rounded-lg shadow-lg flex items-center justify-center min-h-[124px] max-h-[124px]">
        <div className="font-medium py-0.5 rounded-t-lg text-center text-lg underline">
          {state.simTitles[sim as keyof SimBtns]}
        </div>
      </span>
    );
  }

  return (
    <span className="bg-custom-white rounded-lg shadow-lg min-h-[124px] max-h-[124px]">
      <div className="font-medium py-0.5 rounded-t-lg text-center underline">
        {state.simTitles[sim as keyof SimBtns]}
      </div>
      <div className="py-2 px-4 text-sm">
        <div className="flex gap-1">
          <div>Ad Item Count:</div>
          <div className="font-semibold">{rowData.length}</div>
        </div>
        <div className="flex gap-1">
          <div>Ad Forecast Qty:</div>
          <div className="font-semibold">{getTotals().adFcst}</div>
        </div>
        <div className="flex gap-1">
          <div>Forecast Total:</div>
          <div className="font-semibold">
            {formatCurrency2(getTotals().fcstTotal)}
          </div>
        </div>
        <div className="flex gap-1">
          <div>Markdown Dollars:</div>
          <div className="font-semibold">
            {formatCurrency2(getTotals().markdownDollars)}
          </div>
        </div>
      </div>
    </span>
  );
};

export default ForecastSimMetrics;
