// Utils
import { money, word } from "../utils";

// Interfaces
import type { ReportRow } from "../../../utils/deptReport";

interface ConcentratedNoteProps {
  /** The departments the headline counts, worst first. */
  shown: ReportRow[];
  /** The rest of the behind pile. */
  folded: ReportRow[];
  underTotal: number;
}

/** How much of the behind pile a few departments hold, and how many others
 *  hold the rest. */
const ConcentratedNote = ({
  shown,
  folded,
  underTotal,
}: ConcentratedNoteProps) => (
  <span>
    {word(shown.length)}{" "}
    {shown.length === 1 ? "department holds" : "departments hold"}{" "}
    <span className="font-bold tabular-nums text-delta_negative_text">
      {money(shown.reduce((t, r) => t - r.gap, 0))}
    </span>{" "}
    of the {money(underTotal)} behind
    {folded.length > 0 && (
      <>
        {" "}
        &middot; {folded.length}{" "}
        {folded.length === 1 ? "other holds" : "others hold"} the rest
      </>
    )}
    .
  </span>
);

export default ConcentratedNote;
