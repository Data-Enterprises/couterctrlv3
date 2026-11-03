import RecapBasketsCard from "./RecapBasketsCard";
import RecapMixCard from "./RecapMixCard";
import RecapMoneyCard from "./RecapMoneyCard";
import RecapShapeCard from "./RecapShapeCard";
import type { DayMixState, RecapDay, RecapMoney } from "./recapTypes";

/**
 * The rest of a day, under its open row.
 *
 * Nothing here repeats another tab: Top 200 and Sub depts already list the
 * items, so an open day shows its shape by hour, its baskets, its money and
 * its refunds and price mix instead.
 */
const RecapDayDetail = ({
  day,
  money,
  mix,
  withPounds,
}: {
  day: RecapDay;
  money: RecapMoney;
  mix: DayMixState;
  withPounds: boolean;
}) => (
  <div className="flex flex-col gap-3 pl-[38px] pr-4 pt-3 pb-3.5 bg-gray-50 border-l-2 border-row_selected_border border-b border-b-gray-100">
    <RecapShapeCard date={day.date} shape={day.hours} />
    <div className="grid grid-cols-3 gap-3">
      <RecapBasketsCard day={day} withPounds={withPounds} />
      <RecapMoneyCard money={money} />
      <RecapMixCard state={mix} />
    </div>
  </div>
);

export default RecapDayDetail;
