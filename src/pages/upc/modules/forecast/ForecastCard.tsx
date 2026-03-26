import type { UpcForecastData } from "../../../../interfaces";
import { formatBigNumber, formatCurrency2 } from "../../../../utils";

import StatusBar from "../../../../components/visuals/StatusBar";
import type { Price } from "../../components";

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
    [...data.metrics.outliers].sort((a, b) => b.qty - a.qty)[0]?.date || "";

  const totalQty = data.metrics.prices.reduce(
    (acc: number, p: any) => acc + (p.qty as number),
    0,
  );

  const maxQty =
    [...data.metrics.prices].sort((a: Price, b: Price) => b.qty - a.qty)[0]?.qty ||
    0;

  return (
    <div className="bg-custom-white rounded-lg p-2 shadow-lg space-y-0.5 cursor-default select-none">
      <div className="border-b border-content/60 font-medium flex justify-between items-center shadow">
        <div>{product_code}</div>
        <div>Total Qty: {formatBigNumber(totalQty, 0)}</div>
      </div>
      <div className="font-medium rounded-lg bg-bkg p-1 text-[13px]">
        <div className="text-nowrap text-ellipsis truncate">
          {data.metrics.description}
        </div>
        <div className="flex gap-1 text-[13px]">
          <div className="text-content/60">Days Active:</div>
          <div>{data.metrics.days_active}</div>
        </div>
        <div className="flex gap-1 text-[13px]">
          <div className="text-content/60">Avg Day Qty:</div>
          <div>{formatBigNumber(data.metrics.avg_daily_qty, 2)}</div>
        </div>
        <div className="flex gap-1 text-[13px]">
          <div className="text-content/60">Max Day Qty:</div>
          <div>
            {formatBigNumber(data.metrics.max_day_qty, 0)} - {maxDayQty}
          </div>
        </div>
      </div>
      <div className="mt-1 text-[13.5px] font-medium">Price History/Qty Sold</div>
      {/* <div className="grid grid-cols-2 px-2 min-h-10 max-h-10 overflow-hidden overflow-y-auto">
          {data.metrics.prices.map((p: any) => {
            return (
              <div key={p.price as string} className="even:text-right">
                {formatBigNumber(p.qty as number, 0)} @{" "}
                {formatCurrency2(p.price)}
              </div>
            );
          })}
        </div> */}
      <div className="w-full min-h-20 max-h-20 overflow-hidden overflow-y-auto">
        {[...data.metrics.prices]
          .sort((a: any, b: any) => b.qty - a.qty)
          .map((p: any) => (
            <StatusBar
              key={p.price as string}
              label={formatCurrency2(p.price)}
              value={p.qty as number}
              threshold={maxQty}
              isFlex={true}
              height={18}
            />
          ))}
      </div>
      <div>
        <div className="font-medium text-center border-b border-content/60">
          Next 7 Day Qty Forecast
        </div>
        {/* <div className="grid grid-cols-[1fr_2fr_1fr] font-medium bg-blue-500 text-custom-white rounded-t-lg py-0.5">
          <div className="border-r px-2">Day</div>
          <div className="border-r px-2">Date</div>
          <div className="px-2">Qty</div>
        </div> */}
        {data.forecast.map((point, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_2fr_1.3fr] text-[13.5px] odd:bg-blue-200/50 py-[1px] last:rounded-b-lg"
          >
            <div className="px-2">{dow(point.date)}</div>
            <div className="px-2 text-center">{point.date}</div>
            <div className="px-2 flex gap-1 justify-end">
              <div>Qty:</div>
              <div className="font-medium">{point.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForecastCard;
