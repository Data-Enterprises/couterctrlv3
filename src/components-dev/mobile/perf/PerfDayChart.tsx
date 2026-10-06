import type { PerfDay } from "../../../utils/perfPairs";
import {
  DOWN_COLOR,
  LY_COLOR,
  UNSCOPED_OPACITY,
  UP_COLOR,
} from "./perfColors";

interface Props {
  days: PerfDay[];
  selected: string | null;
  onToggle: (iso: string) => void;
}

/**
 * The week, as seven pairs of columns — and the screen's only filter.
 *
 * Shared by every mobile Performance page: Sales, Sub Dept Margins, Vendors,
 * Categories, Loss Prevention and Coupon Sales all render this one component,
 * so a change here lands on all six.
 *
 * There is no separate day strip and no "all week" button. Tapping a column
 * scopes the totals card and the list below to that day; tapping the same
 * column again clears it. An eighth control meaning "no filter" would be a
 * control explaining another control.
 *
 * While a day is selected the other six drop right back rather than
 * disappearing, so the week's shape survives while you read one day of it.
 */
const PerfDayChart = ({ days, selected, onToggle }: Props) => {
  const max = days.reduce((m, d) => Math.max(m, d.ty, d.ly), 0) || 1;

  return (
    <div className="flex items-end gap-1 px-1">
      {days.map((d) => {
        const isSel = selected === d.iso;
        const dim = selected !== null && !isSel;
        // Same rule as the bars: the TY column says which way the day went,
        // the LY column stays neutral as the thing it went against.
        const tyColour = d.ty >= d.ly ? UP_COLOR : DOWN_COLOR;

        const col = (value: number, colour: string) => (
          <span
            // Height and opacity are the two things that move: the figures
            // change when the scope does, and the scoping dim changes when a
            // day is picked. Easing both means switching view, swiping a lens
            // or tapping a day redraws the week rather than cutting to it.
            //
            // The columns are keyed by date through the button above, so React
            // keeps the same nodes across a scope change and the transition
            // has something to run on. A NEW week replaces them and lands at
            // full height with no animation, which is correct — that is a new
            // chart, not a change to this one.
            className="w-[38%] rounded-t-[3px] transition-[height,opacity] duration-300 ease-out motion-reduce:transition-none"
            style={{
              height: `${Math.max((value / max) * 80, 2)}px`,
              background: colour,
              opacity: dim ? UNSCOPED_OPACITY : 1,
            }}
          />
        );

        return (
          <button
            key={d.iso}
            type="button"
            onClick={() => onToggle(d.iso)}
            aria-pressed={isSel}
            className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg py-1 active:bg-bkg"
          >
            <span className="flex h-[80px] w-full items-end justify-center gap-[3px]">
              {col(d.ty, tyColour)}
              {col(d.ly, LY_COLOR)}
            </span>
            <span
              className={`text-[11.5px] ${isSel ? "font-bold text-content" : "font-medium text-content/85"}`}
            >
              {d.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default PerfDayChart;
