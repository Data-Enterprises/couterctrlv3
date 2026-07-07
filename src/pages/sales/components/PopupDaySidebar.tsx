import type { DayDot } from "./LedgerRow";
import { getHolidayName } from "../../../utils/holidays";
import { StarIcon } from "@heroicons/react/20/solid";

interface PopupDaySidebarProps {
  days: DayDot[];
  selectedDate: string | null;
  onSelect: (date: string | null) => void;
}

const fmtPct = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;

const INSET_SHADOW = { boxShadow: "inset 0 -4px 0 rgba(30, 42, 74, 0.5)" };

const PopupDaySidebar = ({ days, selectedDate, onSelect }: PopupDaySidebarProps) => {
  const sorted = [...days].sort((a, b) => a.sale_date.localeCompare(b.sale_date));

  const weekTw = sorted.reduce((acc, d) => acc + d.twNet, 0);
  const weekLw = sorted.reduce((acc, d) => acc + d.lwNet, 0);
  const weekLy = sorted.reduce((acc, d) => acc + d.lyNet, 0);
  const weekHasLY = weekLy > 0;
  const weekHasLW = weekLw > 0;
  const weekDisplayPct = weekHasLY
    ? ((weekTw - weekLy) / weekLy) * 100
    : weekHasLW
    ? ((weekTw - weekLw) / weekLw) * 100
    : null;
  const weekSuffix = weekHasLY ? "LY" : weekHasLW ? "LW" : null;

  const firstDate = sorted[0]?.sale_date.split("T")[0] ?? "";
  const lastDate = sorted[sorted.length - 1]?.sale_date.split("T")[0] ?? "";
  const fmtShort = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const weekRange = firstDate && lastDate ? `${fmtShort(firstDate)} – ${fmtShort(lastDate)}` : "";

  return (
    <div className="flex border-b border-gray-100">
      {/* All week card */}
      <button
        onClick={() => onSelect(null)}
        className={`flex flex-col items-center justify-center px-3 py-2 border-r-2 border-gray-200 transition-colors flex-[1.3] ${
          selectedDate === null ? "bg-gray-100" : "bg-gray-50 hover:bg-gray-100"
        }`}
        style={selectedDate === null ? INSET_SHADOW : undefined}
      >
        <div className="text-[10px] font-bold text-content">All week</div>
        <div className="text-[8px] mt-0.5 text-content/35">{weekRange}</div>
        <div className={`text-[10px] font-semibold mt-0.5 ${weekDisplayPct === null ? "text-content/25" : weekDisplayPct < 0 ? "text-red-500" : "text-emerald-600"}`}>
          {weekDisplayPct !== null ? `${fmtPct(weekDisplayPct)} ${weekSuffix}` : "—"}
        </div>
      </button>

      {/* Day cards */}
      {sorted.map((d) => {
        const dateStr = d.sale_date.split("T")[0];
        const date = new Date(dateStr + "T12:00:00");
        const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" });
        const calLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const isSelected = selectedDate === dateStr;
        const hasLY = d.lyNet > 0;
        const hasLW = d.lwNet > 0;
        const vsLYPct = hasLY ? ((d.twNet - d.lyNet) / d.lyNet) * 100 : null;
        const vsLWPct = hasLW ? ((d.twNet - d.lwNet) / d.lwNet) * 100 : null;
        const displayPct = vsLYPct ?? vsLWPct;
        const displaySuffix = hasLY ? "LY" : hasLW ? "LW" : null;
        const isNeg = displayPct !== null && displayPct < 0;
        const holidayName = getHolidayName(dateStr);

        return (
          <button
            key={dateStr}
            onClick={() => onSelect(dateStr)}
            className={`relative flex flex-col items-center justify-center px-1 py-2 border-r border-gray-100 last:border-r-0 transition-colors flex-1 ${
              isSelected ? "bg-gray-100" : "bg-white hover:bg-gray-50"
            }`}
            style={isSelected ? INSET_SHADOW : undefined}
          >
            {holidayName && (
              <span title={holidayName} className="absolute top-1 right-1">
                <StarIcon className="w-2.5 h-2.5 text-amber-500" />
              </span>
            )}
            <div className="text-[10px] font-semibold text-content">{dayLabel}</div>
            <div className="text-[8px] mt-0.5 text-content/35">{calLabel}</div>
            <div className={`text-[9px] font-semibold mt-0.5 ${displayPct === null ? "text-content/25" : isNeg ? "text-red-500" : "text-emerald-600"}`}>
              {displayPct !== null ? `${fmtPct(displayPct)} ${displaySuffix}` : "—"}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default PopupDaySidebar;
