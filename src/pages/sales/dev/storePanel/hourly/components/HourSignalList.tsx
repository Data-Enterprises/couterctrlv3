// Hooks
import { useAppDispatch } from "../../../../../../hooks";
import { useSalesCtx } from "../../../hooks";

// Redux
import { setHourlyThreshold } from "../../../../../../features/dev/devSalesLedgerSlice";

// Utils
import { PCT_COL_W } from "../../../utils/index";
import { hourSeverity, nextHourSort, sortHourRows } from "../utils";

// Interfaces
import type { SevFilter } from "../../../utils/index";
import type { Coverage } from "../../../utils/ledgerUtils";
import type { Dispatch, SetStateAction } from "react";
import type { HourRow, HourSortColumn, HourSortState } from "../interfaces";

// Components
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";
import SeverityChips from "../../../components/SeverityChips";
import ThresholdChip from "../../../components/ThresholdChip";
import HourSignalRow from "./HourSignalRow";

interface HourSignalListProps {
  rows: HourRow[];
  coverage: Coverage;
  threshold: number;
  sevFilter: SevFilter;
  setSevFilter: (v: SevFilter) => void;
  hourSort: HourSortState;
  setHourSort: Dispatch<SetStateAction<HourSortState>>;
}

const HEAD =
  "flex items-center gap-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-content/80 hover:text-content flex-shrink-0";

/** The left panel: the store's hours, worst first, with grade chips, the
 *  threshold and sortable columns. */
const HourSignalList = ({
  rows,
  coverage,
  threshold,
  sevFilter,
  setSevFilter,
  hourSort,
  setHourSort,
}: HourSignalListProps) => {
  const dispatch = useAppDispatch();
  const { gradingMetric, hourlyThreshold } = useSalesCtx();
  const isQty = gradingMetric === "qty";

  const sevOf = (r: HourRow) => hourSeverity(r, coverage, threshold, gradingMetric);
  const counts = {
    critical: rows.filter((r) => sevOf(r) === "critical").length,
    watch: rows.filter((r) => sevOf(r) === "watch").length,
    healthy: rows.filter((r) => sevOf(r) === "healthy").length,
  };
  const visible = sevFilter === "all" ? rows : rows.filter((r) => sevOf(r) === sevFilter);
  const sortedVisible = sortHourRows(visible, hourSort, isQty);

  const sortBy = (column: HourSortColumn) =>
    setHourSort((prev) => nextHourSort(prev, column));
  const chevron = (column: HourSortColumn) =>
    hourSort?.column === column &&
    (hourSort.direction === "desc" ? (
      <ChevronDownIcon className="w-3 h-3" />
    ) : (
      <ChevronUpIcon className="w-3 h-3" />
    ));

  return (
    <div className="flex flex-col border-r border-gray-100" style={{ width: "36.5%" }}>
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-100 bg-gray-100">
        <SeverityChips value={sevFilter} onChange={setSevFilter} counts={counts} />
        <ThresholdChip
          value={hourlyThreshold}
          onChange={(v) => dispatch(setHourlyThreshold(v))}
          ariaLabel="Hourly grading threshold, percent"
        />
      </div>

      <div className="flex items-center gap-2.5 px-3 py-1.5 border-b border-gray-100 flex-shrink-0">
        <span className="w-2.5 flex-shrink-0" />
        <span className="text-[11.5px] font-semibold uppercase tracking-wide text-content/80 flex-1">
          Hour
        </span>
        <div className="flex items-center gap-[14px]">
          <button
            onClick={() => sortBy("ty")}
            className={`${HEAD} justify-end pl-2.5`}
            style={{ width: 64 }}
          >
            TY
            {chevron("ty")}
          </button>
          <button
            onClick={() => sortBy("vsLW")}
            className={`${HEAD} justify-center`}
            style={{ width: PCT_COL_W }}
          >
            vs LW
            {chevron("vsLW")}
          </button>
          <button
            onClick={() => sortBy("vsLY")}
            className={`${HEAD} justify-center`}
            style={{ width: PCT_COL_W }}
          >
            vs LY
            {chevron("vsLY")}
          </button>
        </div>
      </div>

      <div className="overflow-y-auto thin-scrollbar flex-1">
        {sortedVisible.map((r) => (
          <HourSignalRow key={r.hour} row={r} coverage={coverage} threshold={threshold} />
        ))}
      </div>
    </div>
  );
};

export default HourSignalList;
