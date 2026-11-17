// Utils
import { TOGGLE_OPTS } from "../../utils";

// Interfaces
import type { CategoryMetric, ThresholdValue } from "../../../../../interfaces";

// Components
import BackButton from "../../../../../components-dev/BackButton";
import PageInfoButton from "../../../../../components-dev/PageInfoButton";
import ThresholdFilter from "../../../../../components-dev/filters/ThresholdFilter";

interface ListControlsRowProps {
  /** The location on screen, which names the combined pair when both. */
  locationName: string;
  metric: CategoryMetric;
  onMetric: (metric: CategoryMetric) => void;
  threshold: number | null;
  onThreshold: (value: number | null) => void;
  onSearchOpen: () => void;
}

/** The list header's second row: Back to the search, the store, the
 *  Sales/Qty toggle, the threshold and help. */
const ListControlsRow = ({
  locationName,
  metric,
  onMetric,
  threshold,
  onThreshold,
  onSearchOpen,
}: ListControlsRowProps) => {
  const threshValue: ThresholdValue | null =
    threshold === null ? null : { op: "lt", amount: threshold };

  return (
    <div className="flex items-center gap-2 cc-navy-header-row">
      <BackButton onClick={onSearchOpen} helpAnchor="search" />

      <span className="text-[11px] font-medium text-custom-white truncate min-w-0">
        {locationName}
      </span>

      <div className="flex-1" />

      <div
        data-help="metric"
        className="flex items-center flex-shrink-0 rounded overflow-hidden"
        style={{ height: 22 }}
      >
        {TOGGLE_OPTS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onMetric(key)}
            className={`px-2.5 text-[10px] text-custom-white font-medium transition-colors h-full ${
              metric === key ? "bg-custom-white/20" : "bg-custom-white/[0.07]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />

      {/* Threshold. The label stays generic so the Performance headers read
          identically — the page already says what is being graded. */}
      <div
        data-help="threshold"
        className="flex items-center gap-1.5 flex-shrink-0"
      >
        <span className="text-[11px] text-custom-white font-medium">
          Threshold
        </span>
        <ThresholdFilter
          value={threshValue}
          onChange={(v) => onThreshold(v?.amount ?? null)}
          suffix="%"
          showOp={false}
          inputWidth={40}
          variant="dark"
        />
      </div>

      <div className="relative flex-shrink-0">
        <PageInfoButton page="categories" />
      </div>
    </div>
  );
};

export default ListControlsRow;
