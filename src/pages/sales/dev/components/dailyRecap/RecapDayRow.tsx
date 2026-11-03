import RecapHourSpark from "./RecapHourSpark";
import { avgBasket } from "./recapDays";
import { count, dayLabel, hourRange, money, pounds } from "./recapFormat";
import { NUM, ROW, dayCols } from "./recapGrid";
import type { DayMixState, RecapDay } from "./recapTypes";

/** A day's distinct item count: "…" while it is read, "—" if it failed. */
const itemsText = (mix: DayMixState) =>
  mix.status === "ready" ? count(mix.mix.items) : mix.status === "error" ? "—" : "…";

/**
 * One day of the week, as figures.
 *
 * Not a control: the day cards above the tabs are the single way to pick a
 * day, on this tab as on every other, so a row neither highlights nor answers
 * a click. Items fills in as each day's item rows arrive. On a narrow panel
 * the sparkline drops so the figures keep their room. The row fills the
 * height its track in the list is given.
 */
const RecapDayRow = ({
  day,
  mix,
  withPounds,
  narrow,
}: {
  day: RecapDay;
  mix: DayMixState;
  withPounds: boolean;
  narrow: boolean;
}) => {
  const basket = avgBasket(day.net, day.transactions);
  const [weekday, date] = dayLabel(day.date).split(" ");
  return (
    <div className={ROW} style={{ gridTemplateColumns: dayCols(withPounds, narrow) }}>
      <span className="min-w-0">
        <span className="font-bold">{weekday}</span>{" "}
        <span className="font-medium">{date}</span>
        {!day.hasSales && <span className="block text-[11px]">No sales</span>}
      </span>
      <span className={`${NUM} font-bold`}>{money(day.net)}</span>
      <span className={NUM}>{day.transactions > 0 ? count(day.transactions) : "—"}</span>
      <span className={NUM}>{basket === null ? "—" : money(basket)}</span>
      <span className={NUM}>{itemsText(mix)}</span>
      <span className={NUM}>{count(day.units)}</span>
      {withPounds && <span className={NUM}>{pounds(day.pounds)}</span>}
      <span className="flex items-center gap-2.5 min-w-0 pl-2">
        {!narrow && <RecapHourSpark shape={day.hours} />}
        <span className="font-semibold whitespace-nowrap truncate">
          {day.hours.peak ? hourRange(day.hours.peak.hour) : "—"}
        </span>
      </span>
    </div>
  );
};

export default RecapDayRow;
