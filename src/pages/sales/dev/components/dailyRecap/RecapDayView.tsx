import RecapBasketsCard from "./RecapBasketsCard";
import RecapExceptionsCard from "./RecapExceptionsCard";
import RecapMoneyCard from "./RecapMoneyCard";
import RecapShapeCard from "./RecapShapeCard";
import { TRAY } from "./recapGrid";
import type { DayMixState, RecapDay, RecapMoney, WeekExceptionsState } from "./recapTypes";

/**
 * One day's full recap, picked from its day card (board 15).
 *
 * No heading: the highlighted day card already says which day, and Money
 * gives its net sales. A three column grid: Money, Baskets and Exceptions
 * across the first row; net sales by hour across the whole second, taking
 * the rest of the height. On a narrow panel the first row goes two across
 * with Exceptions under them.
 *
 * Nothing has a fixed height it can be squeezed below: the last row's floor
 * is its own content, so a panel too short scrolls instead of cutting
 * anything off, and nothing pushes sideways.
 */
const RecapDayView = ({
  day,
  money: m,
  mix,
  exceptions,
  withPounds,
  narrow,
  short,
}: {
  day: RecapDay;
  money: RecapMoney;
  mix: DayMixState;
  exceptions: WeekExceptionsState;
  withPounds: boolean;
  narrow: boolean;
  short: boolean;
}) => (
  <div
    className={`${TRAY} h-full min-h-0 overflow-y-auto thin-scrollbar flex flex-col ${
      short ? "p-2.5" : "p-3.5"
    }`}
  >
    <div
      className={`grid flex-1 ${short ? "gap-2.5" : "gap-3.5"} ${
        narrow
          ? "grid-cols-2 grid-rows-[auto_auto_minmax(min-content,1fr)]"
          : "grid-cols-3 grid-rows-[auto_minmax(min-content,1fr)]"
      }`}
    >
      <RecapMoneyCard money={m} mix={mix} short={short} />
      <RecapBasketsCard day={day} mix={mix} withPounds={withPounds} short={short} />
      <div className={narrow ? "col-span-2 min-w-0" : "min-w-0"}>
        <RecapExceptionsCard date={day.date} state={exceptions} short={short} />
      </div>
      <div className={`${narrow ? "col-span-2" : "col-span-3"} min-w-0`}>
        <RecapShapeCard day={day} narrow={narrow} short={short} />
      </div>
    </div>
  </div>
);

export default RecapDayView;
