import { setSelectedWeekDay } from "../../../features/subMarginSlice";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import type { BarData } from "../display/widgets";
import { useSubMarginCtx } from "../hooks";

interface MarginDayCardOverviewProps {
  margin: BarData;
  onCardClick: (date: string) => void;
}

const MarginDayCardOverview = ({margin, onCardClick}: MarginDayCardOverviewProps) => {
  const ctx = useSubMarginCtx();
  const { assignedStores } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();

  const handleCardClick = (date: string) => {
    onCardClick(date);
    if (date === ctx.selectedWeekDay) {
      dispatch(setSelectedWeekDay(""));
    } else {
      dispatch(setSelectedWeekDay(date));
    }
  };

  const findStoreName = () => {
    return (
      assignedStores.find((store) => store.storeid === ctx.searchValue)
        ?.store_name || ""
    );
  };

  return (
    <div
      className={`bg-custom-white rounded-lg ${ctx.selectedWeekDay === margin.date ? "bg-orange-200" : "shadow-medium"} text-sm`}
      onClick={() => handleCardClick(margin.date)}
    >
      <div className="bg-blue-500 text-custom-white rounded-t-lg py-0.5 px-2 font-medium flex justify-between text-[13.5px]">
        <div>{margin.date}</div>
        <div>{findStoreName()}</div>
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
          <div className="font-medium">{formatBigNumber(margin.qty, 0)}</div>
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
          <div className="font-medium">{margin.gpm}</div>
        </div>
      </div>
    </div>
  );
};

export default MarginDayCardOverview;
