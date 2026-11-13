// Utils
import { SIDE_FILL } from "../../utils";
import { HOT_CELL, TABLE_COLS } from "../utils";

// Interfaces
import type { Bucket, StandRow } from "../interfaces";

interface CompareStandTableProps {
  rows: StandRow[];
  /** The bucket the carousel shows. */
  open: Bucket;
  onOpen: (b: Bucket) => void;
}

/** Where each list's items stand: per bucket, a bar for its share of the
 *  list, the count and the change against last week. The bucket behind each
 *  list's verdict is tinted; a row opens its items in the carousel. */
const CompareStandTable = ({ rows, open, onOpen }: CompareStandTableProps) => (
  <section>
    <div className="flex items-baseline pb-1 border-b border-line_field">
      <span className="cc-caps text-[10px]">Where the items stand</span>
      <span className="ml-auto text-[10.5px] text-content">items | change vs LW</span>
    </div>
    {rows.map((r) => (
      <button
        key={r.bucket}
        onClick={() => onOpen(r.bucket)}
        aria-pressed={open === r.bucket}
        title={`Show these items in the carousel`}
        className={`${TABLE_COLS} w-full h-7 border-b border-line_hair text-left text-[12px] text-content tabular-nums hover:bg-fill_soft ${
          open === r.bucket ? "cc-row-selected" : ""
        }`}
      >
        <span className={`truncate pl-1 ${open === r.bucket ? "font-semibold" : ""}`}>{r.label}</span>
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
      </button>
    ))}
  </section>
);

export default CompareStandTable;
