import { useAppDispatch, useAppSelector } from "../../../hooks";
import {
  setLpSevFilter,
  setLpRosterQuery,
} from "../../../features/lpActionsSlice";
import type { LpSevFilter } from "../../../features/lpActionsSlice";
import TextFilter from "../../../components/filters/TextFilter";
import type { LpSeverity } from "../lpActionsMetrics";

/**
 * Filter the roster: severity as chips, name or number as text.
 *
 * No "All" pill — clicking the active chip again deselects it, which is how
 * every other graded page in the app clears a severity filter.
 *
 * The two narrow in order: severity first, then the text within what is left.
 * AND, not OR. Filtering to Investigate and typing a name that is Steady
 * should find nothing, because that is the honest answer.
 *
 * The text side is the shared `TextFilter`, which already carries its own
 * active-state treatment and its own `flex-1`. No spacer beside it — a sibling
 * flex child would split the row and silently cap its width whatever the
 * `max-w` says.
 */
interface Props {
  counts: Record<LpSeverity, number>;
}

/**
 * Each chip carries its own ring class.
 *
 * `ring-current` was the obvious way to say "the ring matches the text", and
 * it does not survive an opacity modifier — `ring-current/40` falls back to
 * Tailwind's default ring, which is blue. So a selected Investigate chip rang
 * in a colour that means nothing on this page. The severity token is named
 * explicitly instead.
 */
const CHIPS: {
  key: Exclude<LpSevFilter, "all">;
  label: string;
  cls: string;
  ring: string;
}[] = [
  {
    key: "investigate",
    label: "Investigate",
    cls: "bg-severity_critical_bg text-severity_critical_text",
    ring: "ring-severity_critical_text/40",
  },
  {
    key: "watch",
    label: "Watch",
    cls: "bg-severity_watch_bg text-severity_watch_text",
    ring: "ring-severity_watch_text/40",
  },
  {
    key: "steady",
    label: "Steady",
    cls: "bg-severity_healthy_bg text-severity_healthy_text",
    ring: "ring-severity_healthy_text/40",
  },
];

const RosterChips = ({ counts }: Props) => {
  const dispatch = useAppDispatch();
  const { sevFilter, rosterQuery } = useAppSelector((s) => s.lpActions);

  return (
    <div className="flex-shrink-0 flex items-center justify-between gap-2 px-3 py-2 border-b border-gray-100">
      <div className="flex items-center gap-1.5">
        {CHIPS.map(({ key, label, cls, ring }) => (
          <button
            key={key}
            aria-pressed={sevFilter === key}
            onClick={() =>
              dispatch(setLpSevFilter(sevFilter === key ? "all" : key))
            }
            className={`text-[12px] font-semibold px-2 py-1 rounded-full transition-shadow ${cls} ${
              sevFilter === key ? `ring-2 shadow-sm ${ring}` : ""
            }`}
          >
            {label} {counts[key]}
          </button>
        ))}
      </div>

      <TextFilter
        value={rosterQuery}
        onChange={(v) => dispatch(setLpRosterQuery(v))}
        placeholder="Name or number"
        className="max-w-[190px]"
      />
    </div>
  );
};

export default RosterChips;
