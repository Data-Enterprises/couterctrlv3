import { useCallback, useEffect, useRef, useState } from "react";
import type { AccessPicks } from "../access/accessSets";

/**
 * Edit's picks: seeded from what the person holds, and re-seeded as those
 * reads land (they arrive a moment apart).
 *
 * **Except after a save that stopped part way.** The page re-reads what was
 * saved, and that used to re-seed the picks too: the admin's unsaved changes
 * were replaced by what had saved, nothing differed any more, and Save
 * changes went grey while the banner said to press it. `keepPicks` stops the
 * re-seed, so the re-read moves only the "before" side, and what didn't save
 * stays different and is what Save changes sends.
 */
export const useSeededPicks = (
  editing: boolean,
  held: AccessPicks,
  initial: AccessPicks,
) => {
  const [picks, setPicks] = useState<AccessPicks>(initial);
  const kept = useRef(false);

  useEffect(() => {
    if (!editing || kept.current) return;
    setPicks(held);
  }, [editing, held]);

  const keepPicks = useCallback(() => {
    kept.current = true;
  }, []);

  return { picks, setPicks, keepPicks };
};
