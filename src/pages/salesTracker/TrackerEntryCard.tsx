import SearchCard from "../../components/SearchCard";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { setStartDate } from "../../features/searchSlice";
import { formatDate, formatGoliathDate } from "../../utils";
import { rangeForWeeks } from "./trackerWeeks";

interface TrackerEntryCardProps {
  onSearch: () => void;
  loading: boolean;
  notice?: string;
}

/** Shortcut spans. A free week count invited 3 or 40, neither of which
 *  produces a readable tracker; these fill the two date inputs rather than
 *  bypassing them, so what ran is always visible in the dates themselves. */
const WEEK_PRESETS = [4, 8, 12, 26];

/**
 * Entry point for the tracker.
 *
 * Start and end dates rather than a single date, matching the live page: a
 * range like 7/13 to 8/23 is a span somebody actually asks for, and a week
 * count cannot express it. The presets are shortcuts over the same two inputs —
 * pressing one writes the dates, so there is no hidden second way of saying
 * what period is loaded.
 */
const TrackerEntryCard = ({
  onSearch,
  loading,
  notice,
}: TrackerEntryCardProps) => {
  const dispatch = useAppDispatch();
  const { startDate, endDate } = useAppSelector((s) => s.search);

  const applyPreset = (weeks: number) => {
    // Anchored on whatever end date is already chosen, so a preset changes the
    // length of the span without moving where it finishes.
    const end = formatGoliathDate(endDate);
    dispatch(setStartDate(formatDate(rangeForWeeks(end, weeks))));
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
                    ? "bg-[#1e2a4a] text-custom-white"
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
