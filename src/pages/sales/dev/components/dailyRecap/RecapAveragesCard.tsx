import { CalculatorIcon } from "@heroicons/react/24/outline";
import RecapCard from "./RecapCard";
import { avgBasket, avgItemPrice, itemsPerBasket } from "./recapDays";
import { money, one, pounds } from "./recapFormat";
import type { RecapDay } from "./recapTypes";

/** One average: what it is on the left, the figure on the right. */
const line = (label: string, value: string, short: boolean, rule: boolean) => (
  <div
    key={label}
    className={`flex items-baseline justify-between gap-3 ${short ? "py-1.5" : "py-2.5"} ${
      rule ? "border-b border-gray-100" : ""
    }`}
  >
    <span className="text-[13.5px] text-content">{label}</span>
    <span className={`${short ? "text-[16px]" : "text-[18px]"} font-bold text-content tabular-nums`}>
      {value}
    </span>
  </div>
);

/**
 * What an average basket and an average unit looked like that day.
 *
 * Net sales and qty are the day card's; transactions as Hourly counts them.
 * A store that weighs things also gets its pounds per basket. Sits beside the
 * hour chart, so it takes that row's height and spreads its lines down it.
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
  const lines: [string, string][] = [
    ["Avg basket", basket === null ? "—" : money(basket)],
    ["Qty per basket", perBasket === null ? "—" : one(perBasket)],
    ["Avg unit price", unitPrice === null ? "—" : money(unitPrice)],
    ...(withPounds
      ? [
          [
            "Lb per basket",
            day.transactions > 0 ? pounds(day.pounds / day.transactions) : "—",
          ] as [string, string],
        ]
      : []),
  ];
  return (
    <RecapCard
      title="Averages"
      icon={CalculatorIcon}
      compact={short}
      bodyClassName="flex flex-col justify-center px-4 py-2"
    >
      {lines.map(([label, value], i) => line(label, value, short, i < lines.length - 1))}
    </RecapCard>
  );
};

export default RecapAveragesCard;
