import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import RecapCard from "./RecapCard";
import RecapTile from "./RecapTile";
import { count, pounds } from "./recapFormat";
import type { DayMixState, RecapDay } from "./recapTypes";

/**
 * How much the day moved, as counts: transactions (as Hourly counts them),
 * how many different items sold (from the day's item rows), qty (the day
 * card's) and, at a store that weighs things, the weight.
 *
 * Only counts: the per-basket and per-unit figures are their own Averages
 * card, laid out the same way, so neither card is a wall of numbers.
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
  const items =
    mix.status === "ready" ? count(mix.mix.items) : mix.status === "error" ? "—" : "…";
  return (
    <RecapCard title="Baskets" icon={ShoppingCartIcon} compact={short} bodyClassName="p-3">
      <div className={`grid ${withPounds ? "grid-cols-2" : "grid-cols-3"} ${short ? "gap-1.5" : "gap-2"}`}>
        <RecapTile
          value={day.transactions > 0 ? count(day.transactions) : "—"}
          label="transactions"
          short={short}
        />
        <RecapTile value={items} label="items" short={short} />
        <RecapTile value={count(day.units)} label="qty" short={short} />
        {withPounds && <RecapTile value={`${pounds(day.pounds)} lb`} label="weight" short={short} />}
      </div>
    </RecapCard>
  );
};

export default RecapBasketsCard;
