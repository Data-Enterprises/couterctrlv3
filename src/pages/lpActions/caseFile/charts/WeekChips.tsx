import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { setLpFocusedWeek } from "../../../../features/lpActionsSlice";
import { formatDateSimple } from "../../../../utils";
import type { WeekWindow } from "../../lpActionsMetrics";

/**
 * Which week the charts are counting.
 *
 * Folded across every walked week, the day-of-week chart answers "does this
 * recur on Saturdays" — the thing one week cannot say. Cut to a single week it
 * answers "which days last week", which is the shape the cards above are in.
 * Both are worth having and neither replaces the other, so this picks.
 *
 * Drives BOTH charts, never one. A day chart showing one week beside an hour
 * chart showing four is the period mismatch this control exists to resolve.
 */
interface Props {
  windows: WeekWindow[];
}

const WeekChips = ({ windows }: Props) => {
  const dispatch = useAppDispatch();
  const focusedWeek = useAppSelector((s) => s.lpActions.focusedWeek);

  if (windows.length < 2) return null;

  const chip = (active: boolean) =>
    `text-[12px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
      active
        ? "bg-[#1e2a4a] border-[#1e2a4a] text-custom-white"
        : "bg-custom-white border-gray-200 text-content hover:border-gray-400"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        aria-pressed={focusedWeek === null}
        onClick={() => dispatch(setLpFocusedWeek(null))}
        className={chip(focusedWeek === null)}
      >
        All {windows.length} weeks
      </button>

      {windows.map((w, i) => (
        <button
          key={w.start}
          aria-pressed={focusedWeek === i}
          // Clicking the selected week returns to the fold, so the control
          // needs no separate way out.
          onClick={() => dispatch(setLpFocusedWeek(focusedWeek === i ? null : i))}
          className={chip(focusedWeek === i)}
          title={`${w.start} to ${w.end}`}
        >
          {formatDateSimple(w.end)}
          {i === windows.length - 1 && (
            <span className={focusedWeek === i ? "" : "text-content/85"}>
              {" "}
              · latest
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default WeekChips;
