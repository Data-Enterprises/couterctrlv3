// Utils
import { FINDING_SAYS, LIST_COLS, signed, units } from "../utils";

// Interfaces
import type { ReportRow } from "../../../utils/deptReport";

/* The list                                                            */
/**
 * One department in the left column.
 *
 * Every department is here, not only the ones that carry the shortfall.
 * The cut still decides what the headline counts and what the bar draws,
 * but a department left off the list entirely is one somebody has to take
 * on trust, and the point of the panel beside it is that nothing has to be
 * taken on trust.
 *
 * The row does nothing but change what that panel is showing. Every action
 * lives on the right, so there is no part of this list where clicking the
 * wrong thing does something unexpected.
 */
const ListRow = ({
  row,
  selected,
  onSelect,
}: {
  row: ReportRow;
  selected: boolean;
  onSelect: () => void;
}) => {
  const ahead = row.gap >= 0;
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-3 py-1.5 border-b border-b-brand_navy/15 border-l-2 transition-colors ${
        selected
          ? "bg-row_selected border-row_selected_border"
          : "border-transparent hover:bg-gray-50"
      }`}
    >
      <span
        className="grid items-center gap-2"
        style={{ gridTemplateColumns: LIST_COLS }}
      >
        <span
          className={`block w-2 h-2 rounded-full flex-shrink-0 ${
            ahead ? "bg-emerald-500" : "bg-red-500"
          }`}
        />
        <span className="min-w-0 truncate text-[12px] font-semibold text-content">
          {row.name}
        </span>
        <span
          className={`text-right text-[12px] font-bold tabular-nums whitespace-nowrap ${
            ahead ? "text-delta_positive_text" : "text-delta_negative_text"
          }`}
        >
          {signed(row.gap)}
        </span>
        {/* The units behind the money. A department down four thousand
            dollars on nine hundred fewer units is a different problem from
            one down four thousand on the same units, and the sentence
            underneath can only say which after the fact. */}
        <span
          className={`text-right text-[12px] tabular-nums whitespace-nowrap ${
            row.mineUnits - row.theirsUnits >= 0
              ? "text-delta_positive_text"
              : "text-delta_negative_text"
          }`}
        >
          {row.theirsUnits === 0 && row.mineUnits === 0
            ? "—"
            : units(row.mineUnits - row.theirsUnits, row.weighed)}
        </span>
      </span>
      <span className="block pl-4 text-[11px] text-content/85 truncate">
        {FINDING_SAYS[row.chain.finding]}
      </span>
    </button>
  );
};

export default ListRow;
