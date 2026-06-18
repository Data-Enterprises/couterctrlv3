import type { DayDot } from "./LedgerRow";

interface PopupDaySidebarProps {
  days: DayDot[];
  selectedDate: string | null;
  onSelect: (date: string | null) => void;
}

const fmtPct = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;

const PopupDaySidebar = ({ days, selectedDate, onSelect }: PopupDaySidebarProps) => {
  const sorted = [...days].sort((a, b) => a.sale_date.localeCompare(b.sale_date));

  const weekTw = sorted.reduce((acc, d) => acc + d.twNet, 0);
  const weekLy = sorted.reduce((acc, d) => acc + d.lyNet, 0);
  const weekVsLYPct = weekLy > 0 ? ((weekTw - weekLy) / weekLy) * 100 : 0;

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
          selectedDate === null ? "bg-[#1e2a4a]" : "bg-gray-50 hover:bg-gray-100"
        }`}
      >
        <div
          className={`text-[10px] font-bold ${selectedDate === null ? "text-white" : "text-content"}`}
        >
          All week
        </div>
        <div
          className={`text-[8px] mt-0.5 ${selectedDate === null ? "text-white/40" : "text-content/30"}`}
        >
          {weekRange}
        </div>
        <div
          className={`text-[10px] font-semibold mt-0.5 ${
            selectedDate === null
              ? weekVsLYPct >= 0
                ? "text-emerald-300"
                : "text-red-300"
              : weekVsLYPct >= 0
              ? "text-emerald-600"
              : "text-red-500"
          }`}
        >
          {fmtPct(weekVsLYPct)} LY
        </div>
      </button>

      {/* Day cards */}
      {sorted.map((d) => {
        const dateStr = d.sale_date.split("T")[0];
        const date = new Date(dateStr + "T12:00:00");
        const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" });
        const calLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const isSelected = selectedDate === dateStr;
        const vsLYPct = d.lyNet > 0 ? ((d.twNet - d.lyNet) / d.lyNet) * 100 : 0;
        const hasLY = d.lyNet > 0;
        const isNeg = vsLYPct < 0;

        return (
          <button
            key={dateStr}
            onClick={() => onSelect(dateStr)}
            className={`flex flex-col items-center justify-center px-1 py-2 border-r border-gray-100 last:border-r-0 transition-colors flex-1 ${
              isSelected ? "bg-[#1e2a4a]" : "bg-white hover:bg-gray-50"
            }`}
          >
            <div
              className={`text-[10px] font-semibold ${isSelected ? "text-white" : "text-content"}`}
            >
              {dayLabel}
            </div>
            <div
              className={`text-[8px] mt-0.5 ${isSelected ? "text-white/40" : "text-content/30"}`}
            >
              {calLabel}
            </div>
            <div
              className={`text-[9px] font-semibold mt-0.5 ${
                isSelected
                  ? isNeg
                    ? "text-red-300"
                    : "text-emerald-300"
                  : !hasLY
                  ? "text-content/20"
                  : isNeg
                  ? "text-red-500"
                  : "text-emerald-600"
              }`}
            >
              {hasLY ? fmtPct(vsLYPct) : "—"}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default PopupDaySidebar;
