import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { avgBasket } from "./recapDays";
import { count, dayLabel, hourRange, money, pounds } from "./recapFormat";
import { NUM, ROW, ROW_OPEN, dayCols } from "./recapGrid";
import type { RecapDay } from "./recapTypes";

/**
 * One day of the week, closed or open.
 *
 * The row is the control: clicking it opens the day's sub depts under it, and
 * clicking it again closes them. Every figure is the day's whole, whatever is
 * being searched below it.
 */
const RecapDayRow = ({
  day,
  withPounds,
  open,
  onToggle,
}: {
  day: RecapDay;
  withPounds: boolean;
  open: boolean;
  onToggle: () => void;
}) => {
  const basket = avgBasket(day.net, day.transactions);
  const Chevron = open ? ChevronDownIcon : ChevronRightIcon;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={open ? ROW_OPEN : ROW}
      style={{ gridTemplateColumns: dayCols(withPounds) }}
    >
      <Chevron className="h-4 w-4 text-content" aria-hidden="true" />
      <span className={open ? "font-bold" : "font-medium"}>
        {dayLabel(day.date)}
        {!day.hasSales && (
          <span className="ml-2 text-[11.5px] font-normal">No sales</span>
        )}
      </span>
      <span className={`${NUM} ${open ? "font-bold" : "font-semibold"}`}>
        {money(day.net)}
      </span>
      <span className={NUM}>
        {day.transactions > 0 ? count(day.transactions) : "—"}
      </span>
      <span className={NUM}>{basket === null ? "—" : money(basket)}</span>
      <span className={NUM}>{count(day.units)}</span>
      {withPounds && <span className={NUM}>{pounds(day.pounds)}</span>}
      <span className={NUM}>
        {day.peakHour === null ? "—" : hourRange(day.peakHour)}
      </span>
    </button>
  );
};

export default RecapDayRow;
