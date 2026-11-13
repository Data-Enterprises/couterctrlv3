// Utils
import { pillClass } from "../../../../../../../utils/severity";
import { TABLE_COLS, pctText } from "../utils";

// Interfaces
import type { SalesRow } from "../interfaces";

interface CompareSalesTableProps {
  rows: SalesRow[];
  names: [string, string];
  /** The item threshold the changes grade against, as the items do. */
  threshold: number;
}

/** This week, then last week and last year with each list's change graded
 *  against the item threshold. */
const CompareSalesTable = ({ rows, names, threshold }: CompareSalesTableProps) => (
  <section>
    <div className={`${TABLE_COLS} pb-1.5 px-0.5 border-b border-line_field`}>
      <span className="cc-caps text-[10.5px]">Sales</span>
      <span className="cc-caps text-[10.5px] text-right truncate">A | {names[0]}</span>
      <span className="cc-caps text-[10.5px] text-right truncate">B | {names[1]}</span>
    </div>
    {rows.map((r) => (
      <div key={r.label} className={`${TABLE_COLS} h-9 px-0.5 border-b border-line_hair text-[13px] text-content tabular-nums`}>
        <span>{r.label}</span>
        {r.cells.map((c, i) => (
          <span key={i} className="flex items-center justify-end gap-2 whitespace-nowrap">
            <span className="text-[11.5px]">{c.sub}</span>
            {c.pct !== null ? (
              <span className={`cc-tag min-w-[64px] text-right text-[12px] ${pillClass(c.pct, threshold)}`}>
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
