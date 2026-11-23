// Utils
import { severityDotClass } from "../../../../../../../utils/severity";

// Interfaces
import type { SortState } from "../../../../../../../utils/useTriStateSort";
import type { CompareMetric } from "../utils/topItemsCompare";

// Components
import SortHeader from "../../../../../../../components/SortHeader";

interface CompareLegendProps {
  compareStoreName: string;
  metric: CompareMetric;
  sort: SortState<"metric">;
  onSort: (col: "metric") => void;
}

/** The strip over the list: what the dots mean, and the sort on whatever gap
 *  the rows are reporting. */
const CompareLegend = ({
  compareStoreName,
  metric,
  sort,
  onSort,
}: CompareLegendProps) => (
  /* The ledger's own dots, so the two halves of the page grade in one
     language: ahead, behind, and behind past the threshold. */
  <div className="flex-shrink-0 flex items-center gap-3 px-3.5 py-1.5 border-b border-brand_line_2 bg-brand_paper flex-wrap">
    <span className="inline-flex items-center gap-1.5 text-[11px] text-content">
      <span
        className={`w-2.5 h-2.5 rounded-full ${severityDotClass.healthy}`}
      />
      ahead
    </span>
    <span className="inline-flex items-center gap-1.5 text-[11px] text-content">
      <span
        className={`w-2.5 h-2.5 rounded-full ${severityDotClass.critical}`}
      />
      behind
    </span>
    <span className="inline-flex items-center gap-1.5 text-[11px] text-content">
      <span className="w-2.5 h-2.5 rounded-full bg-brand_navy/15 border border-brand_navy/25" />
      {compareStoreName}
    </span>

    <span className="flex-1" />

    {/* Sorts by whatever the row is reporting, so the control and the figure
        beside it can never name different things. */}
    <SortHeader
      col="metric"
      label={metric === "sales" ? "Sales gap" : "Share gap"}
      sort={sort}
      onSort={onSort}
      className="text-[11px] font-semibold text-content"
    />
  </div>
);

export default CompareLegend;
