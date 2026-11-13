// Utils
import { pillClass } from "../../../../../../../utils/severity";
import { TABLE_COLS, pctText } from "../utils";

// Interfaces
import type { SalesRow } from "../interfaces";

// Components
import ListBadge from "../../components/ListBadge";

interface CompareSalesTableProps {
  rows: SalesRow[];
  names: [string, string];
  /** The item threshold the changes grade against, as the items do. */
  threshold: number;
}

/** This week, then last week and last year with each list's change graded
 *  against the item threshold. Its heading names the two columns. */
const CompareSalesTable = ({ rows, names, threshold }: CompareSalesTableProps) => (
  <section>
    <div className={`${TABLE_COLS} pb-1 border-b border-line_field`}>
      <span className="cc-caps text-[10px]">Sales</span>
      {(["A", "B"] as const).map((side, i) => (
        <span key={side} className="flex items-center justify-end gap-1.5 min-w-0">
          <ListBadge side={side} />
          <span className="truncate text-[11.5px] font-semibold text-content">{names[i]}</span>
        </span>
      ))}
    </div>
    {rows.map((r) => (
      <div key={r.label} className={`${TABLE_COLS} h-7 border-b border-line_hair text-[12px] text-content tabular-nums`}>
        <span>{r.label}</span>
        {r.cells.map((c, i) => (
          <span key={i} className="flex items-center justify-end gap-2 whitespace-nowrap">
            <span className="text-[11px]">{c.sub}</span>
            {c.pct !== null ? (
              <span className={`cc-tag min-w-[60px] py-0 text-right text-[11.5px] ${pillClass(c.pct, threshold)}`}>
                {pctText(c.pct)}
              </span>
            ) : (
              <span className="font-bold">{c.main}</span>
            )}
          </span>
        ))}
      </div>
    ))}
  </section>
);

export default CompareSalesTable;
