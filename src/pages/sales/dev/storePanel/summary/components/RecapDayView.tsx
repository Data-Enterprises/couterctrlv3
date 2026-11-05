import RecapBasketsCard from "./RecapBasketsCard";
import RecapExceptionsCard from "./RecapExceptionsCard";
import RecapMoneyCard from "./RecapMoneyCard";
import RecapShapeCard from "./RecapShapeCard";
import { TRAY } from "../utils/recapGrid";
import type { DayMixState, RecapDay, RecapMoney, WeekExceptionsState } from "../types/index";

/**
 * Summary for one period: the week (board 16), or a day picked from its day
 * card (board 15). The same cards in the same places either way, so a day
 * card is a filter on one view rather than a door to another.
 *
 * No heading: the highlighted day card already says which period, and Money
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
  dates,
  period,
  money: m,
  mix,
  exceptions,
  withPounds,
  narrow,
  short,
  itemsTip,
  onViewItems,
}: {
  /** The period's figures: one day's, or the week's combined. */
  day: RecapDay;
  /** The day, or the week's seven. */
  dates: string[];
  /** "on Thu Oct 30" or "across the week", for spoken labels. */
  period: string;
  money: RecapMoney;
  mix: DayMixState;
  exceptions: WeekExceptionsState;
  withPounds: boolean;
  narrow: boolean;
  short: boolean;
  itemsTip: string;
  onViewItems: () => void;
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
      <RecapBasketsCard
        day={day}
        mix={mix}
        withPounds={withPounds}
        short={short}
        itemsTip={itemsTip}
        onViewItems={onViewItems}
      />
      <div className={narrow ? "col-span-2 min-w-0" : "min-w-0"}>
        <RecapExceptionsCard dates={dates} state={exceptions} short={short} />
      </div>
      <div className={`${narrow ? "col-span-2" : "col-span-3"} min-w-0`}>
        <RecapShapeCard day={day} period={period} narrow={narrow} short={short} />
      </div>
    </div>
  </div>
);

export default RecapDayView;
