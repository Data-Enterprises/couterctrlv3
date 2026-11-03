import {
  avgBasket,
  avgItemPrice,
  itemsPerBasket,
} from "./recapDays";
import { count, dayLabel, hourRange, money, one, pounds } from "./recapFormat";
import { CARD } from "./recapGrid";
import type { RecapWeek } from "./recapTypes";

/**
 * The week, as four headline figures above the days.
 *
 * Net sales is not one of them: the panel header and the day cards already
 * carry the week's net sales and its shape, right above this. These four are
 * what nothing else in the panel shows for the week.
 */
const RecapWeekBand = ({
  week,
  withPounds,
}: {
  week: RecapWeek;
  withPounds: boolean;
}) => {
  const basket = avgBasket(week.net, week.transactions);
  const perBasket = itemsPerBasket(week.units, week.transactions);
  const itemPrice = avgItemPrice(week.net, week.units);
  const tiles: { label: string; value: string; sub: string }[] = [
    {
      label: "Transactions",
      value: count(week.transactions),
      sub:
        week.tradingDays > 0
          ? `${count(week.transactions / week.tradingDays)} a day on average`
          : "No trading days",
    },
    {
      label: "Avg basket",
      value: basket === null ? "—" : money(basket),
      sub: perBasket === null ? "—" : `${one(perBasket)} items per basket`,
    },
    {
      label: "Units",
      value: count(week.units),
      sub: [
        itemPrice === null ? null : `${money(itemPrice)} avg item price`,
        withPounds ? `${pounds(week.pounds)} lb weighed` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    },
    {
      label: "Busiest",
      value: week.peak ? dayLabel(week.peak.date) : "—",
      sub: week.peak ? hourRange(week.peak.hour) : "No hourly sales",
    },
  ];
  return (
    <section
      aria-label="This week"
      className="grid grid-cols-4 gap-2.5 px-3.5 pt-3 pb-2.5 flex-shrink-0"
    >
      {tiles.map((t) => (
        <div key={t.label} className={`${CARD} px-3.5 py-2.5`}>
          <div className="text-[10px] font-bold uppercase tracking-wide text-content">
            {t.label}
          </div>
          <div className="mt-1 text-[20px] font-bold leading-tight text-content tabular-nums">
            {t.value}
          </div>
          <div className="mt-0.5 text-[12px] text-content truncate">{t.sub}</div>
        </div>
      ))}
    </section>
  );
};

export default RecapWeekBand;
