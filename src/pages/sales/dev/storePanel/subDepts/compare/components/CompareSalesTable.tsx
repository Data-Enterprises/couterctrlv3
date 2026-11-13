// Utils
import { SHEET_COLS, pctClass, pctText } from "../utils";

// Interfaces
import type { SalesRow } from "../interfaces";

// Components
import CompareSheetCaption from "./CompareSheetCaption";

interface CompareSalesTableProps {
  rows: SalesRow[];
}

/** Sales: this week, last week and last year for each list, with this week's
 *  change against each in red or green text. */
const CompareSalesTable = ({ rows }: CompareSalesTableProps) => (
  <section>
    <CompareSheetCaption title="Sales" cols={["Sales", "This wk vs"]} />
    <div>
      {rows.map((r) => (
        <div
          key={r.label}
          className={`${SHEET_COLS} h-9 px-2 rounded-md even:bg-row_stripe text-[12.5px] text-content tabular-nums`}
        >
          <span className="truncate">{r.label}</span>
          {r.cells.map((c, i) => (
            <span key={i} className="contents">
              <span className={`text-right ${r.now ? "font-bold" : ""}`}>
                {c.fig}
              </span>
              <span
                className={`text-right font-semibold ${c.pct === null ? "" : pctClass(c.pct)}`}
              >
                {c.pct === null ? "" : pctText(c.pct)}
              </span>
            </span>
          ))}
          <span />
        </div>
      ))}
    </div>
  </section>
);

export default CompareSalesTable;
