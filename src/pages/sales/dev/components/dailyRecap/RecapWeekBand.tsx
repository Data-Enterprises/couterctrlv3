import {
  avgBasket,
  avgItemPrice,
  itemsPerBasket,
} from "./recapDays";
import { count, dayLabel, hourRange, money, one, pounds } from "./recapFormat";
import { CARD } from "./recapGrid";
import type { RecapWeek } from "./recapTypes";

/**
 * The week, as four headline figures above the days. Two by two on a narrow
 * panel; tighter on a short one, so the days below keep their room.
 *
 * Net sales is not one of them: the panel header and the day cards already
 * carry the week's net sales, right above this. These four are what nothing
 * else in the panel shows for the week.
 */
const RecapWeekBand = ({
  week,
  withPounds,
  narrow,
  short,
}: {
  week: RecapWeek;
  withPounds: boolean;
  narrow: boolean;
  short: boolean;
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
      sub: perBasket === null ? "—" : `${one(perBasket)} qty per basket`,
    },
    {
      label: "Qty",
      value: count(week.units),
      sub: [
        itemPrice === null ? null : `${money(itemPrice)} avg unit price`,
        withPounds ? `${pounds(week.pounds)} lb` : null,
      ]
        .filter(Boolean)
        .join(" | "),
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
      className={`grid ${narrow ? "grid-cols-2" : "grid-cols-4"} gap-2.5 px-3.5 ${
        short ? "pt-2 pb-2" : "pt-3 pb-2.5"
      } flex-shrink-0`}
    >
      {tiles.map((t) => (
        <div key={t.label} className={`${CARD} min-w-0 px-3.5 ${short ? "py-1.5" : "py-2.5"}`}>
          <div className="text-[10px] font-bold uppercase tracking-wide text-content">
            {t.label}
          </div>
          <div
            className={`${short ? "text-[16px]" : "mt-1 text-[18px]"} font-bold leading-tight text-content tabular-nums truncate`}
          >
            {t.value}
          </div>
          <div className="mt-0.5 text-[12px] text-content truncate">{t.sub}</div>
        </div>
      ))}
    </section>
  );
};

export default RecapWeekBand;
