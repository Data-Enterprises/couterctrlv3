// Utils
import { SIDE_FILL } from "../../utils";
import { HOT_CELL, TABLE_COLS } from "../utils";

// Interfaces
import type { StandRow } from "../interfaces";

interface CompareStandTableProps {
  rows: StandRow[];
}

/** Where each list's items stand: per bucket, a bar for its share of the
 *  list, the count and what those items did. The bucket behind each list's
 *  verdict is tinted. */
const CompareStandTable = ({ rows }: CompareStandTableProps) => (
  <section>
    <div className={`${TABLE_COLS} pb-1.5 px-0.5 border-b border-line_field`}>
      <span className="cc-caps text-[10.5px]">Where the items stand</span>
      <span className="cc-caps text-[10.5px] text-right">Items | change vs LW</span>
      <span className="cc-caps text-[10.5px] text-right">Items | change vs LW</span>
    </div>
    {rows.map((r) => (
      <div key={r.bucket} className={`${TABLE_COLS} h-9 px-0.5 border-b border-line_hair text-[13px] text-content tabular-nums`}>
        <span className="truncate">{r.label}</span>
        {r.cells.map((c) => (
          <span
            key={c.side}
            className={`flex items-center justify-end gap-2 px-1.5 py-1 rounded-md whitespace-nowrap ${c.hot ? HOT_CELL : ""}`}
          >
            <span className="w-[54px] h-2 rounded bg-fill_track overflow-hidden">
              <span className={`block h-full ${SIDE_FILL[c.side]}`} style={{ width: `${c.share}%` }} />
            </span>
            <span className="w-6 text-right font-semibold">{c.count || "—"}</span>
            <span
              className={`w-[92px] text-right font-semibold ${
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
