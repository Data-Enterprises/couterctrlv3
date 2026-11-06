// Hooks
import { useMemo } from "react";
import { useUpcDevCtx } from "../../hooks/useUpcDevCtx";

// Utils
import { MOVEMENT_DEFAULT_WEEKS, isoFromMdy, movementWeeks } from "./movementStats";

/**
 * The weeks Movement shows: ending on the search's end date, as many as the
 * tab is set to, or as many as the search's range covers until someone picks.
 *
 * One hook because the tab, its KPI strip and the export all have to agree on
 * the same weeks — three copies of this arithmetic would be three chances for
 * a CSV whose columns aren't the grid's.
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
