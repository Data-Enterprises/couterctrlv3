// Utils
import { LANDING_COLS, moneyText } from "../utils";

// Interfaces
import type { DeptRollup } from "../utils/topItems";

interface DeptShareListProps {
  landing: { shown: DeptRollup[]; top: number; total: number };
  dept: string;
  setDept: (value: string) => void;
}

/** The landing's sub departments, biggest first; a row narrows the list to it. */
const DeptShareList = ({ landing, dept, setDept }: DeptShareListProps) => (
  <>
    <div
      className="grid items-end gap-2 px-3 py-1.5 border-b border-line_hair flex-shrink-0 text-[11px] font-bold uppercase tracking-wide text-content/95"
      style={{ gridTemplateColumns: LANDING_COLS }}
    >
      <span>Sub dept</span>
      <span>Share of top 200</span>
      <span className="text-right">Sales</span>
    </div>

    <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
      {landing.shown.map((d) => {
        const pct =
          landing.top > 0 ? (d.ty / landing.total) * 100 : 0;
        return (
          <button
            key={d.name}
            /* Clicking the row it is already filtered by clears
               the filter: the row is the control, so it has to be
               able to undo what it did. */
            onClick={() => setDept(dept === d.name ? "" : d.name)}
            title={
              dept === d.name
                ? "Show every department again"
                : `Narrow the list to ${d.name}`
            }
            aria-pressed={dept === d.name}
            className={`w-full grid items-center gap-2 px-3 py-2 text-left border-b border-b-line_hair border-l-2 transition-colors ${
              dept === d.name
                ? "bg-row_selected border-row_selected_border"
                : "border-transparent hover:bg-fill_soft"
            }`}
            style={{ gridTemplateColumns: LANDING_COLS }}
          >
            <span
              className={`min-w-0 text-[13px] truncate ${
                dept === d.name
                  ? "font-bold text-content"
                  : "font-medium text-content"
              }`}
            >
              {d.name}
            </span>

            {/* The bar measures this period's sales and nothing
                else, so it is navy and ungraded: a bar's length is
                not a verdict. */}
            <span className="flex items-center gap-2 min-w-0">
              <span className="flex-1 h-3 rounded bg-bkg min-w-0">
                <span
                  className="block h-full rounded bg-brand_navy"
                  style={{
                    width: `${landing.top > 0 ? Math.max(2, (d.ty / landing.top) * 100) : 0}%`,
                  }}
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
      })}

      {landing.shown.length === 0 && (
        <div className="flex items-center justify-center py-8 text-[12px] text-content">
          No departments
        </div>
      )}
    </div>

    <p className="flex-shrink-0 px-3 py-1.5 border-t border-line_hair text-[12px] leading-snug text-content/95">
      Click a sub department to see its items.
    </p>
  </>
);

export default DeptShareList;
