import { avgBasket } from "./recapDays";
import { count, dayLabel, hourRange, money, pounds } from "./recapFormat";
import { NUM, TOTAL_ROW, dayCols } from "./recapGrid";
import type { RecapWeek } from "./recapTypes";

/**
 * The week, under the seven days.
 *
 * Every figure is the days above it summed, so its net sales is the All week
 * card's. The busiest hour is the week's single busiest one, with its day.
 */
const RecapWeekRow = ({
  week,
  withPounds,
}: {
  week: RecapWeek;
  withPounds: boolean;
}) => {
  const basket = avgBasket(week.net, week.transactions);
  return (
    <div
      className={TOTAL_ROW}
      style={{ gridTemplateColumns: dayCols(withPounds) }}
    >
      <span />
      <span>Week</span>
      <span className={NUM}>{money(week.net)}</span>
      <span className={NUM}>
        {week.transactions > 0 ? count(week.transactions) : "—"}
      </span>
      <span className={NUM}>{basket === null ? "—" : money(basket)}</span>
      <span className={NUM}>{count(week.units)}</span>
      {withPounds && <span className={NUM}>{pounds(week.pounds)}</span>}
      <span className={NUM}>
        {week.peak
          ? `${dayLabel(week.peak.date).split(" ")[0]} ${hourRange(week.peak.hour)}`
          : "—"}
      </span>
    </div>
  );
};

export default RecapWeekRow;
