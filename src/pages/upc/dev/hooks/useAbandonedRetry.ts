// Hooks
import { useCallback, useState } from "react";

/**
 * A tick for a tab's fetch effect to depend on, and the call that moves it.
 *
 * Every search calls `upcQueue.startRun()`, which abandons the calls in flight:
 * their `enqueue` resolves null and the tab returns without covering anything.
 * The fetch effect only runs again when its own dependencies change, and a
 * re-search of the same UPCs, or one that only adds UPCs, changes none of them,
 * so the tab sat empty until the user left it and came back. A tab calls
 * `retry()` once its loading flag is cleared after an abandoned call, and the
 * effect looks again against whatever the search is now.
 *
 * Only on an abandoned call. A real failure is still left for the next visit,
 * or a call that fails every time would be asked for again and again.
 */
export const useAbandonedRetry = () => {
  const [tick, setTick] = useState(0);
  const retry = useCallback(() => setTick((n) => n + 1), []);
  return [tick, retry] as const;
};
