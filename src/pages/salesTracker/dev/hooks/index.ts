// Hooks
import { useAppSelector } from "../../../../hooks";

/** What Sales Tracker's sections read from Redux: the search dates and which weeks are open. */
export const useSalesTrackerCtx = () => {
  const { startDate, endDate } = useAppSelector((s) => s.search);
  const expandedWeeks = useAppSelector((s) => s.dev.salesTracker.expandedWeeks);
  return { startDate, endDate, expandedWeeks };
};
