import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import RecapCard from "./RecapCard";
import { count, pounds } from "./recapFormat";
import type { DayMixState, RecapDay } from "./recapTypes";

/** One count as a small tile: the figure, then what it counts. */
const tile = (value: string, label: string, short: boolean) => (
  <div
    key={label}
    className={`min-w-0 rounded-lg border border-brand_line bg-bkg/40 px-2.5 ${short ? "py-1.5" : "py-2"}`}
  >
    <div className={`${short ? "text-[17px]" : "text-[19px]"} font-bold text-content tabular-nums truncate`}>
      {value}
    </div>
    <div className="text-[12px] text-content truncate">{label}</div>
  </div>
);

/**
 * How much the day moved, as counts: transactions (as Hourly counts them),
 * how many different items sold (from the day's item rows), qty (the day
 * card's) and, at a store that weighs things, the weight.
 *
 * Only counts: the per-basket and per-unit figures are their own Averages
 * card, so neither card is a wall of numbers.
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
        {tile(day.transactions > 0 ? count(day.transactions) : "—", "transactions", short)}
        {tile(items, "items", short)}
        {tile(count(day.units), "qty", short)}
        {withPounds && tile(`${pounds(day.pounds)} lb`, "weight", short)}
      </div>
    </RecapCard>
  );
};

export default RecapBasketsCard;
