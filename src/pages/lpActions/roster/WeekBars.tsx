import { BAR } from "./rosterTheme";
import type { LpSeverity } from "../lpActionsMetrics";

/**
 * The weeks, as a shape rather than a table.
 *
 * Deliberately unlabelled. The counts are one click away and the point here is
 * the silhouette: three grey bars and a coloured one is a spike, four level
 * bars is a habit, and a reader gets that without reading a single number.
 *
 * Heights are relative to the row's own peak, not to the panel's. Scaling
 * every row to a shared maximum would flatten every quiet cashier into a
 * single grey line and hide the one thing this strip is for.
 */
interface Props {
  /** Oldest week first. */
  weeks: number[];
  severity: LpSeverity;
  /** Labels the bars for a screen reader and on hover. */
  windows?: { start: string; end: string }[];
}

const MAX_HEIGHT = 20;

const WeekBars = ({ weeks, severity, windows }: Props) => {
  const peak = Math.max(...weeks, 1);

  return (
    <span
      className="flex items-end gap-[3px] h-5 flex-shrink-0"
      aria-label={`Weekly counts: ${weeks.join(", ")}`}
    >
      {weeks.map((count, i) => {
        const isLatest = i === weeks.length - 1;
        const window = windows?.[i];
        return (
          <span
            key={window?.start ?? i}
            title={window ? `${window.start} — ${count}` : String(count)}
            style={{ height: Math.max(2, Math.round((count / peak) * MAX_HEIGHT)) }}
            className={`w-2 rounded-sm ${isLatest ? BAR[severity] : "bg-gray-300"}`}
          />
        );
      })}
    </span>
  );
};

export default WeekBars;
