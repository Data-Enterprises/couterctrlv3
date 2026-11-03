import RecapCard from "./RecapCard";
import { avgBasket, avgItemPrice, itemsPerBasket } from "./recapDays";
import { count, money, one, pounds } from "./recapFormat";
import type { DayMixState, RecapDay } from "./recapTypes";

/** One figure in the baskets grid: the number, then what it is. */
const figure = (value: string, label: string, short: boolean) => (
  <div key={label} className="min-w-0">
    <div className={`${short ? "text-[16px]" : "text-[18px]"} font-bold text-content tabular-nums truncate`}>
      {value}
    </div>
    <div className="text-[12px] text-content">{label}</div>
  </div>
);

/**
 * What a basket looked like that day.
 *
 * Transactions as Hourly counts them; qty and net sales are the day card's;
 * items (how many different ones sold) comes from the day's item rows.
 * A store that weighs things also gets its pounds per basket, and goes four
 * across for it, so the card stays two rows tall beside Money and the mix.
 */
const RecapBasketsCard = ({
  day,
  mix,
  withPounds,
  short,
}: {
  day: RecapDay;
  mix: DayMixState;
  withPounds: boolean;
  short: boolean;
}) => {
  const basket = avgBasket(day.net, day.transactions);
  const perBasket = itemsPerBasket(day.units, day.transactions);
  const itemPrice = avgItemPrice(day.net, day.units);
  return (
    <RecapCard title="Baskets" compact={short}>
      <div
        className={`grid ${withPounds ? "grid-cols-4" : "grid-cols-3"} gap-x-3 ${
          short ? "gap-y-2 mt-1.5" : "gap-y-3 mt-2.5"
        }`}
      >
        {figure(day.transactions > 0 ? count(day.transactions) : "—", "transactions", short)}
        {figure(basket === null ? "—" : money(basket), "avg basket", short)}
        {figure(
          mix.status === "ready" ? count(mix.mix.items) : mix.status === "error" ? "—" : "…",
          "items",
          short,
        )}
        {figure(count(day.units), "qty", short)}
        {figure(perBasket === null ? "—" : one(perBasket), "qty per basket", short)}
        {figure(itemPrice === null ? "—" : money(itemPrice), "avg unit price", short)}
        {withPounds &&
          figure(
            day.transactions > 0 ? pounds(day.pounds / day.transactions) : "—",
            "lb per basket",
            short,
          )}
      </div>
    </RecapCard>
  );
};

export default RecapBasketsCard;
