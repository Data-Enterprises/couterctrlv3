import type { DayDot } from "./LedgerRow";
import { getHolidayName } from "../../../utils/holidays";
import { formatCurrency2, formatBigNumber } from "../../../utils";
import { computeDayMatchedTotals } from "../shared/ledgerUtils";
import type { GradingMetric } from "../../../features/salesLedgerSlice";
import { StarIcon } from "@heroicons/react/20/solid";

interface PopupDaySidebarProps {
  days: DayDot[];
  selectedDate: string | null;
  gradingMetric: GradingMetric;
  onSelect: (date: string | null) => void;
}

const fmtPct = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;

const PopupDaySidebar = ({
  days,
  selectedDate,
  gradingMetric,
  onSelect,
}: PopupDaySidebarProps) => {
  const isQty = gradingMetric === "qty";
  const fmtMetric = (dollars: number, qty: number) =>
    isQty ? formatBigNumber(qty, 0) : formatCurrency2(dollars);
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
    <div className="flex gap-1.5 p-1.5 border-b border-gray-100 bg-gray-50">
      {/* All week card */}
      <button
        onClick={() => onSelect(null)}
        className={`flex flex-col rounded-md overflow-hidden flex-[1.3] border transition-colors ${
          selectedDate === null
            ? "border-[#1e2a4a] ring-2 ring-[#1e2a4a]/30"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-0.5 py-2 px-1 bg-custom-white">
          <div className="text-[9px] font-bold uppercase tracking-wide text-content">
            All Week
          </div>
          <div className="text-[12px] font-bold text-content">
            {weekRange}
          </div>
          <div className="text-[12px] font-bold text-content">
            {isQty ? formatBigNumber(weekTw, 0) : formatCurrency2(weekTw)}
          </div>
          <div
            className={`text-[11px] font-semibold ${weekDisplayPct === null ? "text-content" : weekIsNeg ? "text-severity_critical_text" : "text-severity_healthy_text"}`}
          >
            {weekDisplayPct !== null
              ? `${weekIsNeg ? "▼" : "▲"} ${fmtPct(weekDisplayPct)} ${weekSuffix}`
              : "—"}
          </div>
        </div>
      </button>

      {/* Day cards */}
      {sorted.map((d) => {
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
            key={dateStr}
            onClick={() => onSelect(dateStr)}
            className={`relative flex flex-col rounded-md overflow-hidden flex-1 border transition-colors ${
              isSelected
                ? "border-[#1e2a4a] ring-2 ring-[#1e2a4a]/30"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {holidayName && (
              <span
                title={holidayName}
                className="absolute top-1 right-1 z-10"
              >
                <StarIcon className="w-2.5 h-2.5 text-amber-500" />
              </span>
            )}
            <div className="flex flex-col items-center justify-center gap-0.5 py-2 px-1 bg-custom-white">
              <div className="text-[9px] font-bold uppercase tracking-wide text-content">
                {dayName}
              </div>
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
      })}
    </div>
  );
};

export default PopupDaySidebar;
