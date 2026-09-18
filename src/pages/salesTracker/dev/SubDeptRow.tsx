import { memo } from "react";
import { formatCurrency2 } from "../../../utils";
import { orDash } from "./trackerTone";
import { SUB_GRID, NUM } from "./trackerColumns";
import VsLy from "./VsLy";
import type { SubDeptTotal } from "./trackerTotals";

interface SubDeptRowProps {
  row: SubDeptTotal;
  isSelected: boolean;
  onClick: (id: number) => void;
}

/**
 * One sub department, totalled across the window.
 *
 * Four cells: the name, this year, last year, ATS, and the comparison — which
 * is one cell carrying dollars and percent together rather than two coloured
 * columns competing for the eye. See `VsLy`.
 *
 * Weight does the hierarchy: this year is the figure being read, so it is
 * semibold; last year and ATS are context at regular weight. No severity dot,
 * because nothing here is graded.
 */
const SubDeptRow = ({ row, isSelected, onClick }: SubDeptRowProps) => (
  <button
    onClick={() => onClick(row.id)}
    // The left accent is drawn inset rather than as a border: a 2px border on
    // the row and none on the header would shift every cell 2px out of line
    // with the column above it.
    className={`w-full grid items-center gap-3.5 px-4 py-3 text-left transition-colors border-b border-b-[#1e2a4a]/15 ${
      isSelected
        ? "bg-row_selected shadow-[inset_2px_0_0_0_rgb(var(--color-row-selected-border))]"
        : "hover:bg-gray-50"
    }`}
    style={{ gridTemplateColumns: SUB_GRID }}
  >
    <span className="text-[13.5px] font-medium text-content truncate">
      {row.desc}
    </span>

    <span
      className={`text-[13.5px] font-semibold text-content text-right ${NUM}`}
    >
      {formatCurrency2(row.salesTy)}
    </span>

    {/* Greyed when there is nothing to compare against, so a department with no
        last-year history reads as absent rather than as one that took nothing. */}
    <span
      className={`text-[13.5px] text-right ${NUM} ${
        row.salesLy === null ? "text-content/50" : "text-content"
      }`}
    >
      {orDash(row.salesLy, formatCurrency2)}
    </span>

    <span className={`text-[13.5px] text-content text-right ${NUM}`}>
      {orDash(row.ats, formatCurrency2)}
    </span>

    <VsLy dollarChange={row.dollarChange} pctChange={row.pctChange} />
  </button>
);

export default memo(SubDeptRow);
