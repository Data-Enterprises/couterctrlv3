// Hooks
import { useMemo, useRef } from "react";
import { useSalesCtx, useSalesState } from "../../hooks";

// Utils
import { buildHourRows } from "./utils";

// Components
import HourSignalList from "./components/HourSignalList";
import HourDetailPanel from "./components/HourDetailPanel";

interface PopupHourlyViewProps {
  twDateLabel: string;
  lwDateLabel: string;
  lyDateLabel: string;
}

/** The store panel's Hourly tab: the graded hours on the left, the open hour
 *  on the right. */
const PopupHourlyView = ({
  twDateLabel,
  lwDateLabel,
  lyDateLabel,
}: PopupHourlyViewProps) => {
  const { gradingMetric, hourlyThreshold, selectedHour } = useSalesCtx();
  const { hourlySales, hourlySalesLastWeek, hourlySalesLastYear } = useSalesState();

  // A cleared threshold box keeps grading on the last valid amount, so rows do
  // not move until a new number is typed.
  const thresholdRef = useRef<number>(hourlyThreshold ?? 9);
  if (hourlyThreshold != null) thresholdRef.current = hourlyThreshold;
  const threshold = thresholdRef.current;

  const { rows, coverage } = useMemo(
    () =>
      buildHourRows(
        hourlySales,
        hourlySalesLastWeek,
        hourlySalesLastYear,
        threshold,
        gradingMetric,
      ),
    [hourlySales, hourlySalesLastWeek, hourlySalesLastYear, threshold, gradingMetric],
  );

  if (!rows.length) {
    return (
      <div className="flex items-center justify-center h-32 text-content text-sm">
        No hourly data
      </div>
    );
  }

  const selected =
    selectedHour !== null ? (rows.find((h) => h.hour === selectedHour) ?? null) : null;

  return (
    <div className="flex h-full">
      <HourSignalList rows={rows} coverage={coverage} threshold={threshold} />
      <HourDetailPanel
        selected={selected}
        coverage={coverage}
        threshold={threshold}
        twDateLabel={twDateLabel}
        lwDateLabel={lwDateLabel}
        lyDateLabel={lyDateLabel}
      />
    </div>
  );
};

export default PopupHourlyView;
