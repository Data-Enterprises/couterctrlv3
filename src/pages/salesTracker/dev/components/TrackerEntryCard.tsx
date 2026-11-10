// Hooks
import { useAppDispatch } from "../../../../hooks";
import { useSalesTrackerCtx } from "../hooks";

// Redux
import { setStartDate } from "../../../../features/searchSlice";

// Utils
import { formatGoliathDate } from "../../../../utils";
import { isoToDisplay, rangeForWeeks, WEEK_PRESETS } from "../utils";

// Components
import SearchCard from "../../../../components-dev/SearchCard";

interface TrackerEntryCardProps {
  onSearch: () => void;
  loading: boolean;
  notice?: string;
}

/**
 * Entry point for the tracker: start and end dates (a range like 7/13 to 8/23),
 * with presets that write those same dates.
 */
const TrackerEntryCard = ({
  onSearch,
  loading,
  notice,
}: TrackerEntryCardProps) => {
  const dispatch = useAppDispatch();
  const { startDate, endDate } = useSalesTrackerCtx();

  const applyPreset = (weeks: number) => {
    // Anchored on whatever end date is already chosen, so a preset changes the
    // length of the span without moving where it finishes.
    const end = formatGoliathDate(endDate);
    dispatch(setStartDate(isoToDisplay(rangeForWeeks(end, weeks))));
  };

  const activePreset = WEEK_PRESETS.find(
    (w) =>
      rangeForWeeks(formatGoliathDate(endDate), w) ===
      formatGoliathDate(startDate),
  );

  return (
    <SearchCard
      title="Sales Tracker"
      description="Select a store or group and the period to track."
      buttonLabel="Load Tracker"
      onSearch={onSearch}
      loading={loading}
      loadingMessage="Building tracker..."
      notice={notice}
      extraControls={
        <div className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-content">
            Or track back from the end date
          </span>
          <div className="flex items-center rounded-lg overflow-hidden border border-gray-200">
            {WEEK_PRESETS.map((w) => (
              <button
                key={w}
                onClick={() => applyPreset(w)}
                className={`flex-1 py-1.5 text-[12px] font-semibold transition-colors ${
                  activePreset === w
                    ? "bg-brand_navy text-custom-white"
                    : "bg-custom-white text-content hover:bg-gray-50"
                }`}
              >
                {w} wks
              </button>
            ))}
          </div>
        </div>
      }
    />
  );
};

export default TrackerEntryCard;
