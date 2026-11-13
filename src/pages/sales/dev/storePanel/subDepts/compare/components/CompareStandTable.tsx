// Utils
import { BUCKET_DOT, STAND_COLS } from "../utils";

// Interfaces
import type { Bucket, StandCell, StandRow } from "../interfaces";

// Components
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import ListBadge from "../../components/ListBadge";
import CompareSectionHead from "./CompareSectionHead";

interface CompareStandTableProps {
  names: [string, string];
  rows: StandRow[];
  /** Each list's change against last week, the four this-week rows added up. */
  net: [{ text: string; down: boolean }, { text: string; down: boolean }];
  /** The bucket the carousel shows. */
  open: Bucket;
  onOpen: (b: Bucket) => void;
}

/** Where each list's items stand, as the investigation Summary's rows: a dot,
 *  the bucket, each list's item count and change against last week, and a
 *  chevron. Each list's columns are named and captioned; the last-year row,
 *  which has no last week, says "vs LY". Picking a row slides the carousel. */
const CompareStandTable = ({ names, rows, net, open, onOpen }: CompareStandTableProps) => {
  const amountClass = (c: StandCell) =>
    c.tone === "down" ? "text-delta_negative_text" : c.tone === "up" ? "text-delta_positive_text" : "";
  const cell = (c: StandCell) => (
    <span className="grid grid-cols-[22px_minmax(0,1fr)] gap-2 items-baseline whitespace-nowrap">
      <span className="text-right text-[12px]">{c.count || "—"}</span>
      <span className={`text-right text-[12.5px] font-semibold ${amountClass(c)}`}>
        {c.amount}
        {c.note ? <span className="ml-1 text-[10px] font-medium text-content">{c.note}</span> : null}
      </span>
    </span>
  );
  return (
    <section>
      <CompareSectionHead title="Where the items stand" />
      <div className={`${STAND_COLS} px-2 pt-1`}>
        <span />
        <span />
        {(["A", "B"] as const).map((side, i) => (
          <span key={side} className="flex items-center justify-end gap-1.5 min-w-0">
            <ListBadge side={side} />
            <span className="truncate text-[12px] font-semibold text-content">{names[i]}</span>
          </span>
        ))}
        <span />
      </div>
      <div className={`${STAND_COLS} px-2 pb-1 border-b border-line_hair`}>
        <span />
        <span />
        {[0, 1].map((i) => (
          <span key={i} className="grid grid-cols-[22px_minmax(0,1fr)] gap-2">
            <span className="cc-caps text-[10px] text-right">Items</span>
            <span className="cc-caps text-[10px] text-right">vs LW</span>
          </span>
        ))}
        <span />
      </div>
      {rows.map((r) => {
        const on = open === r.bucket;
        const empty = r.cells.every((c) => !c.count);
        return (
          <button
            key={r.bucket}
            type="button"
            onClick={() => onOpen(r.bucket)}
            aria-pressed={on}
            className={`${STAND_COLS} w-full h-9 px-2 rounded-md border text-left text-content tabular-nums transition-colors ${
              on ? "cc-row-selected" : "border-transparent hover:bg-fill_soft"
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${empty ? "bg-bkg" : BUCKET_DOT[r.bucket]}`} />
            <span className={`truncate text-[12.5px] ${on ? "font-semibold" : ""}`}>{r.label}</span>
            {cell(r.cells[0])}
            {cell(r.cells[1])}
            <ChevronRightIcon className={`w-3.5 h-3.5 ${on ? "text-brand_navy" : "text-brand_slate_2"}`} />
          </button>
        );
      })}
      <div className={`${STAND_COLS} px-2 h-9 mt-1 border-t border-line_hair text-[12.5px] tabular-nums`}>
        <span />
        <span className="text-content">Net vs LW</span>
        {net.map((n, i) => (
          <span key={i} className={`text-right font-semibold ${n.down ? "text-delta_negative_text" : "text-delta_positive_text"}`}>
            {n.text}
          </span>
        ))}
        <span />
      </div>
    </section>
  );
};

export default CompareStandTable;
