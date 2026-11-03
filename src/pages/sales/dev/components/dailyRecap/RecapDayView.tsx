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
 * The day's cards sit on a recessed tray, which is what gives them their
 * edges: the heading (the day as a date block, its net sales beside it), the
 * day's shape taking the spare height, then Baskets, Money and Refunds and
 * price mix. Nothing repeats another tab or itself. A panel too short for the
 * minimums scrolls inside the tray; nothing is clipped and nothing pushes
 * sideways. On a narrow panel the three cards go two across, the last
 * spanning; on a short one everything tightens and the chart gives up height
 * first.
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
}) => {
  const [weekday, date] = dayName(day.date).split(" ");
  return (
    <div
      className={`${TRAY} h-full min-h-0 overflow-y-auto thin-scrollbar flex flex-col px-3.5 ${
        short ? "py-2 gap-2" : "pt-3 pb-3.5 gap-3"
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-shrink-0">
        <h3
          aria-label={dayName(day.date)}
          className={`flex flex-none flex-col items-center justify-center rounded-lg border-[1.5px] border-brand_navy bg-brand_paper ${
            short ? "h-11 w-[54px]" : "h-[52px] w-[60px]"
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-content">
            {weekday.slice(0, 3)}
          </span>
          <span className={`${short ? "text-[16px]" : "text-[18px]"} font-bold leading-tight text-content`}>
            {date}
          </span>
        </h3>
        <div className="min-w-0">
          <div className={`${short ? "text-[17px]" : "text-[20px]"} font-bold text-content tabular-nums`}>
            {day.hasSales ? money(day.net) : "No sales recorded"}{" "}
            {day.hasSales && <span className="text-[14px] font-medium">net sales</span>}
          </div>
          <div className="text-[12.5px] text-content truncate">
            All week, in the cards above, goes back to the week.
          </div>
        </div>
      </div>
      <RecapShapeCard date={day.date} shape={day.hours} narrow={narrow} short={short} />
      <div
        className={`grid flex-shrink-0 ${short ? "gap-2" : "gap-3"} ${
          narrow ? "grid-cols-2" : "grid-cols-[1.15fr_1fr_1fr]"
        }`}
      >
        <RecapBasketsCard day={day} mix={mix} withPounds={withPounds} short={short} />
        <RecapMoneyCard money={m} short={short} />
        <div className={narrow ? "col-span-2" : ""}>
          <RecapMixCard state={mix} short={short} />
        </div>
      </div>
    </div>
  );
};

export default RecapDayView;
