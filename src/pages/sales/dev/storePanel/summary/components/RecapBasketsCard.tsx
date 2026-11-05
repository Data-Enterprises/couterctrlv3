import RecapStatCard from "./RecapStatCard";
import RecapViewItemsButton from "./RecapViewItemsButton";
import { avgBasket, avgItemPrice, itemsPerBasket } from "../utils/recapDays";
import { count, money, one, pounds } from "../utils/recapFormat";
import type { DayMixState, RecapDay } from "../types/index";

/**
 * The period's baskets, a day or the week: how many, and what an average one
 * came to, then each count beside what it averages to per basket.
 *
 * Transactions as Hourly counts them; qty and net sales are the day card's;
 * items (how many different ones sold) comes from the item rows, an item
 * once however many days it sold on. Weight only at a store that weighs
 * things. View items, top right, opens Summary's item view (board 17).
 */
const RecapBasketsCard = ({
  day,
  mix,
  withPounds,
  short,
  itemsTip,
  onViewItems,
}: {
  day: RecapDay;
  mix: DayMixState;
  withPounds: boolean;
  short: boolean;
  /** What View items' tip says: the week, or the day picked. */
  itemsTip: string;
  onViewItems: () => void;
}) => {
  const basket = avgBasket(day.net, day.transactions);
  const perBasket = itemsPerBasket(day.units, day.transactions);
  const unitPrice = avgItemPrice(day.net, day.units);
  const items =
    mix.status === "ready" ? count(mix.mix.items) : mix.status === "error" ? "—" : "…";
  return (
    <RecapStatCard
      title="Baskets"
      action={<RecapViewItemsButton tip={itemsTip} onClick={onViewItems} />}
      hero={day.transactions > 0 ? count(day.transactions) : "—"}
      heroSub={`transactions${basket === null ? "" : ` | ${money(basket)} avg basket`}`}
      short={short}
      rows={[
        {
          label: "Qty",
          value: count(day.units),
          sub: perBasket === null ? undefined : ` | ${one(perBasket)} per basket`,
        },
        { label: "Avg unit price", value: unitPrice === null ? "—" : money(unitPrice) },
        ...(withPounds
          ? [
              {
                label: "Weight",
                value: `${pounds(day.pounds)} lb`,
                sub:
                  day.transactions > 0
                    ? ` | ${pounds(day.pounds / day.transactions)} per basket`
                    : undefined,
              },
            ]
          : []),
        { label: "Items", value: items },
      ]}
    />
  );
};

export default RecapBasketsCard;
