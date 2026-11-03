import { useCallback, useState } from "react";
import type { MouseEvent } from "react";

/** What is under the cursor, and where the cursor is on the screen. */
export interface CursorTip<K> {
  key: K;
  x: number;
  y: number;
}

/**
 * A tooltip that follows the mouse across a set of targets.
 *
 * Screen coordinates (clientX/Y), not offsets inside the chart: the tip is
 * drawn fixed to the viewport so no overflow-hidden card or scrolling panel
 * can clip it, at any panel size or zoom. `track(key)` gives each target its
 * move handler; `clear` goes on leaving the chart.
 */
export const useCursorTip = <K>() => {
  const [tip, setTip] = useState<CursorTip<K> | null>(null);

  const track = useCallback(
    (key: K) => (e: MouseEvent) => setTip({ key, x: e.clientX, y: e.clientY }),
    [],
  );

  const clear = useCallback(() => setTip(null), []);

  return { tip, track, clear };
};
