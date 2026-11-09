// Utils
import { SUPPLY_LOOKBACK_DAYS } from "../utils/investigationData";
import { STAGE_NOTE } from "../utils";

// Interfaces
import type { Stage } from "../interfaces";

/** The note under the causes grid: orders and receipts cover a longer window, so they cannot explain the LW or LY columns. */
const SupplyWindowNote = ({
  them,
  window,
  stage,
}: {
  them: string;
  window: { start: string; end: string };
  stage: Stage;
}) => {
  /* The windows do not line up, and the screen says so rather than
     letting the grid imply every column is diagnosed. */
  return (
    <p className="text-[13px] text-content/95 mt-2.5">
      Causes explain this week against {them}.
      Orders and receipts are read over {SUPPLY_LOOKBACK_DAYS} days (
      {window.start} to {window.end}) — they cannot account for the
      LW or LY columns.
      {STAGE_NOTE[stage] && (
        <span className="ml-1.5 font-semibold">
          {STAGE_NOTE[stage]}
        </span>
      )}
    </p>
  );
};

export default SupplyWindowNote;
