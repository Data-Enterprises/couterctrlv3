// Utils
import { BUCKET_DOT, HOT_CELL, STAND_COLS } from "../utils";

// Interfaces
import type { Bucket, StandCell, StandRow } from "../interfaces";

// Components
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import ListBadge from "../../components/ListBadge";
import CompareSectionHead from "./CompareSectionHead";

interface CompareStandTableProps {
  rows: StandRow[];
  /** Each list's change against last week, the four this-week rows added up. */
  net: [{ text: string; down: boolean }, { text: string; down: boolean }];
  /** The bucket the carousel shows. */
  open: Bucket;
  onOpen: (b: Bucket) => void;
}

/** Where each list's items stand, as the investigation Summary's rows: a dot,
 *  the bucket, each list's count and what those items did, and a chevron.
 *  Picking a row slides the carousel to its items. The buckets behind each
 *  list's verdict are tinted; the net line shows the rows add up to the week. */
const CompareStandTable = ({ rows, net, open, onOpen }: CompareStandTableProps) => {
  const amountClass = (c: StandCell) =>
    c.tone === "down" ? "text-delta_negative_text" : c.tone === "up" ? "text-delta_positive_text" : "";
  const cell = (c: StandCell) => (
    <span className={`flex items-center justify-end gap-2 h-7 px-1.5 rounded whitespace-nowrap ${c.hot ? HOT_CELL : ""}`}>
      <span className="text-[12px]">{c.count ? `${c.count} items` : "—"}</span>
      <span className={`w-[78px] text-right text-[12.5px] font-bold ${amountClass(c)}`}>{c.amount}</span>
    </span>
  );
  return (
    <section>
      <CompareSectionHead title="Where the items stand" />
      <div className={`${STAND_COLS} px-2 pt-1 pb-0.5`}>
        <span />
        <span />
        {(["A", "B"] as const).map((side) => (
          <span key={side} className="flex justify-end pr-1.5">
            <ListBadge side={side} />
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
            className={`${STAND_COLS} w-full px-2 py-0.5 rounded-md border text-left text-content tabular-nums transition-colors ${
              on ? "cc-row-selected" : "border-transparent hover:bg-fill_soft"
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${empty ? "bg-bkg" : BUCKET_DOT[r.bucket]}`} />
            <span className={`truncate text-[13px] ${on ? "font-semibold" : ""}`}>{r.label}</span>
            {cell(r.cells[0])}
            {cell(r.cells[1])}
            <ChevronRightIcon className={`w-3.5 h-3.5 ${on ? "text-brand_navy" : "text-brand_slate_2"}`} />
          </button>
        );
      })}
      <div className={`${STAND_COLS} px-2 h-8 mt-1 border-t border-line_hair text-[12.5px] tabular-nums`}>
        <span />
        <span className="text-content">Net vs LW</span>
        {net.map((n, i) => (
          <span key={i} className={`text-right pr-1.5 font-bold ${n.down ? "text-delta_negative_text" : "text-delta_positive_text"}`}>
            {n.text}
          </span>
        ))}
        <span />
      </div>
    </section>
  );
};

export default CompareStandTable;
