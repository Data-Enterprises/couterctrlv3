import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";

/**
 * The week's days as selectable cards, with an ALL cell in front.
 *
 * Sits directly under the KPI strip on every single-store Performance page and
 * rescopes everything below it. Extracted when Sub Dept Margins, Categories and
 * Vendors all grew one — Sales still renders its own copy inline, which is the
 * next thing to fold in here.
 *
 * The caller decides what "up" means. Margin pages compare margin points, sales
 * pages compare dollars, and `hasRef` is the caller saying there was nothing to
 * compare against at all — which is not the same as a day that fell.
 */

export interface DayStripEntry {
  /** ISO date, always the *this week* day. */
  date: string;
  isUp: boolean;
  hasRef: boolean;
}

interface Props {
  days: DayStripEntry[];
  selected: string | null;
  onSelect: (date: string | null) => void;
}

const MobileDayStrip = ({ days, selected, onSelect }: Props) => (
  <div
    className="grid bg-custom-white border-b border-gray-100 flex-shrink-0"
    style={{ gridTemplateColumns: `repeat(${days.length + 1}, 1fr)` }}
  >
    <button
      onClick={() => onSelect(null)}
      className={`flex flex-col items-center justify-center py-2 border-r border-gray-100 transition-colors ${
        selected === null ? "bg-[#1e2a4a]" : "hover:bg-gray-50"
      }`}
    >
      <span
        className={`text-[10px] font-bold ${selected === null ? "text-custom-white" : "text-content"}`}
      >
        ALL
      </span>
      <span
        className={`text-[10px] mt-0.5 ${selected === null ? "text-custom-white" : "text-content"}`}
      >
        wk
      </span>
    </button>
    {days.map(({ date, isUp, hasRef }) => {
      // Callers pass whatever their API gave them — Sub Dept Margins
      // hands over a full `sale_date` with a time on it, so appending
      // another one produced "…T00:00:00T12:00:00" and an Invalid Date.
      const d = new Date(date.split("T")[0] + "T12:00:00");
      const isSelected = selected === date;
      // Grey when there was no comparison at all — the icon still reads as a
      // tick, but a colourless one, rather than claiming the day was up.
      const color = !hasRef ? "#9ca3af" : isUp ? "#10b981" : "#ef4444";
      return (
        <button
          key={date}
          onClick={() => onSelect(isSelected ? null : date)}
          className={`flex flex-col items-center justify-center gap-1 py-2 border-r border-gray-100 last:border-r-0 transition-colors ${
            isSelected ? "bg-[#1e2a4a]" : "hover:bg-gray-50"
          }`}
        >
          <span
            className={`text-[10px] font-semibold leading-none ${isSelected ? "text-custom-white" : "text-content"}`}
          >
            {d.toLocaleDateString("en-US", { weekday: "short" })}{" "}
            <span
              className={
                isSelected ? "text-custom-white/85" : "text-content/85"
              }
            >
              {d.toLocaleDateString("en-US", {
                month: "numeric",
                day: "numeric",
              })}
            </span>
          </span>
          <div className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center flex-shrink-0">
            {!hasRef || isUp ? (
              <CheckCircleIcon className="w-5 h-5" style={{ color }} />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5" style={{ color }} />
            )}
          </div>
        </button>
      );
    })}
  </div>
);

export default MobileDayStrip;
