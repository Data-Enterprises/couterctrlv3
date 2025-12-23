import Carousel from "../../../components/Carousel";
import { useAppSelector } from "../../../hooks";
import { formatCurrency2 } from "../../../utils";

const ForecastCarousel = () => {
  const state = useAppSelector((state) => state.forecast);

  if (state.selectedUpcs.length === 0) return null;

  const tempClass =
    "text-lg font-medium bg-custom-white rounded-lg shadow-lg flex items-center justify-center h-40";

  // totals: ad fcst, fcst total, markdown dollars

  const getTotals = () => {
    return state.rowData.reduce(
      (acc, row) => {
        return {
          totalSold: acc.totalSold + row.qtySold,
          adFcst: acc.adFcst + row.adFcst,
          fcstTotal: acc.fcstTotal + row.fcstTotal,
          markdownDollars: acc.markdownDollars + row.markdownDollars,
        };
      },
      { adFcst: 0, fcstTotal: 0, markdownDollars: 0, totalSold: 0 }
    );
  };

  return (
    <Carousel className="min-h-[230px]">
      <div className="grid grid-cols-4 gap-4">
        <span className="bg-custom-white rounded-lg shadow-lg">
          <div className="font-medium py-0.5 rounded-t-lg text-center text-lg underline">
            Forecast Simulation 1
          </div>
          <div className="py-2 px-4 text-sm">
            <div className="flex gap-1">
              <div>Ad Item Count:</div>
              <div className="font-semibold">{state.rowData.length}</div>
            </div>
            <div className="flex gap-1">
              <div>Ad Forecast Qty:</div>
              <div className="font-semibold">{getTotals().adFcst}</div>
            </div>
            <div className="flex gap-1">
              <div>Forecast Total:</div>
              <div className="font-semibold">{formatCurrency2(getTotals().fcstTotal)}</div>
            </div>
            <div className="flex gap-1">
              <div>Markdown Dollars:</div>
              <div className="font-semibold">{formatCurrency2(getTotals().markdownDollars)}</div>
            </div>
          </div>
        </span>
        <span className={tempClass}>Forecasting Overview 2</span>
        <span className={tempClass}>Forecasting Overview 3</span>
        <span className={tempClass}>Forecasting Overview 4</span>
      </div>
    </Carousel>
  );
};

export default ForecastCarousel;
