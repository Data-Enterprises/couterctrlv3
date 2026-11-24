// Hooks
import { useMemo } from "react";
import { useUpcDevCtx } from "../../hooks/useUpcDevCtx";

// Utils
import { MOVEMENT_DEFAULT_WEEKS, isoFromMdy, movementWeeks } from "./movementStats";

/**
 * The weeks Movement shows: ending on the search's end date, as many as the
 * tab is set to, or as many as the search covers until someone picks. One
 * hook so the tab, its KPI strip and the export agree.
 */
export const useMovementWindow = () => {
  const ctx = useUpcDevCtx();
  const endIso = ctx.endDate ? isoFromMdy(ctx.endDate) : "";
  const weeks = ctx.movementWeeks ?? MOVEMENT_DEFAULT_WEEKS;
  const windows = useMemo(() => (endIso ? movementWeeks(endIso, weeks) : []), [endIso, weeks]);
  return {
    endIso,
    weeks,
    windows,
    weekEndings: windows.map((w) => w.end),
    windowKey: `${endIso}|${weeks}`,
  };
};
