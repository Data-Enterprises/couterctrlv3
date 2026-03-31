import { setSelectedWeekDay } from "../../../features/subMarginSlice";
import { useAppDispatch } from "../../../hooks";
import { formatCurrency2 } from "../../../utils";
import type { BarData } from "../display/widgets";
import { useSubMarginCtx } from "../hooks";

const MarginDayCardOverview = (margin: BarData) => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();

  const handleCardClick = (date: string) => {
    if (date === ctx.selectedWeekDay) {
      dispatch(setSelectedWeekDay(""));
    } else {
      dispatch(setSelectedWeekDay(date));
    }
  };
  
  return (
    <div
      className="bg-custom-white rounded-lg shadow-md text-sm"
      onClick={() => handleCardClick(margin.date)}
    >
      <div className="bg-blue-500 text-custom-white rounded-t-lg py-0.5 px-2 font-medium">
        {margin.date}
      </div>
      <div className="grid grid-cols-3 gap-2 p-2">
        <div>
          <div className="text-content/60">Total $ </div>
          <div className="font-medium">{formatCurrency2(margin.sales)}</div>
        </div>
        <div>
          <div className="text-content/60">Net $</div>
          <div className="font-medium">{formatCurrency2(margin.net)}</div>
        </div>
        <div>
          <div className="text-content/60">Qty</div>
          <div className="font-medium">{margin.qty}</div>
        </div>
        <div>
          <div className="text-content/60">Tax</div>
          <div className="font-medium">{formatCurrency2(margin.tax)}</div>
        </div>
        <div>
          <div className="text-content/60">COGS</div>
          <div className="font-medium">{formatCurrency2(margin.cogs)}</div>
        </div>
        <div>
          <div className="text-content/60">GPM</div>
          <div className="font-medium">{margin.gpm}%</div>
        </div>
      </div>
    </div>
  );
};

export default MarginDayCardOverview;