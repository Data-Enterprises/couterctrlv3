import type { DayDot } from "./LedgerRow";

interface PopupDaySidebarProps {
  days: DayDot[];
  selectedDate: string | null;
  onSelect: (date: string | null) => void;
}

const PopupDaySidebar = ({ days, selectedDate, onSelect }: PopupDaySidebarProps) => {
  const sorted = [...days].sort((a, b) => a.sale_date.localeCompare(b.sale_date));

  const weekVsLYPct = (() => {
    const twTotal = sorted.reduce((acc, d) => acc + d.twNet, 0);
    const lyTotal = sorted.reduce((acc, d) => acc + d.lyNet, 0);
    return lyTotal ? ((twTotal - lyTotal) / lyTotal) * 100 : 0;
  })();

  const fmtPct = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;

  return (
    <div className="flex items-stretch gap-1.5 px-3 py-2 border-b border-gray-100 bg-gray-50 overflow-x-auto no-scrollbar">
      <button
        onClick={() => onSelect(null)}
        className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-center transition-colors ${
          selectedDate === null
            ? "bg-[#1e2a4a] text-white"
            : "bg-white border border-gray-200 hover:border-[#1e2a4a]"
        }`}
      >
        <div className="text-[10px] font-medium whitespace-nowrap">All week</div>
        <div className={`text-[10px] font-medium mt-0.5 ${
          selectedDate === null
            ? weekVsLYPct >= 0 ? "text-emerald-300" : "text-red-300"
            : weekVsLYPct >= 0 ? "text-emerald-600" : "text-red-500"
        }`}>
          {fmtPct(weekVsLYPct)} LY
        </div>
      </button>

      <div className="w-px bg-gray-200 flex-shrink-0 self-stretch" />

      {sorted.map((d) => {
        const date = new Date(d.sale_date.split("T")[0] + "T12:00:00");
        const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" });
        const dateLabel = date.toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
        const key = d.sale_date.split("T")[0];
        const isSelected = selectedDate === key;
        const vsLYPct = d.lyNet ? ((d.twNet - d.lyNet) / d.lyNet) * 100 : 0;
        const isNeg = vsLYPct < 0;
        const hasLY = d.lyNet > 0;

        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-center transition-colors border ${
              isSelected
                ? isNeg
                  ? "bg-red-100 border-red-300"
                  : "bg-emerald-100 border-emerald-300"
                : isNeg
                ? "bg-red-50 border-red-200 hover:border-red-400"
                : "bg-white border-gray-200 hover:border-emerald-300"
            }`}
          >
            <div className={`text-[10px] font-medium whitespace-nowrap ${isNeg ? "text-red-800" : "text-content"}`}>
              {dayLabel} {dateLabel}
            </div>
            <div className={`text-[10px] font-medium mt-0.5 ${
              !hasLY ? "text-content/30" : isNeg ? "text-red-600" : "text-emerald-600"
            }`}>
              {hasLY ? fmtPct(vsLYPct) : "—"} LY
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default PopupDaySidebar;
