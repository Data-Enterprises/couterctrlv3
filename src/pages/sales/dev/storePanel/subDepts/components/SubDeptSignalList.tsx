// Hooks
import { useAppDispatch } from "../../../../../../hooks";
import { useSalesCtx } from "../../../hooks";

// Redux
import { setSubDeptThreshold } from "../../../../../../features/dev/devSalesLedgerSlice";

// Utils
import { PCT_COL_W, type SevFilter } from "../../../utils/index";
import {
  deptSeverity,
  nextDeptSort,
  SIGNAL_HEAD,
  sortDeptRows,
} from "../utils";

// Interfaces
import type { Coverage } from "../../../utils/ledgerUtils";
import type { Dispatch, SetStateAction } from "react";
import type { DeptRow, DeptSortColumn, DeptSortState } from "../interfaces";

// Components
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";
import SeverityChips from "../../../components/SeverityChips";
import ThresholdChip from "../../../components/ThresholdChip";
import SubDeptSignalRow from "./SubDeptSignalRow";

interface SubDeptSignalListProps {
  rows: DeptRow[];
  coverage: Coverage;
  threshold: number;
  sevFilter: SevFilter;
  setSevFilter: (v: SevFilter) => void;
  deptSort: DeptSortState;
  setDeptSort: Dispatch<SetStateAction<DeptSortState>>;
}

/**
 * The left panel: the store's sub departments, worst first, with grade chips,
 * the threshold and sortable columns.
 *
 * A floor as well as a percentage: the number columns need a fixed 246px, so
 * on a window under about 1200px the percentage alone left nothing for the
 * names. The detail side gives ground first.
 */
const SubDeptSignalList = ({
  rows,
  coverage,
  threshold,
  sevFilter,
  setSevFilter,
  deptSort,
  setDeptSort,
}: SubDeptSignalListProps) => {
  const dispatch = useAppDispatch();
  const { gradingMetric, subDeptThreshold } = useSalesCtx();
  const isQty = gradingMetric === "qty";

  const sevOf = (r: DeptRow) => deptSeverity(r, coverage, threshold, gradingMetric);
  const counts = {
    critical: rows.filter((r) => sevOf(r) === "critical").length,
    watch: rows.filter((r) => sevOf(r) === "watch").length,
    healthy: rows.filter((r) => sevOf(r) === "healthy").length,
  };
  const visible = sevFilter === "all" ? rows : rows.filter((r) => sevOf(r) === sevFilter);
  const sortedVisible = sortDeptRows(visible, deptSort, isQty);

  const sortBy = (column: DeptSortColumn) =>
    setDeptSort((prev) => nextDeptSort(prev, column));
  const chevron = (column: DeptSortColumn) =>
    deptSort?.column === column &&
    (deptSort.direction === "desc" ? (
      <ChevronDownIcon className="w-3 h-3" />
    ) : (
      <ChevronUpIcon className="w-3 h-3" />
    ));

  return (
    <div
      className="flex flex-col border-r border-line_hair min-w-[310px]"
      style={{ width: "39.5%" }}
    >
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-line_hair bg-gray-100">
        <SeverityChips value={sevFilter} onChange={setSevFilter} counts={counts} />
        <ThresholdChip
          value={subDeptThreshold}
          onChange={(v) => dispatch(setSubDeptThreshold(v))}
          ariaLabel="Sub dept grading threshold, percent"
        />
      </div>

      <div className="flex items-center gap-2.5 px-3 py-1.5 border-b border-line_hair flex-shrink-0">
        <span className="w-2.5 flex-shrink-0" />
        {/* A floor on the name, so a window too narrow for the row clips its
            right edge rather than hiding which department a number is for. */}
        <button onClick={() => sortBy("dept")} className={`${SIGNAL_HEAD} flex-1 min-w-[88px]`}>
          Sub Dept
          {chevron("dept")}
        </button>
        <div className="flex items-center gap-[14px]">
          <button
            onClick={() => sortBy("ty")}
            className={`${SIGNAL_HEAD} justify-end flex-shrink-0 pl-2.5`}
            style={{ width: 64 }}
          >
            TY
            {chevron("ty")}
          </button>
          <button
            onClick={() => sortBy("vsLW")}
            className={`${SIGNAL_HEAD} justify-center flex-shrink-0`}
            style={{ width: PCT_COL_W }}
          >
            vs LW
            {chevron("vsLW")}
          </button>
          {/* vs LY goes first when the row runs out of room: it is the weaker
              comparison, and a dash on every row for a store with no history. */}
          <button
            onClick={() => sortBy("vsLY")}
            className={`perf_narrow:hidden ${SIGNAL_HEAD} justify-center flex-shrink-0`}
            style={{ width: PCT_COL_W }}
          >
            vs LY
            {chevron("vsLY")}
          </button>
        </div>
      </div>

      <div className="overflow-y-auto thin-scrollbar flex-1">
        {sortedVisible.map((r) => (
          <SubDeptSignalRow key={r.id} row={r} coverage={coverage} threshold={threshold} />
        ))}
      </div>
    </div>
  );
};

export default SubDeptSignalList;
