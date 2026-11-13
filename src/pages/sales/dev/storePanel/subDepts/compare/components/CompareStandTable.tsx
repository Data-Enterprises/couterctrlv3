// Utils
import { SIDE_FILL } from "../../utils";
import { HOT_BAR, HOT_CELL, MIRROR_COLS } from "../utils";

// Interfaces
import type { Bucket, StandCell, StandRow } from "../interfaces";

// Components
import CompareSectionHead from "./CompareSectionHead";

interface CompareStandTableProps {
  rows: StandRow[];
  /** Each list's change against last week, the four this-week rows added up. */
  net: [{ text: string; down: boolean }, { text: string; down: boolean }];
  /** The bucket the carousel shows. */
  open: Bucket;
  onOpen: (b: Bucket) => void;
}

/** Where each list's items stand, mirrored: per bucket, what those items did,
 *  how many, and a bar for their share, growing out from the centre. The
 *  buckets behind each list's verdict are tinted; a row opens its items in the
 *  carousel. The net line shows the rows add up to the week. */
const CompareStandTable = ({ rows, net, open, onOpen }: CompareStandTableProps) => {
  const amountClass = (c: StandCell) =>
    c.tone === "down" ? "text-delta_negative_text" : c.tone === "up" ? "text-delta_positive_text" : "";
  return (
    <section className="flex flex-col">
      <CompareSectionHead title="Where the items stand" note="items | change vs LW" />
      {rows.map((r) => {
        const [a, b] = r.cells;
        const on = open === r.bucket;
        return (
          <button
            key={r.bucket}
            onClick={() => onOpen(r.bucket)}
            aria-pressed={on}
            title="Show these items in the carousel"
            className={`${MIRROR_COLS} w-full h-[42px] mt-1 rounded-lg border text-content tabular-nums hover:bg-fill_soft ${
              on ? "border-line_strong bg-fill_soft" : "border-transparent"
            }`}
          >
            <span className={`flex items-center justify-end gap-2 h-full pr-2 rounded-l-lg ${a.hot ? HOT_CELL : ""}`}>
              <span className={`w-[84px] text-right text-[12.5px] font-semibold whitespace-nowrap ${amountClass(a)}`}>{a.amount}</span>
              <span className="w-6 text-right text-[13.5px] font-bold">{a.count || "—"}</span>
              <span className="flex justify-end w-16 h-2.5 rounded-sm bg-fill_track overflow-hidden">
                <span className={`block h-full rounded-sm ${a.hot ? HOT_BAR : SIDE_FILL.A}`} style={{ width: `${a.share}%` }} />
              </span>
            </span>
            <span className={`text-center text-[12.5px] leading-tight ${on ? "font-bold" : "font-semibold"}`}>{r.label}</span>
            <span className={`flex items-center gap-2 h-full pl-2 rounded-r-lg ${b.hot ? HOT_CELL : ""}`}>
              <span className="w-16 h-2.5 rounded-sm bg-fill_track overflow-hidden">
                <span className={`block h-full rounded-sm ${b.hot ? HOT_BAR : SIDE_FILL.B}`} style={{ width: `${b.share}%` }} />
              </span>
              <span className="w-6 text-[13.5px] font-bold">{b.count || "—"}</span>
              <span className={`w-[84px] text-[12.5px] font-semibold whitespace-nowrap ${amountClass(b)}`}>{b.amount}</span>
            </span>
          </button>
        );
      })}
      <div className={`${MIRROR_COLS} h-9 mt-1 border-t border-line_hair text-[12.5px] tabular-nums`}>
        <span className={`text-right pr-3 font-bold ${net[0].down ? "text-delta_negative_text" : "text-delta_positive_text"}`}>{net[0].text}</span>
        <span className="text-center text-content">Net vs LW</span>
        <span className={`pl-3 font-bold ${net[1].down ? "text-delta_negative_text" : "text-delta_positive_text"}`}>{net[1].text}</span>
      </div>
    </section>
  );
};

export default CompareStandTable;
