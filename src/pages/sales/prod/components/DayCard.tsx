// Hooks
import { useAppDispatch } from "../../../../hooks";
import { useSalesCtx } from "../hooks";

// Redux
import { setLedgerSelectedDate } from "../../../../features/salesLedgerSlice";

// Utils
import { getHolidayName } from "../../../../utils/holidays";
import {
  formatCurrency2,
  formatBigNumber,
  sameWeekDayLastYear,
} from "../../../../utils";
import { fmtPct } from "../utils";

// Interfaces
import type { DayDot } from "../../../../interfaces";

// Components
import { StarIcon } from "@heroicons/react/20/solid";

interface DayCardProps {
  d: DayDot;
}

/** One day's card in the store popup's day strip:
 *
 * its sales or quantity and the change against last
 * year, or last week when last year has no match (starred for holidays). Clicking it selects the day.
 */
const DayCard = ({ d }: DayCardProps) => {
  const dispatch = useAppDispatch();
  const { selectedDate, gradingMetric } = useSalesCtx();
  const onSelect = (date: string | null) =>
    dispatch(setLedgerSelectedDate(date));
  const isQty = gradingMetric === "qty";
  const fmtMetric = (dollars: number, qty: number) =>
    isQty ? formatBigNumber(qty, 0) : formatCurrency2(dollars);

  const dateStr = d.sale_date.split("T")[0];
  const date = new Date(dateStr + "T12:00:00");
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
  const dateNum = `${date.getMonth() + 1}/${date.getDate()}`;
  const isSelected = selectedDate === dateStr;
  const hasLY = isQty
    ? d.lyQty !== null && d.lyQty > 0
    : d.lyNet !== null && d.lyNet > 0;
  const hasLW = isQty
    ? d.lwQty !== null && d.lwQty > 0
    : d.lwNet !== null && d.lwNet > 0;
  const vsLYPct = isQty
    ? hasLY && d.lyQty !== null
      ? ((d.twQty - d.lyQty) / d.lyQty) * 100
      : null
    : hasLY && d.lyNet !== null
      ? ((d.twNet - d.lyNet) / d.lyNet) * 100
      : null;
  const vsLWPct = isQty
    ? hasLW && d.lwQty !== null
      ? ((d.twQty - d.lwQty) / d.lwQty) * 100
      : null
    : hasLW && d.lwNet !== null
      ? ((d.twNet - d.lwNet) / d.lwNet) * 100
      : null;
  const displayPct = vsLYPct ?? vsLWPct;
  const displaySuffix = hasLY ? "LY" : hasLW ? "LW" : null;
  const isNeg = displayPct !== null && displayPct < 0;
  const holidayName = getHolidayName(dateStr);

  return (
    <button
      onClick={() => onSelect(dateStr)}
      className={`relative flex flex-col rounded-md overflow-hidden flex-1 border transition-colors ${
        isSelected
          ? "border-brand_navy ring-2 ring-brand_navy/30"
          : "border-line_field hover:border-line_strong"
      }`}
    >
      {holidayName && (
        <span
          title={`${holidayName} — compared with ${holidayName} last year (${new Date(
            sameWeekDayLastYear(dateStr).date + "T12:00:00",
          ).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}), not with the same weekday.`}
          className="absolute top-1 right-1 z-10"
        >
          <StarIcon className="w-2.5 h-2.5 text-amber-500" />
        </span>
      )}
      <div className="flex flex-col items-center justify-center gap-0.5 py-2 px-1 bg-custom-white">
        <div className="text-[9px] cc-caps-strong">{dayName}</div>
        <div className="text-[12px] font-bold text-content leading-none">
          {dateNum}
        </div>
        <div className="text-[12px] font-bold text-content mt-1">
          {fmtMetric(d.twNet, d.twQty)}
        </div>
        <div
          className={`text-[11px] font-semibold ${displayPct === null ? "text-content" : isNeg ? "text-severity_critical_text" : "text-severity_healthy_text"}`}
        >
          {displayPct !== null
            ? `${isNeg ? "▼" : "▲"} ${fmtPct(displayPct)} ${displaySuffix}`
            : "—"}
        </div>
      </div>
    </button>
  );
};

export default DayCard;
