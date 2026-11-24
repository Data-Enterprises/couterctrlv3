// Hooks
import { useCallback, useState } from "react";

/**
 * A tick for a tab's fetch effect to depend on, and `retry()` to move it.
 * Every search abandons calls in flight; a re-search that changes none of the
 * effect's dependencies would leave the tab empty, so a tab calls `retry()`
 * after an abandoned call. Only abandoned ones: a real failure waits for the
 * next visit.
 */
export const useAbandonedRetry = () => {
  const [tick, setTick] = useState(0);
  const retry = useCallback(() => setTick((n) => n + 1), []);
  return [tick, retry] as const;
};
