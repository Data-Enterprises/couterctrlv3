import RecapBasketsCard from "./RecapBasketsCard";
import RecapMixCard from "./RecapMixCard";
import RecapMoneyCard from "./RecapMoneyCard";
import RecapShapeCard from "./RecapShapeCard";
import { dayName, money } from "./recapFormat";
import type { DayMixState, RecapDay, RecapMoney } from "./recapTypes";

/**
 * One day's full recap, picked from its day card or its row on the week.
 *
 * It fills the panel: the heading, then the day's shape taking the spare
 * height, then Baskets, Money and Refunds and price mix. Nothing repeats
 * another tab or itself, so there are no tiles here (they said what Baskets
 * and the busiest hour already say). A panel too short for the minimums
 * scrolls inside the tab; nothing is clipped and nothing pushes sideways.
 * On a narrow panel the three cards go two across, the last spanning; on a
 * short one everything tightens and the chart gives up height first.
 */
const RecapDayView = ({
  day,
  money: m,
  mix,
  withPounds,
  narrow,
  short,
}: {
  day: RecapDay;
  money: RecapMoney;
  mix: DayMixState;
  withPounds: boolean;
  narrow: boolean;
  short: boolean;
}) => (
  <div className="flex flex-col h-full min-h-0">
    <div className={`flex items-baseline gap-3 px-4 ${short ? "py-1.5" : "py-2.5"} min-w-0 flex-shrink-0`}>
      <h3 className="flex-none text-[15px] font-bold text-content">{dayName(day.date)}</h3>
      <span className="flex-none text-[13px] font-semibold text-content tabular-nums">
        {day.hasSales ? `${money(day.net)} net sales` : "No sales recorded"}
      </span>
      <span className="text-[12px] text-content truncate">
        All week in the cards above goes back to the week.
      </span>
    </div>
    <div
      className={`flex-1 min-h-0 overflow-y-auto thin-scrollbar px-3.5 flex flex-col ${
        short ? "pb-2.5 gap-2" : "pb-3.5 gap-3"
      }`}
    >
      <RecapShapeCard date={day.date} shape={day.hours} narrow={narrow} short={short} />
      <div className={`grid flex-shrink-0 ${short ? "gap-2" : "gap-3"} ${narrow ? "grid-cols-2" : "grid-cols-3"}`}>
        <RecapBasketsCard day={day} mix={mix} withPounds={withPounds} short={short} />
        <RecapMoneyCard money={m} short={short} />
        <div className={narrow ? "col-span-2" : ""}>
          <RecapMixCard state={mix} short={short} />
        </div>
      </div>
    </div>
  </div>
);

export default RecapDayView;
