// Utils
import { SIDE_FILL } from "../../utils";
import { HOT_CELL, TABLE_COLS } from "../utils";

// Interfaces
import type { StandRow } from "../interfaces";

interface CompareStandTableProps {
  rows: StandRow[];
}

/** Where each list's items stand: per bucket, a bar for its share of the
 *  list, the count and the change against last week. The bucket behind each
 *  list's verdict is tinted. */
const CompareStandTable = ({ rows }: CompareStandTableProps) => (
  <section>
    <div className="flex items-baseline pb-1 border-b border-line_field">
      <span className="cc-caps text-[10px]">Where the items stand</span>
      <span className="ml-auto text-[10.5px] text-content">items | change vs LW</span>
    </div>
    {rows.map((r) => (
      <div key={r.bucket} className={`${TABLE_COLS} h-7 border-b border-line_hair text-[12px] text-content tabular-nums`}>
        <span className="truncate">{r.label}</span>
        {r.cells.map((c) => (
          <span
            key={c.side}
            className={`flex items-center justify-end gap-2 px-1.5 h-6 rounded whitespace-nowrap ${c.hot ? HOT_CELL : ""}`}
          >
            <span className="w-10 h-1.5 rounded bg-fill_track overflow-hidden">
              <span className={`block h-full ${SIDE_FILL[c.side]}`} style={{ width: `${c.share}%` }} />
            </span>
            <span className="w-6 text-right font-semibold">{c.count || "—"}</span>
            <span
              className={`w-[84px] text-right font-semibold ${
                c.tone === "down" ? "text-delta_negative_text" : c.tone === "up" ? "text-delta_positive_text" : ""
              }`}
            >
              {c.amount}
            </span>
          </span>
        ))}
      </div>
    ))}
  </section>
);

export default CompareStandTable;
