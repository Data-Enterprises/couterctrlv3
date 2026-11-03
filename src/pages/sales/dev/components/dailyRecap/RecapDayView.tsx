import RecapAveragesCard from "./RecapAveragesCard";
import RecapBasketsCard from "./RecapBasketsCard";
import RecapMixCard from "./RecapMixCard";
import RecapMoneyCard from "./RecapMoneyCard";
import RecapShapeCard from "./RecapShapeCard";
import { dayName, money } from "./recapFormat";
import { TRAY } from "./recapGrid";
import type { DayMixState, RecapDay, RecapMoney } from "./recapTypes";

/**
 * One day's full recap, picked from its day card.
 *
 * One line of heading (the day, its net sales, the way back), then a three
 * column grid: Money, Baskets and Refunds and price mix across the first row;
 * Averages and the hour chart (two columns wide) across the second, which
 * takes the rest of the height. On a narrow panel it is two columns: Money and
 * Baskets, the mix and Averages, then the chart across both.
 *
 * No card has a fixed height it can be squeezed below: the last row's floor is
 * its own content, so when the panel is too short the tray scrolls and nothing
 * is cut off, and nothing pushes sideways.
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
    <div
      className={`flex items-baseline gap-3 px-4 ${
        short ? "py-1.5" : "py-2.5"
      } min-w-0 flex-shrink-0 border-b border-brand_line`}
    >
      <h3 className="flex-none text-[15px] font-bold text-content">{dayName(day.date)}</h3>
      <span className="flex-none text-[13px] font-semibold text-content tabular-nums">
        {day.hasSales ? `${money(day.net)} net sales` : "No sales recorded"}
      </span>
      <span className="text-[12px] text-content truncate">
        All week in the cards above goes back to the week.
      </span>
    </div>
    <div
      className={`${TRAY} flex-1 min-h-0 overflow-y-auto thin-scrollbar flex flex-col px-3.5 ${
        short ? "py-2" : "pt-3 pb-3.5"
      }`}
    >
      <div
        className={`grid flex-1 ${short ? "gap-2" : "gap-3"} ${
          narrow
            ? "grid-cols-2 grid-rows-[auto_auto_minmax(min-content,1fr)]"
            : "grid-cols-3 grid-rows-[auto_minmax(min-content,1fr)]"
        }`}
      >
        <RecapMoneyCard money={m} short={short} />
        <RecapBasketsCard day={day} mix={mix} withPounds={withPounds} short={short} />
        <RecapMixCard state={mix} short={short} />
        <RecapAveragesCard day={day} withPounds={withPounds} short={short} />
        <div className="col-span-2 min-w-0">
          <RecapShapeCard date={day.date} shape={day.hours} narrow={narrow} short={short} />
        </div>
      </div>
    </div>
  </div>
);

export default RecapDayView;
