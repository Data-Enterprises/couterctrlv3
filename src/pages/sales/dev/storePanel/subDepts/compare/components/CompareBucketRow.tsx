// Utils
import { BUCKET_DOT, SHEET_COLS } from "../utils";

// Interfaces
import type { Bucket, StandCell, StandRow } from "../interfaces";

// Components
import { ChevronRightIcon } from "@heroicons/react/20/solid";

interface CompareBucketRowProps {
  row: StandRow;
  open: Bucket;
  onOpen: (b: Bucket) => void;
}

/** One bucket: its dot and name, each list's item count and figure, and a
 *  chevron. Picking it slides the carousel to its items. */
const CompareBucketRow = ({ row, open, onOpen }: CompareBucketRowProps) => {
  const on = open === row.bucket;
  const empty = row.cells.every((c) => !c.count);
  const tone = (c: StandCell) =>
    c.tone === "down" ? "text-delta_negative_text" : c.tone === "up" ? "text-delta_positive_text" : "";
  return (
    <button
      type="button"
      onClick={() => onOpen(row.bucket)}
      aria-pressed={on}
      className={`${SHEET_COLS} w-full h-9 px-2 rounded-md border text-left text-[12.5px] text-content tabular-nums transition-colors ${
        on ? "cc-row-selected" : "border-transparent border-b-line_hair hover:bg-fill_soft"
      }`}
    >
      <span className={`flex items-center gap-2 min-w-0 ${on ? "font-semibold" : ""}`}>
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${empty ? "bg-bkg" : BUCKET_DOT[row.bucket]}`} />
        <span className="truncate">{row.label}</span>
      </span>
      {row.cells.map((c) => (
        <span key={c.side} className="contents">
          <span className="text-right">{c.count || "—"}</span>
          <span className={`text-right font-semibold whitespace-nowrap ${tone(c)}`}>{c.amount || "—"}</span>
        </span>
      ))}
      <ChevronRightIcon className={`w-3.5 h-3.5 -ml-1 ${on ? "text-brand_navy" : "text-brand_slate_2"}`} />
    </button>
  );
};

export default CompareBucketRow;
