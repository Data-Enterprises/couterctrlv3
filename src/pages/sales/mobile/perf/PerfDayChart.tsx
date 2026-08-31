import type { PerfDay } from "./perfData";
import {
  LOSER_OPACITY,
  LY_COLOR,
  TY_COLOR,
  UNSCOPED_OPACITY,
} from "./perfColors";

interface Props {
  days: PerfDay[];
  selected: string | null;
  onToggle: (iso: string) => void;
}

/**
 * The week, as seven pairs of columns — and the screen's only filter.
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
        const tyWins = d.ty >= d.ly;

        const col = (value: number, colour: string, loser: boolean) => (
          <span
            className="w-[38%] rounded-t-[3px]"
            style={{
              height: `${Math.max((value / max) * 84, 2)}px`,
              background: colour,
              opacity: dim
                ? UNSCOPED_OPACITY
                : loser
                  ? LOSER_OPACITY
                  : 1,
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
            <span className="flex h-[84px] w-full items-end justify-center gap-[3px]">
              {col(d.ty, TY_COLOR, !tyWins)}
              {col(d.ly, LY_COLOR, tyWins)}
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
