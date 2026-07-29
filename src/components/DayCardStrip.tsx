import { StarIcon } from "@heroicons/react/20/solid";
import { getHolidayName } from "../utils/holidays";

/**
 * The day-of-week card strip used across the Performance pages — an "All Week"
 * card followed by one card per day, on a gray tray.
 *
 * Purely presentational: each page computes its own metric and its own
 * comparison, then hands over display strings. That keeps one visual
 * definition of the pattern while letting Sales compare margin, LP compare
 * exception counts, and Coupon Sales compare the average coupon, none of which
 * reduce to a shared row shape.
 *
 * `higherIsWorse` flips the colour without flipping the arrow: LP and Coupon
 * Sales want a rise painted red, but the arrow should still point the way the
 * number actually moved.
 */
export interface DayCardEntry {
  /** YYYY-MM-DD. Also the selection value. */
  iso: string;
  /** Headline figure, already formatted. */
  value: string;
  /** Percentage move against the comparison period; null when ungraded. */
  delta: number | null;
  /** Hover text for the delta, e.g. the baseline value behind it. */
  deltaTitle?: string;
}

interface DayCardStripProps {
  days: DayCardEntry[];
  /** The all-week figure shown on the leading card. */
  weekValue: string;
  weekDelta: number | null;
  /** "" means all week. */
  selected: string;
  onSelect: (iso: string) => void;
  /** Optional suffix on the delta, naming the comparison. Off by default —
   *  the cards are already under a baseline-graded panel, so spelling it out
   *  on every card was noise. */
  deltaSuffix?: string;
  higherIsWorse?: boolean;
}

const fmtPct = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;

const DayCardStrip = ({
  days,
  weekValue,
  weekDelta,
  selected,
  onSelect,
  deltaSuffix = "",
  higherIsWorse = true,
}: DayCardStripProps) => {
  if (days.length === 0) return null;

  const deltaClass = (delta: number | null) => {
    if (delta === null) return "text-content";
    const bad = higherIsWorse ? delta > 0 : delta < 0;
    return bad ? "text-severity_critical_text" : "text-severity_healthy_text";
  };

  const deltaText = (delta: number | null) =>
    delta === null
      ? "—"
      : `${delta > 0 ? "▲" : "▼"} ${fmtPct(delta)}${deltaSuffix ? ` ${deltaSuffix}` : ""}`;

  const md = (iso: string) => {
    const d = new Date(iso + "T12:00:00");
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };
  const weekRange = `${md(days[0].iso)} – ${md(days[days.length - 1].iso)}`;

  return (
    <div className="flex-shrink-0 flex gap-1.5 p-1.5 border-b border-gray-100 bg-gray-50">
      {/* All week card */}
      <button
        onClick={() => onSelect("")}
        className={`flex flex-col rounded-md overflow-hidden flex-[1.3] border transition-colors ${
          selected === ""
            ? "border-[#1e2a4a] ring-2 ring-[#1e2a4a]/30"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-0.5 py-2 px-1 bg-custom-white">
          <div className="text-[9px] font-bold uppercase tracking-wide text-content">
            All Week
          </div>
          <div className="text-[12px] font-bold text-content leading-none">
            {weekRange}
          </div>
          <div className="text-[12px] font-bold text-content mt-1">{weekValue}</div>
          <div className={`text-[11px] font-semibold ${deltaClass(weekDelta)}`}>
            {deltaText(weekDelta)}
          </div>
        </div>
      </button>

      {days.map(({ iso, value, delta, deltaTitle }) => {
        const date = new Date(iso + "T12:00:00");
        const holidayName = getHolidayName(iso);
        const isSelected = selected === iso;
        return (
          <button
            key={iso}
            onClick={() => onSelect(isSelected ? "" : iso)}
            className={`relative flex flex-col rounded-md overflow-hidden flex-1 border transition-colors ${
              isSelected
                ? "border-[#1e2a4a] ring-2 ring-[#1e2a4a]/30"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {holidayName && (
              <span title={holidayName} className="absolute top-1 right-1 z-10">
                <StarIcon className="w-2.5 h-2.5 text-amber-500" />
              </span>
            )}
            <div className="flex flex-col items-center justify-center gap-0.5 py-2 px-1 bg-custom-white">
              <div className="text-[9px] font-bold uppercase tracking-wide text-content">
                {date.toLocaleDateString("en-US", { weekday: "long" })}
              </div>
              <div className="text-[12px] font-bold text-content leading-none">
                {md(iso)}
              </div>
              <div className="text-[12px] font-bold text-content mt-1">{value}</div>
              <div
                className={`text-[11px] font-semibold ${deltaClass(delta)}`}
                title={deltaTitle}
              >
                {deltaText(delta)}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default DayCardStrip;
