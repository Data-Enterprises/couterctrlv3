import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import RecapHourSpark from "./RecapHourSpark";
import { avgBasket } from "./recapDays";
import { count, dayLabel, hourRange, money, pounds } from "./recapFormat";
import { NUM, ROW, ROW_OPEN, dayCols } from "./recapGrid";
import type { RecapDay } from "./recapTypes";

/**
 * One day of the week.
 *
 * The bar beside net sales measures the day against the week's biggest day:
 * navy, ungraded, the same as Top 200's department bars. The row is the
 * control that opens the rest of the day under it. A picked day has nothing
 * to close back to, so its row is not a button.
 */
const RecapDayRow = ({
  day,
  topNet,
  withPounds,
  open,
  onToggle,
}: {
  day: RecapDay;
  /** The week's biggest day: the bar's full length. */
  topNet: number;
  withPounds: boolean;
  open: boolean;
  /** Absent for a picked day, which stays open. */
  onToggle?: () => void;
}) => {
  const basket = avgBasket(day.net, day.transactions);
  const [weekday, date] = dayLabel(day.date).split(" ");
  const width = topNet > 0 ? Math.max(2, (day.net / topNet) * 100) : 0;
  const Chevron = open ? ChevronDownIcon : ChevronRightIcon;
  const cells = (
    <>
      {onToggle ? <Chevron className="h-4 w-4 text-content" aria-hidden="true" /> : <span />}
      <span>
        <span className="font-bold">{weekday}</span>{" "}
        <span className="font-medium">{date}</span>
        {!day.hasSales && <span className="block text-[11px]">No sales</span>}
      </span>
      <span className="flex items-center gap-3 min-w-0">
        <span className="relative flex-1 h-2 rounded bg-bkg min-w-0">
          <span
            className="absolute inset-y-0 left-0 rounded bg-brand_navy"
            style={{ width: `${width}%` }}
          />
        </span>
        <span className="min-w-[86px] text-right font-semibold tabular-nums">
          {money(day.net)}
        </span>
      </span>
      <span className={NUM}>{day.transactions > 0 ? count(day.transactions) : "—"}</span>
      <span className={NUM}>{basket === null ? "—" : money(basket)}</span>
      <span className={NUM}>{count(day.units)}</span>
      {withPounds && <span className={NUM}>{pounds(day.pounds)}</span>}
      <span className="flex items-center gap-2.5 min-w-0">
        <RecapHourSpark shape={day.hours} />
        <span className="font-semibold whitespace-nowrap truncate">
          {day.hours.peak ? hourRange(day.hours.peak.hour) : "—"}
        </span>
      </span>
    </>
  );
  const style = { gridTemplateColumns: dayCols(withPounds) };
  return onToggle ? (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={open ? ROW_OPEN : ROW}
      style={style}
    >
      {cells}
    </button>
  ) : (
    <div className={ROW_OPEN} style={style}>
      {cells}
    </div>
  );
};

export default RecapDayRow;
