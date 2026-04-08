import {
  setMobileMainView,
  setSelectedWeekDay,
} from "../../../features/subMarginSlice";
import { useAppDispatch } from "../../../hooks";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import type { BarData } from "../display/widgets";

interface MarginDayCardOverviewProps {
  margin: BarData;
}

const MarginDayCardOverview = ({ margin }: MarginDayCardOverviewProps) => {
  const dispatch = useAppDispatch();

  const handleCardClick = (date: string) => {
    dispatch(setSelectedWeekDay(date));
    dispatch(setMobileMainView("items"));
  };

  const dayOfWeek = new Date(margin.date).toLocaleDateString("en-US", {
    weekday: "short",
  });

  return (
    <div
      className={`bg-custom-white first:rounded-t-lg last:rounded-b-lg even:bg-blue-200/50 px-2 py-0.5 text-[13px] last:border-none`}
      onClick={() => handleCardClick(margin.date)}
    >
      <div className="font-medium flex justify-between text-[13px]">
        <div>
          {dayOfWeek}, {margin.date}
        </div>
      </div>
      <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr_1.2fr_0.8fr] gap-x-2">
        <div>
          <div className="text-content/60">Sales</div>
          <div className="font-medium">
            {formatCurrency2(margin.sales - margin.tax)}
          </div>
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
