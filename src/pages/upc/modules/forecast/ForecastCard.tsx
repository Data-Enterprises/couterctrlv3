import type { UpcForecastData } from "../../../../interfaces";
import { formatBigNumber } from "../../../../utils";

interface ForecastCardProps {
  card: UpcForecastData;
}

const ForecastCard = ({ card }: ForecastCardProps) => {
  const { product_code, data } = card;
  const dow = (x: string) => {
    const date = new Date(x);
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  const maxDayQty =
    [...data.metrics.outliers].sort((a, b) => b.qty - a.qty)[0]?.date || 0;

  return (
    <div className="bg-custom-white rounded-lg p-2 shadow-lg space-y-1 cursor-default select-none">
      <div className="border-b border-content/60 font-medium flex justify-between items-center">
        <div>{product_code}</div>
        <div className="flex gap-1 text-[13.5px]">
          <div className="text-content/60">Days Active:</div>
          <div>{data.metrics.days_active}</div>
        </div>
      </div>
      <div className="font-medium rounded-lg bg-bkg p-1 text-[13px]">
        <div>{data.metrics.description}</div>
        <div className="flex gap-1 text-[13.5px]">
          <div className="text-content/60">Avg Day Qty:</div>
          <div>{formatBigNumber(data.metrics.avg_daily_qty, 2)}</div>
        </div>
        <div className="flex gap-1 text-[13.5px]">
          <div className="text-content/60">Max Day Qty:</div>
          <div>
            {formatBigNumber(data.metrics.max_day_qty, 0)} - {maxDayQty}
          </div>
        </div>
      </div>
      <div>
        <div className="font-medium text-center">7 Day Qty Forecast</div>
        <div className="grid grid-cols-[1fr_2fr_1fr] font-medium bg-blue-500 text-custom-white rounded-t-lg py-0.5">
          <div className="border-r px-2">Day</div>
          <div className="border-r px-2">Date</div>
          <div className="px-2">Qty</div>
        </div>
        {data.forecast.map((point, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_2fr_1fr] odd:bg-blue-200/50 py-0.5 last:rounded-b-lg"
          >
            <div className="px-2">{dow(point.date)}</div>
            <div className="px-2">{point.date}</div>
            <div className="text-right px-2">{point.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForecastCard;
