import RecapCard from "./RecapCard";
import { avgBasket, avgItemPrice, itemsPerBasket } from "./recapDays";
import { count, money, one, pounds } from "./recapFormat";
import type { RecapDay } from "./recapTypes";

/** One figure in the baskets grid: the number, then what it is. */
const figure = (value: string, label: string) => (
  <div key={label}>
    <div className="text-[18px] font-bold text-content tabular-nums">{value}</div>
    <div className="text-[12px] text-content">{label}</div>
  </div>
);

/**
 * What a basket looked like that day.
 *
 * Transactions as Hourly counts them; units and net sales are the day card's.
 * A store that weighs things also gets its pounds per basket.
 */
const RecapBasketsCard = ({ day, withPounds }: { day: RecapDay; withPounds: boolean }) => {
  const basket = avgBasket(day.net, day.transactions);
  const perBasket = itemsPerBasket(day.units, day.transactions);
  const itemPrice = avgItemPrice(day.net, day.units);
  return (
    <RecapCard title="Baskets">
      <div className="grid grid-cols-2 gap-x-3.5 gap-y-3 mt-2.5">
        {figure(day.transactions > 0 ? count(day.transactions) : "—", "transactions")}
        {figure(basket === null ? "—" : money(basket), "avg basket")}
        {figure(perBasket === null ? "—" : one(perBasket), "items per basket")}
        {figure(itemPrice === null ? "—" : money(itemPrice), "avg item price")}
        {withPounds &&
          figure(
            day.transactions > 0 ? pounds(day.pounds / day.transactions) : "—",
            "lb per basket",
          )}
      </div>
    </RecapCard>
  );
};

export default RecapBasketsCard;
