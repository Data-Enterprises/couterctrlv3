// Utils
import {
  pillClass,
  comparisonPillClass,
  PCT_COL_W,
  formatPct,
} from "../../../../../utils/severity";

// Interfaces
import type { HourListRow } from "../interfaces";

interface HourRowButtonProps {
  row: HourListRow;
  /** This week's figure, already formatted. */
  valueText: string;
  threshold: number;
  isSelected: boolean;
  onPick: () => void;
}

/** One hour in the Hours list: its label, figure and graded change. An hour
 *  with no grading basis still shows its change, in grey. */
const HourRowButton = ({
  row: r,
  valueText,
  threshold,
  isSelected,
  onPick,
}: HourRowButtonProps) => (
  <button
    onClick={onPick}
    className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors border-l-2 border-b border-b-brand_navy/15 ${
      isSelected ? "cc-row-selected" : "border-transparent hover:bg-fill_soft"
    }`}
  >
    <span className="text-[12px] font-medium text-content truncate flex-1">
      {r.label}
    </span>
    <span className="text-[12px] font-semibold text-content tabular-nums flex-shrink-0">
      {valueText}
    </span>
    <span
      className={`text-[11px] font-semibold px-1.5 py-0.5 rounded text-center flex-shrink-0 whitespace-nowrap ${
        r.shownPct !== null
          ? pillClass(r.shownPct, threshold)
          : comparisonPillClass(r.yp ?? r.lp, false, threshold)
      }`}
      style={{ minWidth: PCT_COL_W }}
    >
      {(r.shownPct ?? r.yp ?? r.lp) !== null
        ? formatPct((r.shownPct ?? r.yp ?? r.lp) as number)
        : "—"}
    </span>
  </button>
);

export default HourRowButton;
