import { CalculatorIcon } from "@heroicons/react/24/outline";
import RecapCard from "./RecapCard";
import RecapTile from "./RecapTile";
import { avgBasket, avgItemPrice, itemsPerBasket } from "./recapDays";
import { money, one, pounds } from "./recapFormat";
import type { RecapDay } from "./recapTypes";

/**
 * What an average basket and an average unit looked like that day, as tiles
 * like Baskets beside it.
 *
 * Net sales and qty are the day card's; transactions as Hourly counts them.
 * A store that weighs things also gets its pounds per basket.
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
  return (
    <RecapCard title="Averages" icon={CalculatorIcon} compact={short} bodyClassName="p-3">
      <div className={`grid grid-cols-2 ${short ? "gap-1.5" : "gap-2"}`}>
        <RecapTile value={basket === null ? "—" : money(basket)} label="avg basket" short={short} />
        <RecapTile
          value={perBasket === null ? "—" : one(perBasket)}
          label="qty per basket"
          short={short}
        />
        <RecapTile
          value={unitPrice === null ? "—" : money(unitPrice)}
          label="avg unit price"
          short={short}
        />
        {withPounds && (
          <RecapTile
            value={day.transactions > 0 ? pounds(day.pounds / day.transactions) : "—"}
            label="lb per basket"
            short={short}
          />
        )}
      </div>
    </RecapCard>
  );
};

export default RecapAveragesCard;
