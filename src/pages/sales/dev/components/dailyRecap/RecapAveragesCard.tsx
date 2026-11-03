import { CalculatorIcon } from "@heroicons/react/24/outline";
import RecapCard from "./RecapCard";
import RecapTile from "./RecapTile";
import { avgBasket, avgItemPrice, itemsPerBasket, perTradingHour } from "./recapDays";
import { money, one, pounds } from "./recapFormat";
import type { RecapDay } from "./recapTypes";

/**
 * What an average basket, unit and trading hour looked like that day, as
 * tiles like Baskets beside it.
 *
 * Net sales and qty are the day card's; transactions as Hourly counts them;
 * an hour is one the day traded, first sale's hour to last. A store that
 * weighs things also gets its pounds per basket. The tiles share the card's
 * height, two across; an odd last one takes the whole row.
 */
const RecapAveragesCard = ({
  day,
  withPounds,
  short,
}: {
  day: RecapDay;
  withPounds: boolean;
  short: boolean;
}) => {
  const basket = avgBasket(day.net, day.transactions);
  const perBasket = itemsPerBasket(day.units, day.transactions);
  const unitPrice = avgItemPrice(day.net, day.units);
  const salesPerHour = perTradingHour(day.net, day);
  const basketsPerHour = day.transactions > 0 ? perTradingHour(day.transactions, day) : null;
  const tiles: [string, string][] = [
    [basket === null ? "—" : money(basket), "avg basket"],
    [perBasket === null ? "—" : one(perBasket), "qty per basket"],
    [unitPrice === null ? "—" : money(unitPrice), "avg unit price"],
    ...(withPounds
      ? [
          [
            day.transactions > 0 ? pounds(day.pounds / day.transactions) : "—",
            "lb per basket",
          ] as [string, string],
        ]
      : []),
    [salesPerHour === null ? "—" : money(salesPerHour), "sales per hour"],
    [basketsPerHour === null ? "—" : one(basketsPerHour), "baskets per hour"],
  ];
  return (
    <RecapCard title="Averages" icon={CalculatorIcon} compact={short} bodyClassName="p-3">
      <div className={`grid h-full grid-cols-2 auto-rows-fr ${short ? "gap-1.5" : "gap-2"}`}>
        {tiles.map(([value, label], i) => (
          <RecapTile
            key={label}
            value={value}
            label={label}
            short={short}
            wide={tiles.length % 2 === 1 && i === tiles.length - 1}
          />
        ))}
      </div>
    </RecapCard>
  );
};

export default RecapAveragesCard;
