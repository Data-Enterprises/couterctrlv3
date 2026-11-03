import { avgBasket } from "./recapDays";
import { count, hourRange, money, pounds } from "./recapFormat";
import type { RecapDay } from "./recapTypes";

/**
 * One picked day's figures, as the divided band Top 200 opens with.
 *
 * A single day has no week to sit in, so its row becomes this band instead.
 * Items sold is here and not on the week's day rows because only the item
 * rows can count it, and those are read once the day is in view.
 */
const RecapDayBand = ({
  day,
  itemsSold,
  withPounds,
}: {
  day: RecapDay;
  /** Null while the day's items are still being read. */
  itemsSold: number | null;
  withPounds: boolean;
}) => {
  const basket = avgBasket(day.net, day.transactions);
  const tiles: [string, string][] = [
    ["Net sales", money(day.net)],
    ["Transactions", day.transactions > 0 ? count(day.transactions) : "—"],
    ["Avg basket", basket === null ? "—" : money(basket)],
    ["Units", count(day.units)],
    ...(withPounds ? [["Pounds", pounds(day.pounds)] as [string, string]] : []),
    ["Items sold", itemsSold === null ? "…" : count(itemsSold)],
    ["Busiest hour", day.peakHour === null ? "—" : hourRange(day.peakHour)],
  ];
  return (
    <div
      className="grid divide-x divide-gray-100 border-b border-gray-100 bg-gray-50 flex-shrink-0"
      style={{ gridTemplateColumns: `repeat(${tiles.length}, minmax(0, 1fr))` }}
    >
      {tiles.map(([label, value]) => (
        <div key={label} className="px-3 pt-2.5 pb-2 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wide text-content">
            {label}
          </div>
          <div className="text-[14px] font-bold text-content tabular-nums">
            {value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecapDayBand;
