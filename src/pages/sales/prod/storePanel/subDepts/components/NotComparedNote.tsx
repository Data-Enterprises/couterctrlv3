// Utils
import { money } from "../utils";

// Interfaces
import type { buildReport } from "../../../utils/deptReport";

interface NotComparedNoteProps {
  onlyMine: ReturnType<typeof buildReport>["onlyMine"];
  onlyTheirs: ReturnType<typeof buildReport>["onlyTheirs"];
  onlyMineTotal: number;
  onlyTheirsTotal: number;
  compareStoreName: string;
}

/**
 * The departments only one store carries, with what each pile is worth and
 * every one of them by name.
 *
 * A department only one store carries has no counterpart to be behind, so it
 * is not in the bar above -- but its money is real and it is most of why the
 * two stores differ at all. Naming it keeps the three parts adding up: the
 * bar, this, and the headline.
 */
const NotComparedNote = ({
  onlyMine,
  onlyTheirs,
  onlyMineTotal,
  onlyTheirsTotal,
  compareStoreName,
}: NotComparedNoteProps) => (
  <span>
    Not compared &mdash; departments only one store carries:{" "}
    {onlyMine.length > 0 && (
      <>
        <span className="font-semibold">{onlyMine.length}</span> only here worth{" "}
        <span className="font-bold tabular-nums text-delta_positive_text">
          {money(onlyMineTotal)}
        </span>
      </>
    )}
    {onlyMine.length > 0 && onlyTheirs.length > 0 && <> &middot; </>}
    {onlyTheirs.length > 0 && (
      <>
        <span className="font-semibold">{onlyTheirs.length}</span> only at{" "}
        {compareStoreName} worth{" "}
        <span className="font-bold tabular-nums text-delta_negative_text">
          {money(onlyTheirsTotal)}
        </span>
      </>
    )}
    .
    {/* Every one of them, by name, on its own line per store. These were
        three names and "and others" -- which told a reader there was
        something they were not being shown about the biggest unexplained
        figure on the screen. The strip overlays now, so the room to name them
        exists. */}
    <span className="mt-1 flex flex-col gap-0.5 text-content/95">
      {onlyMine.length > 0 && (
        <span>
          <span className="font-semibold">Only here:</span>{" "}
          {onlyMine.map((r) => r.name).join(", ")}
        </span>
      )}
      {onlyTheirs.length > 0 && (
        <span>
          <span className="font-semibold">Only at {compareStoreName}:</span>{" "}
          {onlyTheirs.map((r) => r.name).join(", ")}
        </span>
      )}
    </span>
  </span>
);

export default NotComparedNote;
