// Hooks
import { memo } from "react";

// Utils
import { formatCurrency2 } from "../../../../utils";
import { orDash } from "../utils/trackerTone";
import { SUB_GRID, NUM } from "../utils/trackerColumns";

// Interfaces
import type { SubDeptTotal } from "../interfaces";

// Components
import VsLy from "./VsLy";

interface SubDeptRowProps {
  row: SubDeptTotal;
  isSelected: boolean;
  onClick: (id: number) => void;
}

/**
 * One sub department, totalled across the window: the name, this year, last
 * year, ATS, and the comparison (one cell, see `VsLy`). This year is semibold;
 * the rest is context. Nothing is graded.
 */
const SubDeptRow = ({ row, isSelected, onClick }: SubDeptRowProps) => (
  <button
    onClick={() => onClick(row.id)}
    // The left accent is drawn inset, not as a border, so cells stay in line
    // with the header.
    className={`w-full grid items-center gap-3.5 px-4 py-3 text-left transition-colors border-b border-b-brand_navy/15 ${
      isSelected
        ? "bg-row_selected shadow-[inset_2px_0_0_0_rgb(var(--color-row-selected-border))]"
        : "hover:bg-fill_soft"
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
        row.salesLy === null ? "text-content/95" : "text-content"
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
