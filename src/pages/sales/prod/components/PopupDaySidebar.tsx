// Hooks
import { useAppDispatch } from "../../../../hooks";
import { useSalesCtx } from "../hooks";

// Redux
import { setLedgerSelectedDate } from "../../../../features/salesLedgerSlice";

// Utils
import { formatCurrency2, formatBigNumber } from "../../../../utils";
import { computeDayMatchedTotals } from "../utils/ledgerUtils";
import { fmtPct } from "../utils";

// Interfaces
import type { DayDot } from "../../../../interfaces";

// Components
import DayCard from "./DayCard";

interface PopupDaySidebarProps {
  days: DayDot[];
}

/** The day strip across the store popup: an All Week card and one card per day with its sales or quantity
 *  and change against last year or last week (starred for holidays). Clicking a card selects that day. */
const PopupDaySidebar = ({ days }: PopupDaySidebarProps) => {
  const dispatch = useAppDispatch();
  const { selectedDate, gradingMetric } = useSalesCtx();
  const onSelect = (date: string | null) =>
    dispatch(setLedgerSelectedDate(date));
  const isQty = gradingMetric === "qty";
  const sorted = [...days].sort((a, b) =>
    a.sale_date.localeCompare(b.sale_date),
  );

  const weekTotals = computeDayMatchedTotals(sorted, gradingMetric);
  const weekTw = isQty ? weekTotals.twQty : weekTotals.twTotal;
  const weekHasLY = weekTotals.hasLY;
  const weekHasLW = weekTotals.hasLW;
  const weekDisplayPct = weekHasLY
    ? weekTotals.vsLYPct
    : weekHasLW
      ? weekTotals.vsLWPct
      : null;
  const weekSuffix = weekHasLY ? "LY" : weekHasLW ? "LW" : null;
  const weekIsNeg = weekDisplayPct !== null && weekDisplayPct < 0;
  /**
   * Whether the week card's percentage covers the whole week.
   *
   * It falls back to LW when no day has an LY match, so the figure being shown
   * can be over any number of days between one and seven. Store 590 showed
   * "-12.07% LY" in the same red as a complete week while comparing three
   * days, both weekend days missing.
   */
  const weekMatched = weekHasLY ? weekTotals.lyDayCount : weekTotals.lwDayCount;
  const weekPartial =
    weekDisplayPct !== null && weekMatched < weekTotals.dayCount;

  const firstDate = sorted[0]?.sale_date.split("T")[0] ?? "";
  const lastDate = sorted[sorted.length - 1]?.sale_date.split("T")[0] ?? "";
  const fmtShort = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  const weekRange =
    firstDate && lastDate
      ? `${fmtShort(firstDate)} – ${fmtShort(lastDate)}`
      : "";

  return (
    <div className="flex gap-1.5 p-1.5 border-b border-line_hair bg-fill_soft">
      {/* All week card */}
      <button
        onClick={() => onSelect(null)}
        className={`flex flex-col rounded-md overflow-hidden flex-[1.3] border transition-colors ${
          selectedDate === null
            ? "border-brand_navy ring-2 ring-brand_navy/30"
            : "border-line_field hover:border-line_strong"
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-0.5 py-2 px-1 bg-custom-white">
          <div className="text-[9px] cc-caps-strong">All Week</div>
          <div className="text-[12px] font-bold text-content">{weekRange}</div>
          <div className="text-[12px] font-bold text-content">
            {isQty ? formatBigNumber(weekTw, 0) : formatCurrency2(weekTw)}
          </div>
          <div
            className={`text-[11px] font-semibold ${weekDisplayPct === null || weekPartial ? "text-content" : weekIsNeg ? "text-severity_critical_text" : "text-severity_healthy_text"}`}
          >
            {weekDisplayPct !== null
              ? `${weekPartial ? "" : weekIsNeg ? "▼ " : "▲ "}${fmtPct(weekDisplayPct)} ${weekSuffix}`
              : "—"}
          </div>
          {weekPartial && (
            <div
              className="text-[10px] font-semibold text-content"
              title={`Only ${weekMatched} of the ${weekTotals.dayCount} days have a matching ${weekSuffix} date, so the percentage covers those days alone.`}
            >
              {weekMatched} of {weekTotals.dayCount} days
            </div>
          )}
        </div>
      </button>

      {/* Day cards */}
      {sorted.map((d) => (
        <DayCard key={d.sale_date.split("T")[0]} d={d} />
      ))}
    </div>
  );
};

export default PopupDaySidebar;
