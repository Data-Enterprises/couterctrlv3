import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import RecapCard from "./RecapCard";
import { avgBasket, avgItemPrice, itemsPerBasket } from "./recapDays";
import { count, money, one, pounds } from "./recapFormat";
import type { DayMixState, RecapDay } from "./recapTypes";

/**
 * One figure as a small tile. The lead three (transactions, avg basket,
 * items) sit on a deeper tint and a larger figure; the rest follow from them.
 */
const tile = (value: string, label: string, lead: boolean, short: boolean) => (
  <div
    key={label}
    className={`min-w-0 rounded-lg border border-brand_line px-2.5 ${short ? "py-1.5" : "py-2"} ${
      lead ? "bg-bkg/50" : "bg-bkg/20"
    }`}
  >
    <div
      className={`${lead ? (short ? "text-[17px]" : "text-[19px]") : short ? "text-[15px]" : "text-[16px]"} font-bold text-content tabular-nums truncate`}
    >
      {value}
    </div>
    <div className="text-[12px] text-content truncate">{label}</div>
  </div>
);

/**
 * What a basket looked like that day.
 *
 * Transactions as Hourly counts them; qty and net sales are the day card's;
 * items (how many different ones sold) comes from the day's item rows. A
 * store that weighs things also gets its pounds per basket.
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
  const items =
    mix.status === "ready" ? count(mix.mix.items) : mix.status === "error" ? "—" : "…";
  return (
    <RecapCard title="Baskets" icon={ShoppingCartIcon} compact={short} bodyClassName="p-3">
      <div className={`grid grid-cols-3 ${short ? "gap-1.5" : "gap-2"}`}>
        {tile(day.transactions > 0 ? count(day.transactions) : "—", "transactions", true, short)}
        {tile(basket === null ? "—" : money(basket), "avg basket", true, short)}
        {tile(items, "items", true, short)}
        {tile(count(day.units), "qty", false, short)}
        {tile(perBasket === null ? "—" : one(perBasket), "qty per basket", false, short)}
        {tile(itemPrice === null ? "—" : money(itemPrice), "avg unit price", false, short)}
        {withPounds &&
          tile(
            day.transactions > 0 ? pounds(day.pounds / day.transactions) : "—",
            "lb per basket",
            false,
            short,
          )}
      </div>
    </RecapCard>
  );
};

export default RecapBasketsCard;
