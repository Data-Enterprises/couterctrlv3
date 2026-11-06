// Utils
import { dayNumber } from "../utils";

// Interfaces
import type { DayBucket } from "../../interfaces";

// Components
import { TY_COLOR, UNSCOPED_OPACITY } from "../../../../../components-dev/mobile/perf/perfColors";

interface Props {
  buckets: DayBucket[];
  /** ISO date of the scoped day, or null for the whole window. */
  selected: string | null;
  onToggle: (iso: string) => void;
}

/**
 * The lookup window as one column per day, and the screen's only filter. Like
 * `PerfDayChart` but one column per day (no last year here); colour, dimming
 * and tap-again-to-clear are shared. Keyed by date so a scope change animates.
 */
const ItemDayChart = ({ buckets, selected, onToggle }: Props) => {
  const max = buckets.reduce((m, b) => Math.max(m, b.revenue), 0) || 1;

  return (
    <div className="flex items-end gap-[2px] px-1">
      {buckets.map((b) => {
        const isSel = selected === b.date;
        const dim = selected !== null && !isSel;
        return (
          <button
            key={b.date}
            type="button"
            onClick={() => onToggle(b.date)}
            aria-pressed={isSel}
            aria-label={`${b.label}${b.hasSale ? "" : ", no sales"}`}
            disabled={!b.hasSale}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-md py-1 ${
              isSel ? "bg-bkg" : b.hasSale ? "active:bg-bkg" : ""
            }`}
          >
            <span className="flex h-[72px] w-full items-end justify-center">
              <span
                className="w-[62%] rounded-t-[3px] transition-[height,opacity] duration-300 ease-out motion-reduce:transition-none"
                style={{
                  // A day with no sale still gets a 2px stub, so the window
                  // reads as fourteen days rather than as however many sold.
                  height: `${Math.max((b.revenue / max) * 72, 2)}px`,
                  background: TY_COLOR,
                  opacity: !b.hasSale ? 0.3 : dim ? UNSCOPED_OPACITY : 1,
                }}
              />
            </span>
            <span
              className={`text-[9.5px] ${
                isSel ? "font-bold text-content" : "font-medium text-content/85"
              }`}
            >
              {dayNumber(b.date)}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ItemDayChart;
