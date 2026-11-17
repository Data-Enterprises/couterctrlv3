// Utils
import { LANDING_COLS, moneyText } from "../../utils";

// Interfaces
import type { DeptRollup } from "../../utils/topItems";

interface DeptShareRowProps {
  dept: DeptRollup;
  /** The list is narrowed to this department. */
  selected: boolean;
  /** Its share of the top 200's sales, as a percentage. */
  pct: number;
  /** The bar's width, as a percentage of the biggest department. */
  bar: number;
  /** Narrow the list to it, or clear the narrowing when it is already on. */
  onToggle: () => void;
}

/** One sub department's share of the top 200: name, bar, share and sales.
 *  Clicking it narrows the list to it; clicking it again clears that. */
const DeptShareRow = ({
  dept: d,
  selected,
  pct,
  bar,
  onToggle,
}: DeptShareRowProps) => (
  <button
    /* Clicking the row it is already filtered by clears the filter: the row
       is the control, so it has to be able to undo what it did. */
    onClick={onToggle}
    title={
      selected ? "Show every department again" : `Narrow the list to ${d.name}`
    }
    aria-pressed={selected}
    className={`w-full grid items-center gap-2 px-3 py-2 text-left border-b border-b-line_hair border-l-2 transition-colors ${
      selected ? "cc-row-selected" : "border-transparent hover:bg-fill_soft"
    }`}
    style={{ gridTemplateColumns: LANDING_COLS }}
  >
    <span
      className={`min-w-0 text-[13px] truncate ${
        selected ? "font-bold text-content" : "font-medium text-content"
      }`}
    >
      {d.name}
    </span>

    {/* The bar measures this period's sales and nothing else, so it is navy
        and ungraded: a bar's length is not a verdict. */}
    <span className="flex items-center gap-2 min-w-0">
      <span className="flex-1 h-3 rounded bg-bkg min-w-0">
        <span
          className="block h-full rounded bg-brand_navy"
          style={{ width: `${bar}%` }}
        />
      </span>
      <span className="w-[42px] flex-shrink-0 text-right text-[11.5px] text-content/95 tabular-nums">
        {pct.toFixed(1)}%
      </span>
    </span>

    <span className="text-right text-[13px] font-semibold text-content tabular-nums">
      {moneyText(d.ty)}
    </span>
  </button>
);

export default DeptShareRow;
